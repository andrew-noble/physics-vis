# API Constants
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Physics Visualization API"

# Model Choices
FBD_MODEL = "o3-mini"
AGENT_MODEL = "gpt-4.1"

# Context Constants
MAX_CONTEXT_MESSAGES = 20

# Server Constants
import os
DEFAULT_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
DEFAULT_PORT = int(os.getenv("BACKEND_PORT", "8000"))

# CORS Constants
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173/physics-vis/")
ALLOWED_ORIGINS = [
    "http://localhost:5173/physics-vis/",  # Vite default dev server
    "http://localhost:3000/physics-vis/",  # Alternative dev server
    FRONTEND_URL,  # Production or custom frontend URL
]

