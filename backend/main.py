#!/usr/bin/env python3

import os
import json
import datetime
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
from schema.fbd import Fbd
from gen_prompt import generation_system_prompt
from req_logging import log_fbd_generation
from pydantic import ValidationError
from fastapi.responses import JSONResponse
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Pydantic models for request validation
class FbdGenerationRequest(BaseModel):
    prompt: str

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

GENERATION_MODEL = "o3-mini"

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/test")
@limiter.limit("5/minute")
async def test(request: Request):
    return {"message": "Hello, World!"}

@app.post("/fbd", response_model=Fbd)
@limiter.limit("10/minute")
async def generate_fbd(request: Request, data: FbdGenerationRequest):
    api_start_time = time.perf_counter()
    try:
        response = await client.beta.chat.completions.parse(
            model=GENERATION_MODEL,
            messages=[{"role": "system", "content": generation_system_prompt}, {"role": "user", "content": data.prompt}],
            response_format=Fbd
        )
        fbd_data_dict = json.loads(response.choices[0].message.content)
        api_duration = time.perf_counter() - api_start_time

        print(f"API duration: {api_duration} with model {GENERATION_MODEL}")

        log_fbd_generation(
            endpoint="/generate-fbd",
            system_prompt=generation_system_prompt,
            user_prompt=data.prompt,
            response_data=fbd_data_dict,
            model=GENERATION_MODEL,
            api_duration=api_duration
        )

        return Fbd(**fbd_data_dict)
    except ValidationError as e:
        print(e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
# @app.get("/resistor-network", response_model=CircuitWithLayout)
# def send_resistor_network(request: Request):
#     try:
#         with open("example_circuit_layouts/resistor_network.json", "r") as f:
#             data = json.load(f)
#         return CircuitWithLayout(**data)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# Configure logging manually
logging.basicConfig(
    format="[%(asctime)s] [%(levelname)s] - %(message)s",
    level=logging.DEBUG
)

# uvicorn is a webserver, sorta like node. (asynchronous server gateway node, asgn)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run('main:app', host="0.0.0.0", port=8000, reload=True, log_level="debug", access_log=True)