from app.core.config import settings


async def tavily_search(query: str, max_results: int = 5) -> list[dict]:
    if not settings.tavily_api_key:
        return []

    from tavily import AsyncTavilyClient

    client = AsyncTavilyClient(api_key=settings.tavily_api_key)
    response = await client.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        include_raw_content=False,
    )
    return [
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
