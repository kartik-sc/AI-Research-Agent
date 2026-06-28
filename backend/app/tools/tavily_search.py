from app.core.cache import get_cached, set_cached
from app.core.config import settings
from app.core.retry import async_retry


@async_retry(max_attempts=3, backoff_factor=2.0)
async def tavily_search(query: str, max_results: int = 5) -> list[dict]:
    if not settings.tavily_api_key:
        return []

    cached = await get_cached("tavily", query)
    if cached is not None:
        return cached

    from tavily import AsyncTavilyClient

    client = AsyncTavilyClient(api_key=settings.tavily_api_key)
    response = await client.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        include_raw_content=False,
    )
    results = [
        {
            "url": r.get("url", ""),
            "title": r.get("title", ""),
            "content": r.get("content", "")[:800],
            "score": r.get("score", 0.5),
            "source_type": "web",
        }
        for r in response.get("results", [])
        if r.get("url")
    ]
    await set_cached("tavily", query, results)
    return results
