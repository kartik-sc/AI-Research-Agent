import hashlib
import json
import logging

from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

_CACHE_TTL = 3600  # 1 hour


def _key(tool_name: str, query: str) -> str:
    qhash = hashlib.sha256(query.lower().strip().encode()).hexdigest()[:20]
    return f"search:{tool_name}:{qhash}"


async def get_cached(tool_name: str, query: str) -> list[dict] | None:
    try:
        r = await get_redis()
        raw = await r.get(_key(tool_name, query))
        if raw:
            logger.debug("[cache hit] %s: %s", tool_name, query[:40])
            return json.loads(raw)
    except Exception as exc:
        logger.debug("[cache] get failed: %s", exc)
    return None


async def set_cached(tool_name: str, query: str, results: list[dict]) -> None:
    try:
        r = await get_redis()
        await r.set(_key(tool_name, query), json.dumps(results, default=str), ex=_CACHE_TTL)
    except Exception as exc:
        logger.debug("[cache] set failed: %s", exc)
