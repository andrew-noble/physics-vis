from tools.create_fbd import create_fbd
from tools.update_fbd import update_fbd


tool_list = [
    {
        "type": "function",
        "function": {
            "name": "create_fbd",
            "description": "Generate a JSON free-body diagram (FBD) from natural-language input.",
            "parameters": {
                "type": "object",
                "properties": {
                    "situation": {
                        "type": "string",
                        "description": "Natural-language description of the physical setup."
                    }
                },
                "required": ["situation"],
                "additionalProperties": False
            },
            "strict": True
        },
        "handler": create_fbd
    },

    {
        "type": "function",
        "function": {
            "name": "update_fbd",
            "description": "Modify an existing FBD JSON according to user instructions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "fbd_json": {
                        "type": "string",                      # ← accept raw JSON text
                        "description": (
                            "The current FBD (as a JSON string). "
                            "Must be valid JSON."
                        )
                    },
                    "instructions": {
                        "type": "string",
                        "description": (
                            "Natural-language instructions describing the changes "
                            "(e.g. “add a 5 N force to the right on the block”)."
                        )
                    }
                },
                "required": ["fbd_json", "instructions"],
                "additionalProperties": False
            },
            "strict": True
        },
        "handler": update_fbd
    }
]

# before sending to the LLM, strip out the handers bc they're not serializable
tool_list_for_llm = [{k: v for k, v in t.items() if k != "handler"} for t in tool_list]

# when the model calls a tool:
tool_handlers = {t["function"]["name"]: t["handler"] for t in tool_list}

