#!/usr/bin/env python3

import os
import json
from fastapi import FastAPI, HTTPException, Request
from typing import AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from dotenv import load_dotenv
from schemas.api import AgentRequest, StreamSession
from utils.message_utils import trim_context, inject_diagram_data
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import logging.config
from tools.tool_list import tool_list_for_llm, tool_handlers
from constants import AGENT_MODEL, ALLOWED_ORIGINS, DEFAULT_HOST, DEFAULT_PORT, FBD_MODEL
import uuid
import time
from llm_recording import record_fbd_draw, record_agent_thinking

load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

os.makedirs("logs", exist_ok=True)
with open("logging_config.json") as f:
    log_config = json.load(f)
logging.config.dictConfig(log_config)

log = logging.getLogger(__name__)

app = FastAPI(title="FBD Generation API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
log.info("OpenAI client initialized")

# just for dev, will need to move to Redis for prod
stream_sessions: dict[str, dict] = {} 

@app.get("/test")
async def test():
    log.debug("Test endpoint called")
    return {"message": "Hello, World!"}
    
@app.post("/stream-sessions", response_model=StreamSession)
@limiter.limit("10/minute") # limiter needs the Request, even if we don't use
def request_stream_session(request: Request, data: AgentRequest) -> StreamSession:
    session_id = str(uuid.uuid4())
    log.info(f"Starting stream session: {session_id}")
    log.debug(f"Request data: {data.model_dump_json()}")

    # prep messages by applying rolling window and injecting diagram
    messages = trim_context(data.messages)
    log.debug(f"Trimmed context: {len(messages)} messages")
    
    messages = inject_diagram_data(messages, data.diagramData)
    log.debug("Diagram data injected into messages")

    # store session
    stream_sessions[session_id] = {
        "messages": messages,
        "diagram_data": data.diagramData,
    }
    log.info(f"Session stored. Active sessions: {len(stream_sessions)}")

    return StreamSession(sessionId=session_id)

@app.get("/stream-sessions/{session_id}/events")
@limiter.limit("10/minute")
async def receive_event_stream(request: Request, session_id: str):
    log.info(f"Streaming events for session: {session_id}")
    if session_id not in stream_sessions:
        log.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")

    # helper function for streaming responses
    def sse_event(event_type, data):
        # event: <type>\ndata: <json>\n\n
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"

    async def event_stream() -> AsyncGenerator[str, None]:
        messages = stream_sessions[session_id]["messages"]
        log.debug(f"Starting event stream with {len(messages)} messages")

        agent_start_time = time.perf_counter()
        try:
            while True:
                # think
                log.info(f"Making LLM thinking call with model {AGENT_MODEL}")
                response = await client.chat.completions.create(
                    model=AGENT_MODEL,
                    messages=messages,
                    tools=tool_list_for_llm,
                    stream=True,
                )
                thinking_duration = time.perf_counter() - agent_start_time
                record_agent_thinking(AGENT_MODEL, thinking_duration)

                log.debug("Received streaming response from OpenAI")

                pending_calls: dict[int, dict] = {}   # index → {id, name, arguments}
                announced: set[int] = set()           # to avoid duplicate "tool_call" events

                # must be async bc the response object is an async iterator
                async for chunk in response:
                    delta = chunk.choices[0].delta

                    # if just a message shard, emit. (may need to buffer later)
                    if delta.content:
                        log.debug(f"Emitting message shard: {delta.content[:50]}...")
                        yield sse_event("ai_message_shard", delta.content)

                    # if tool shard, compile into complete calls and emit once per call
                    for tc in (delta.tool_calls or []):
                        entry = pending_calls.setdefault(tc.index,
                                                        {"id": None, "name": None, "arguments": ""})

                        if tc.id:
                            entry["id"] = tc.id
                        if tc.function.arguments:
                            entry["arguments"] += tc.function.arguments
                        if tc.function.name:
                            entry["name"] = tc.function.name
                            if tc.index not in announced:          # first shard with a name
                                announced.add(tc.index)
                                log.info(f"Tool call announced: {entry['name']}")
                                yield sse_event("tool_call", {"name": entry["name"]})

                
                
                # if no tool calls, the agent is done
                if not pending_calls:
                    log.info("Agent is done")
                    yield sse_event("complete", {})
                    agent_duration = time.perf_counter() - agent_start_time
                    log.info(f"Agent turn took {agent_duration} seconds")
                    return

                # act - run the tool calls
                for tool_call in pending_calls.values():
                    try:
                        tool_id = tool_call["id"]
                        tool_name = tool_call["name"]
                        tool_args = json.loads(tool_call["arguments"])
                        
                        log.info(f"Executing tool: {tool_name}")
                        log.debug(f"Tool arguments: {tool_args}")
                        
                        # Append the model's function call message to context
                        messages.append({
                            "role": "assistant",
                            "tool_calls": [{
                                "id": tool_id,
                                "type": "function",
                                "function": {
                                    "name": tool_name,
                                    "arguments": tool_call["arguments"]
                                }
                            }]
                        })
                        
                        tool_func = tool_handlers[tool_name]
                        start_time = time.perf_counter()
                        tool_result = await tool_func(tool_args)
                        draw_duration = time.perf_counter() - start_time

                        # TODO: need more robust evals/monitoring later. This won't scale past 1 tool
                        record_fbd_draw(FBD_MODEL, draw_duration, tool_args["instructions"], tool_result)

                        # Append the tool result message to context
                        messages.append({"role": "tool", "tool_call_id": tool_id, "content": json.dumps(tool_result)})

                        log.info(f"Tool execution successful: {tool_name}")
                        log.debug(f"Tool result: {tool_result}")

                        # emit tool result to client.
                        # TODO: This will need to be refactored if/when we have tool results that aren't diagram data
                        yield sse_event("tool_result", tool_result)

                    except Exception as e:
                        log.error(f"Tool execution failed: {tool_name}", exc_info=True)
                        raise HTTPException(status_code=400, detail=f"Error calling tool: {str(e)}")

        except Exception as e:
            log.error("Agent error occurred", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
        
    # this return happens before event_stream() ever runs, btw
    return StreamingResponse(event_stream(), media_type="text/event-stream")

# uvicorn is a webserver, sorta like node. (asynchronous server gateway node, asgn)
if __name__ == "__main__":
    import uvicorn
    log.info(f"Starting server on {DEFAULT_HOST}:{DEFAULT_PORT}")
    uvicorn.run('main:app', host=DEFAULT_HOST, port=DEFAULT_PORT, reload=True, log_level="info", access_log=False)