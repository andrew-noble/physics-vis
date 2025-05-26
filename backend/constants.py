from enum import Enum

# API Constants
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Physics Visualization API"

# Model Choices
FBD_MODEL = "o3-mini"
AGENT_MODEL = "gpt-4.1"

# Context Constants
MAX_CONTEXT_MESSAGES = 20

# Server Constants
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000

# CORS Constants
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

