from pydantic import BaseModel

class AgentResponse(BaseModel):
    message: str
    data: dict