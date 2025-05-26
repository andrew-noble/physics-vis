from pydantic import BaseModel
from typing import Optional, List
from schemas.fbd import Fbd

class MessageType(BaseModel):
    id: str
    role: str
    content: str

class FbdGenerationRequest(BaseModel):
    prompt: str

class AgentRequest(BaseModel):
    messages: List[MessageType]
    diagramData: Optional[Fbd] = None

class AgentResponse(BaseModel):
    message: str
    diagramData: Optional[Fbd] = None

class StreamSession(BaseModel):
    sessionId: str