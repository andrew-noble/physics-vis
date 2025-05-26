from openai import AsyncOpenAI
import os
import json
from prompts.fbd_prompt import fbd_prompt
from schemas.fbd import Fbd
from constants import FBD_MODEL
import time
from fastapi import HTTPException
import logging

log = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def draw_fbd(args: dict):
    try:
        start_time = time.perf_counter()
        
        # Convert the current FBD to a string representation
        current_fbd = json.dumps(args["existing_fbd_json"], indent=2)
        
        # Create the user message combining current FBD and instructions
        user_message = f"Existing FBD:\n{current_fbd}\n\nInstructions: {args["instructions"]}"
        
        response = await client.beta.chat.completions.parse(
            model=FBD_MODEL,
            messages=[
                {"role": "system", "content": fbd_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format=Fbd
        )
        
        fbd_data_dict = json.loads(response.choices[0].message.content)
        duration = time.perf_counter() - start_time

        log.info(f"FBD draw duration: {duration} with model {FBD_MODEL}")
        
        return fbd_data_dict

    except Exception as e:
        log.info(e, "error in draw_fbd")
        raise HTTPException(status_code=500, detail=str(e))
