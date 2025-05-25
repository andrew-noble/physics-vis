#!/bin/bash

# Create FBD request
curl -X POST http://localhost:8000/agent -H "Content-Type: application/json" -d '{"prompt": "Create a free body diagram for a block on an plane inclined at 30 degrees"}'

# Update FBD request (using the sample diagram)
curl -X POST http://localhost:8000/agent -H "Content-Type: application/json" -d '{"prompt": "Add a force of 10N pushing the block up the incline", "data": {"body": {"id": "block1", "shape": "square", "angle": 30}, "forces": [{"label": "N", "name": "normal force", "unit": "N", "magnitude": 0, "angle": 120, "location": "centroid", "type": "reaction"}, {"label": "mg", "name": "weight", "unit": "N", "magnitude": 0, "angle": 270, "location": "centroid", "type": "applied"}, {"label": "F_f", "name": "frictional force", "unit": "N", "magnitude": 0, "angle": 30, "location": "bottom", "type": "reaction"}], "moments": [], "axes": {"rotation": 30}}}' 