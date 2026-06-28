import asyncio
import functools
import logging
from typing import Callable, TypeVar

logger = logging.getLogger(__name__)
F = TypeVar("F", bound=Callable)


def async_retry(
    max_attempts: int = 3,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
):
    """Decorator that retries an async function with exponential backoff."""
    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc
                    if attempt < max_attempts - 1:
                        wait = backoff_factor ** attempt
                        logger.warning(
                            "[retry] %s attempt %d/%d failed: %s — retrying in %.1fs",
                            func.__name__, attempt + 1, max_attempts, exc, wait,
                        )
                        await asyncio.sleep(wait)
            raise last_exc  # type: ignore[misc]
        return wrapper  # type: ignore[return-value]
    return decorator
