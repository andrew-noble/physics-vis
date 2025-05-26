from tools.draw_fbd import draw_fbd

tool_list = [
    {
        "type": "function",
        "function": {
            "name": "draw_fbd",
            "description": "Change the FBD JSON according to user instructions. If the FBD JSON is empty, create a new FBD from scratch.",
            "parameters": {
                "type": "object",
                "properties": {
                    "existing_fbd_json": {
                        "type": "string",                      # ← accept raw JSON text
                        "description": (
                            "The current FBD (as a JSON string). May be empty if a new FBD is being created."
                        )
                    },
                    "instructions": {
                        "type": "string",
                        "description": (
                            "Natural-language instructions for changing the FBD JSON or populating it from scratch"
                            "(e.g. “add a 5 N force to the right on the block”)."
                        )
                    }
                },
                "required": ["existing_fbd_json", "instructions"],
                "additionalProperties": False
            },
            "strict": True
        },
        "handler": draw_fbd
    }
]

# before sending to the LLM, strip out the handers bc they're not serializable
tool_list_for_llm = [{k: v for k, v in t.items() if k != "handler"} for t in tool_list]

# when the model calls a tool:
tool_handlers = {t["function"]["name"]: t["handler"] for t in tool_list}

