from openai import AsyncOpenAI
import os
import json
from prompts.fbd_generation_prompt import fbd_generation_prompt
from schemas.fbd import Fbd
from constants import DIAGRAM_CREATION_MODEL
import time
from fastapi import HTTPException
import logging

log = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def create_fbd(args: dict):
    try:
        start_time = time.perf_counter()
        response = await client.beta.chat.completions.parse(
            model=DIAGRAM_CREATION_MODEL,
            messages=[{"role": "system", "content": fbd_generation_prompt}, {"role": "user", "content": args["situation"]}],
            response_format=Fbd
        )
        fbd_data_dict = json.loads(response.choices[0].message.content)
        duration = time.perf_counter() - start_time

        log.info(f"FBD creation duration: {duration} with model {DIAGRAM_CREATION_MODEL}")

        return fbd_data_dict

    except Exception as e:
        log.info(e, "error in create_fbd")
        raise HTTPException(status_code=500, detail=str(e))