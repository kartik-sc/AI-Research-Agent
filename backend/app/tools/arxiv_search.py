import asyncio


async def arxiv_search(query: str, max_results: int = 5) -> list[dict]:
    def _sync() -> list[dict]:
        import arxiv

        client = arxiv.Client()
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance,
        )
        results = []
        for paper in client.results(search):
            authors = ", ".join(a.name for a in paper.authors[:3])
            if len(paper.authors) > 3:
                authors += " et al."
            published = paper.published.strftime("%Y-%m-%d") if paper.published else None
            results.append(
                {
                    "url": paper.entry_id,
                    "title": paper.title,
                    "content": paper.summary[:800],
                    "score": 0.9,
                    "source_type": "academic",
                    "published_date": published,
                    "snippet": f"Authors: {authors}. Published: {published}.",
                }
            )
        return results

    return await asyncio.to_thread(_sync)
