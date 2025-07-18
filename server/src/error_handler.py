"""
Standardized error handling utilities for the API.
"""
from functools import wraps
from fastapi import HTTPException
from src.logger import log
from src.config import ERROR_MESSAGES


def handle_api_errors(error_key: str, status_code: int = 500):
    """
    Decorator to standardize error handling across API endpoints.

    Args:
        error_key: Key from ERROR_MESSAGES to use for error detail
        status_code: HTTP status code to return (default: 500)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                # Re-raise HTTP exceptions as-is
                raise
            except Exception as e:
                error_message = ERROR_MESSAGES.get(error_key, "An unexpected error occurred")
                log.error(f"{error_message}: {e}")
                raise HTTPException(status_code=status_code, detail=error_message)
        return wrapper
    return decorator


def log_and_raise_http_exception(error_key: str, exception: Exception, status_code: int = 500):
    """
    Utility function to log an error and raise a standardized HTTPException.

    Args:
        error_key: Key from ERROR_MESSAGES to use for error detail
        exception: The original exception that occurred
        status_code: HTTP status code to return (default: 500)
    """
    error_message = ERROR_MESSAGES.get(error_key, "An unexpected error occurred")
    log.error(f"{error_message}: {exception}")
    raise HTTPException(status_code=status_code, detail=error_message)
