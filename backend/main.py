#!/usr/bin/env python3

import os
import json
import datetime
from fastapi import FastAPI, HTTPException, Request
from typing import AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from dotenv import load_dotenv
from schemas.fbd import Fbd
from schemas.api import AgentResponse, AgentRequest, FbdGenerationRequest, StreamSession
from prompts.agent_prompt import agent_prompt
from prompts.fbd_generation_prompt import fbd_generation_prompt
from req_logging import log_fbd_generation
from pydantic import ValidationError
from fastapi.responses import JSONResponse
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from tools.tool_list import tool_list_for_llm, tool_handlers
from constants import DIAGRAM_CREATION_MODEL, AGENT_MODEL
import sys
import uuid

load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# configure logging
logging.basicConfig(
    handlers=[logging.StreamHandler(sys.stdout)],
    level=logging.INFO,
    format="[%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

app = FastAPI(title="FBD Generation API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# just for dev, will need to move to Redis for prod
stream_sessions: dict[str, dict] = {} 

@app.get("/test")
async def test():
    return {"message": "Hello, World!"}
    
def trim_context(messages: list, max_messages: int = 10) -> list:
    """Keep only the most recent messages while preserving system message."""
    if len(messages) <= max_messages:
        return messages
    
    # Always keep the system message
    system_message = messages[0]
    # Get the most recent messages
    recent_messages = messages[-max_messages+1:]
    return [system_message, *recent_messages]

def add_diagram_data(messages: list, diagram_data: Fbd) -> list:
    """Add diagram data to the context."""
    messages[-1].content += f"\n\nCurrent diagram data: {diagram_data}"
    return messages

@app.post("/stream-sessions", response_model=StreamSession)
@limiter.limit("10/minute") # limiter needs the Request, even if we don't use
def request_stream_session(request: Request, data: AgentRequest) -> StreamSession:
    session_id = str(uuid.uuid4())
    log.info(f"Starting stream session: {session_id}")

    # prep messages by applying rolling window and injecting diagram
    messages = trim_context(data.messages)
    messages = add_diagram_data(messages, data.diagramData)

    # store session
    stream_sessions[session_id] = {
        "messages": messages,
        "diagram_data": data.diagramData,
    }

    return StreamSession(sessionId=session_id)

@app.get("/stream-sessions/{session_id}/events")
@limiter.limit("10/minute")
async def receive_event_stream(request: Request, session_id: str):
    log.info(f"Streaming events for session: {session_id}")
    if session_id not in stream_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # helper function for streaming responses
    def sse_event(event_type, data):
        # event: <type>\ndata: <json>\n\n
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


    async def event_stream() -> AsyncGenerator[str, None]:
        messages = stream_sessions[session_id]["messages"]

        try:
            while True:
                # think
                log.info(f"Agent is thinking...")
                response = await client.chat.completions.create(
                    model=AGENT_MODEL,
                    messages=messages,
                    tools=tool_list_for_llm,
                    stream=True,
                )

                pending_calls: dict[int, dict] = {}   # index → {id, name, arguments}
                announced: set[int] = set()           # to avoid duplicate "tool_call" events

                # must be async bc the response object is an async iterator
                async for chunk in response:
                    delta = chunk.choices[0].delta

                    # if just a message shard, emit. (may need to buffer later)
                    if delta.content:
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
                                yield sse_event("tool_call", {"name": entry["name"]})

                
                
                # if no tool calls, the agent is done
                if not pending_calls:
                    log.info("Agent is done!")
                    yield sse_event("complete", {})
                    break

                # act - run the tool calls
                for tool_call in pending_calls.values():
                    try:
                        tool_id = tool_call["id"]
                        tool_name = tool_call["name"]
                        tool_args = json.loads(tool_call["arguments"])
                        
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
                        tool_result = await tool_func(tool_args)

                        # Append the tool result message to context
                        messages.append({"role": "tool", "tool_call_id": tool_id, "content": json.dumps(tool_result)})

                        log.info(f"Agent called tool: {tool_name} with args: {tool_args} and got result: {tool_result}")

                        # emit tool result to client.
                        # TODO: This will need to be refactored if/when we have tool results that aren't diagram data
                        yield sse_event("tool_result", tool_result)

                    except Exception as e:
                        log.info(f"Tool error: {str(e)}")
                        raise HTTPException(status_code=400, detail=f"Error calling tool: {str(e)}")

        except Exception as e:
            log.info(f"Agent error: {str(e)}")
            
            raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
        
    # this return happens before event_stream() ever runs, btw
    return StreamingResponse(event_stream(), media_type="text/event-stream")

# uvicorn is a webserver, sorta like node. (asynchronous server gateway node, asgn)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run('main:app', host="0.0.0.0", port=8000, reload=True, log_level="info", access_log=False)