#!/usr/bin/env python3

import os
import json
import datetime
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from dotenv import load_dotenv
from schemas.fbd import Fbd
from schemas.api import AgentResponse, AgentRequest, FbdGenerationRequest
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

@app.get("/test")
@limiter.limit("5/minute")
async def test(request: Request):
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

@app.post("/agent", response_model=AgentResponse)
@limiter.limit("10/minute")
async def agent_endpoint(request: Request, data: AgentRequest = Body(...)):

    messages = [{"role": "system", "content": agent_prompt}, *data.messages]
    messages = trim_context(messages)  # Apply rolling window
    messages = add_diagram_data(messages, data.diagramData)
    tool_result = {}  # Initialize tool_result

    try:
        while True:
            # think
            response = await client.chat.completions.create(
                model=AGENT_MODEL,
                messages=messages,
                tools=tool_list_for_llm,
            )

            # act
            if response.choices[0].message.tool_calls:
                for tool_call in response.choices[0].message.tool_calls:
                    try:
                        tool_call_id = tool_call.id
                        tool_name = tool_call.function.name
                        tool_args = json.loads(tool_call.function.arguments)
                        tool_func = tool_handlers[tool_name]
                        tool_result = await tool_func(tool_args)

                        # observe 1: add tool call message to context
                        messages.append(response.choices[0].message)
                        
                    except Exception as e:
                        log.info(f"Tool error ({tool_name}): {str(e)}")
                        raise HTTPException(status_code=400, detail=f"Error calling tool: {tool_name}")
                    
                    log.info(f"Tool result: {tool_result}")
                    
                # observe 2: add tool result to context
                messages.append({"role": "tool", "tool_call_id": tool_call_id, "content": json.dumps(tool_result)})
            
            # stop
            else:
                break

    except Exception as e:
        log.info(f"Agent error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
    
    return AgentResponse(
        message=response.choices[0].message.content,
        data=tool_result or {}
    )

# uvicorn is a webserver, sorta like node. (asynchronous server gateway node, asgn)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run('main:app', host="0.0.0.0", port=8000, reload=True, log_level="info", access_log=False)