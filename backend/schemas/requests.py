from pydantic import BaseModel
from typing import Optional
from schemas.fbd import Fbd

class FbdGenerationRequest(BaseModel):
    prompt: str

class AgentRequest(BaseModel):
    prompt: str
    data: Optional[Fbd] = None
