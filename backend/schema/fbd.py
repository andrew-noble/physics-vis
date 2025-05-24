from pydantic import BaseModel, Field
from enum import Enum
from typing import List

# ---------- primitive enums ----------
class ForceType(str, Enum):
    APPLIED = "applied"
    REACTION = "reaction"
    COMPONENT = "component"
    NET = "net"
    FICTITIOUS = "fictitious"

class Location(str, Enum):
    TOP = "top"
    BOTTOM = "bottom"
    LEFT = "left"
    RIGHT = "right"
    CENTROID = "centroid"

class BodyShape(str, Enum):
    SQUARE = "square"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"

class MomentDirection(str, Enum):
    CLOCKWISE = "cw"
    COUNTER_CLOCKWISE = "ccw"

# ---------- payload structs ----------
class Body(BaseModel):
    id: str = Field(..., description="Unique identifier for the body")
    shape: BodyShape = Field(..., description="Shape of the body")
    angle: float = Field(..., description="Angle in degrees")

class Force(BaseModel):
    label: str = Field(..., description="Label for the force")
    name: str = Field(..., description="Name of the force")
    unit: str = Field(..., description="Unit of measurement")
    magnitude: float = Field(..., description="Magnitude of the force")
    angle: float = Field(..., description="Angle in degrees")
    location: Location = Field(..., description="Location of the force")
    type: ForceType = Field(..., description="Type of force")

class Moment(BaseModel):
    label: str = Field(..., description="Label for the moment")
    name: str = Field(..., description="Name of the moment")
    unit: str = Field(..., description="Unit of measurement")
    magnitude: float = Field(..., description="Magnitude of the moment")
    direction: MomentDirection = Field(..., description="Direction of the moment")
    location: Location = Field(..., description="Location of the moment")

class Axes(BaseModel):
    rotation: float = Field(..., description="Rotation in degrees")

class Fbd(BaseModel):
    body: Body = Field(..., description="Body information")
    forces: List[Force] = Field(..., description="List of forces")
    moments: List[Moment] = Field(..., description="List of moments")
    axes: Axes = Field(..., description="Axes information")