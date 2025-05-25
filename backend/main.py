#!/usr/bin/env python3

import os
import json
import datetime
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from dotenv import load_dotenv
from schemas.fbd import Fbd
from schemas.responses import AgentResponse
from schemas.requests import AgentRequest, FbdGenerationRequest
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
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/test")
@limiter.limit("5/minute")
async def test(request: Request):
    return {"message": "Hello, World!"}

@app.post("/fbd", response_model=Fbd)
@limiter.limit("10/minute")
async def generate_fbd_endpoint(request: Request, data: FbdGenerationRequest):
    api_start_time = time.perf_counter()
    try:
        response = await client.beta.chat.completions.parse(
            model=DIAGRAM_CREATION_MODEL,
            messages=[{"role": "system", "content": fbd_generation_prompt}, {"role": "user", "content": data.prompt}],
            response_format=Fbd
        )
        fbd_data_dict = json.loads(response.choices[0].message.content)
        api_duration = time.perf_counter() - api_start_time

        log.info(f"API duration: {api_duration} with model {DIAGRAM_CREATION_MODEL}")

        log_fbd_generation(
            endpoint="/generated",
            system_prompt=fbd_generation_prompt,
            user_prompt=data.prompt,
            response_data=fbd_data_dict,
            model=DIAGRAM_CREATION_MODEL,
            api_duration=api_duration
        )

        return Fbd(**fbd_data_dict)
    except ValidationError as e:
        log.info(e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log.info(e)
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/agent", response_model=AgentResponse)
@limiter.limit("10/minute")
async def agent_endpoint(request: Request, data: AgentRequest):

    messages = [{"role": "system", "content": agent_prompt}, {"role": "user", "content": data.prompt}]

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