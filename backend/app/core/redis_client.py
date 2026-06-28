import json

import redis.asyncio as aioredis

from app.core.config import settings

_redis: aioredis.Redis | None = None

_EVENT_TTL = 86_400  # 24 h


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def push_event(session_id: str, event: dict) -> None:
    r = await get_redis()
    key = f"events:{session_id}"
    await r.rpush(key, json.dumps(event, default=str))
    await r.expire(key, _EVENT_TTL)


async def get_new_events(session_id: str, from_index: int) -> list[dict]:
    r = await get_redis()
    raw: list[str] = await r.lrange(f"events:{session_id}", from_index, -1)
    return [json.loads(e) for e in raw]


async def mark_complete(session_id: str, payload: dict) -> None:
    r = await get_redis()
    await r.set(f"complete:{session_id}", json.dumps(payload, default=str), ex=_EVENT_TTL)


async def get_complete(session_id: str) -> dict | None:
    r = await get_redis()
    raw = await r.get(f"complete:{session_id}")
    return json.loads(raw) if raw else None
