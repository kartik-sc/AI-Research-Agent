import asyncio

from app.core.cache import get_cached, set_cached
from app.core.config import settings
from app.core.retry import async_retry


@async_retry(max_attempts=3, backoff_factor=2.0)
async def exa_search(query: str, max_results: int = 5) -> list[dict]:
    if not settings.exa_api_key:
        return []

    cached = await get_cached("exa", query)
    if cached is not None:
        return cached

    def _sync() -> list[dict]:
        from exa_py import Exa

        client = Exa(api_key=settings.exa_api_key)
        response = client.search_and_contents(
            query,
            num_results=max_results,
            use_autoprompt=True,
            type="neural",
            text={"max_characters": 800},
        )
        return [
            {
                "url": r.url,
                "title": r.title or "",
                "content": r.text or "",
                "score": 0.75,
                "source_type": "web",
                "published_date": r.published_date,
            }
            for r in response.results
        ]

    results = await asyncio.to_thread(_sync)
    await set_cached("exa", query, results)
    return results
