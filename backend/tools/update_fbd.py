from openai import AsyncOpenAI
import os
import json
from prompts.fbd_update_prompt import fbd_update_prompt
from schemas.fbd import Fbd
from constants import DIAGRAM_UPDATE_MODEL
import time
from fastapi import HTTPException
import logging

log = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def update_fbd(args: dict):
    try:
        start_time = time.perf_counter()
        
        # Convert the current FBD to a string representation
        current_fbd = json.dumps(args["fbd_json"], indent=2)
        
        # Create the user message combining current FBD and instructions
        user_message = f"Current FBD:\n{current_fbd}\n\nInstructions: {args["instructions"]}"
        
        response = await client.beta.chat.completions.parse(
            model=DIAGRAM_UPDATE_MODEL,
            messages=[
                {"role": "system", "content": fbd_update_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format=Fbd
        )
        
        fbd_data_dict = json.loads(response.choices[0].message.content)
        duration = time.perf_counter() - start_time

        log.info(f"FBD update duration: {duration} with model {DIAGRAM_UPDATE_MODEL}")
        
        return fbd_data_dict

    except Exception as e:
        log.info(e, "error in update_fbd")
        raise HTTPException(status_code=500, detail=str(e))
