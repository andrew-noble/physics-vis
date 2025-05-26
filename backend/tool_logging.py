import os
import json
import datetime
import time

# Simple logging function
def log_tool_call(tool_name, tool_args, model, system_prompt, user_prompt, result, duration):
    log_file = "./logs/tool_call_logs.jsonl"
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "tool_name": tool_name,
        "model": model,
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "result": result,
        "duration": duration
    }
    
    # Append the new log entry
    with open(log_file, "a") as f:
        json.dump(log_entry, f)
        f.write("\n")  # Add newline to separate entries    


# try this later!

# def tool_call_logging_decorator(model, system_prompt, user_prompt):
#     def intermediate_wrapper(func):
#         async def wrapper(*args, **kwargs):
#             start_time = time.perf_counter()
#             result = await func(*args, **kwargs)
#             end_time = time.perf_counter()

#             log_tool_call(model, system_prompt, user_prompt, result, end_time - start_time)

#             return result
#         return wrapper
#     return intermediate_wrapper