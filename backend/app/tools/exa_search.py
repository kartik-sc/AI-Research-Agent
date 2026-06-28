import asyncio

from app.core.config import settings


async def exa_search(query: str, max_results: int = 5) -> list[dict]:
    if not settings.exa_api_key:
        return []

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
        results = []
        for r in response.results:
            results.append(
                {
                    "url": r.url,
                    "title": r.title or "",
                    "content": r.text or "",
                    "score": 0.75,
                    "source_type": "web",
                    "published_date": r.published_date,
                }
            )
        return results

    return await asyncio.to_thread(_sync)
