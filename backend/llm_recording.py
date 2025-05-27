import os
import json
import datetime

def record_fbd_draw(model, duration, prompt, fbd_json):
    log_file = "./logs/fbd_draw_logs.jsonl"
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "model": model,
        "duration": duration,
        "prompt": prompt,
        "fbd_json": fbd_json,
    }
    
    # Append the new log entry
    with open(log_file, "a") as f:
        json.dump(log_entry, f)
        f.write("\n")  # Add newline to separate entries


def record_agent_thinking(model, duration):
    log_file = "./logs/agent_thinking_logs.jsonl"
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "model": model,
        "duration": duration,
    }
    
    # Append the new log entry
    with open(log_file, "a") as f:
        json.dump(log_entry, f)
        f.write("\n")  # Add newline to separate entries
