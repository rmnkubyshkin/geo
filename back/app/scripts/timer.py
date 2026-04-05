import time
import functools
from flask import current_app
from datetime import datetime

def timer_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        duration = (end - start) * 1000
        print(f"[TIMER] {func.__name__} выполнен за {duration:.2f} мс")
        return result
    return wrapper

class QueryTimer: 
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start = None
    
    def __enter__(self):
        self.start = time.time()
        return self
    
    def __exit__(self, *args):
        if self.start is not None:
            duration = (time.time() - self.start) * 1000
            print(f"[TIMER] {self.operation_name} выполнен за {duration:.2f} мс")
            
            try:
                current_app.logger.info(f"{self.operation_name} выполнен за {duration:.2f} мс")
            except RuntimeError:
                pass

def log_execution_time(func):
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        start = time.time()
        result = func(self, *args, **kwargs)
        duration = (time.time() - start) * 1000
        print(f"[TIMER] {self.__class__.__name__}.{func.__name__} выполнен за {duration:.2f} мс")
        return result
    return wrapper