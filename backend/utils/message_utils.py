from typing import List
from schemas.fbd import Fbd
from prompts.agent_prompt import agent_prompt
from constants import MAX_CONTEXT_MESSAGES

def trim_context(messages: List[dict], max_messages: int = MAX_CONTEXT_MESSAGES) -> List[dict]:
    """Keep only the most recent messages while preserving system message."""
    system_message = {"role": "developer", "content": agent_prompt}
    
    if len(messages) < max_messages:
        return [system_message, *messages]
    
    # Trim to most recent messages
    recent_messages = messages[-max_messages+1:]

    # always prepend the system prompt
    return [system_message, *recent_messages]

def inject_diagram_data(messages: List[dict], diagram_data: Fbd) -> List[dict]:
    """Add diagram data to the context."""
    messages[-1].content += f"\n\nCurrent free body diagram the user is looking at: {diagram_data}"
    return messages 

def inject_scene_description(messages: List[dict], scene_description: str) -> List[dict]:
    """Add scene description to the context."""
    messages[-1].content += f"\n\nCurrent scene description that the user is looking at: {scene_description}"
    return messages 