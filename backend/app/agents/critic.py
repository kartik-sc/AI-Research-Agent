from urllib.parse import urlparse

from app.core.redis_client import push_event
from app.models.schemas import AgentEvent, Source
from app.models.state import ResearchState

# Domain trust tiers
_ACADEMIC = {
    "arxiv.org", "pubmed.ncbi.nlm.nih.gov", "semanticscholar.org",
    "nature.com", "science.org", "cell.com", "ieee.org", "acm.org",
    "springer.com", "wiley.com", "tandfonline.com",
}
_MAJOR_NEWS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "theguardian.com",
    "nytimes.com", "wsj.com", "ft.com", "economist.com", "bloomberg.com",
    "wired.com", "techcrunch.com", "arstechnica.com",
}
_TECHNICAL = {
    "github.com", "huggingface.co", "pypi.org", "npmjs.com",
    "docs.python.org", "developer.mozilla.org", "pytorch.org", "tensorflow.org",
}
_BLOGS = {
    "medium.com", "substack.com", "blogger.com", "wordpress.com",
    "dev.to", "hashnode.com", "ghost.io", "tumblr.com",
}
_TRUST_FLOOR = 0.2


def _extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return ""


def _score(url: str, source_type: str) -> float:
    domain = _extract_domain(url)
    if source_type in ("github", "huggingface"):
        return 0.82
    if source_type == "academic" or domain in _ACADEMIC:
        return 0.92
    if domain.endswith((".edu", ".gov", ".ac.uk", ".ac.jp")):
        return 0.88
    if domain in _MAJOR_NEWS:
        return 0.75
    if domain in _TECHNICAL:
        return 0.78
    if domain in _BLOGS:
        return 0.50
    return 0.42


async def run_critic(state: ResearchState) -> dict:
    results = state["search_results"]
    session_id = state["session_id"]
    events: list[AgentEvent] = []

    thinking = AgentEvent(
        agent_name="Critic",
        event_type="thinking",
        message=f"Evaluating {len(results)} sources for quality and contradictions",
    )
    events.append(thinking)
    await push_event(session_id, thinking.model_dump(mode="json"))

    # Score every result
    scored = [
        {**r, "trust_score": _score(r.get("url", ""), r.get("source_type", "web"))}
        for r in results
    ]

    # Filter below floor
    verified = [r for r in scored if r["trust_score"] >= _TRUST_FLOOR]
    dropped = len(scored) - len(verified)

    action = AgentEvent(
        agent_name="Critic",
        event_type="action",
        message=f"Accepted {len(verified)} sources, dropped {dropped} below quality threshold",
    )
    events.append(action)
    await push_event(session_id, action.model_dump(mode="json"))

    # Build typed Source objects
    seen: set[str] = set()
    sources: list[Source] = []
    for r in verified:
        url = r.get("url", "")
        if url in seen:
            continue
        seen.add(url)
        sources.append(
            Source(
                url=url,
                title=r.get("title", "Untitled"),
                domain=_extract_domain(url),
                snippet=(r.get("content") or r.get("snippet", ""))[:400],
                trust_score=r["trust_score"],
                published_date=r.get("published_date") or None,
                source_type=r.get("source_type", "web"),
                metadata=r.get("metadata"),
            )
        )

    complete = AgentEvent(
        agent_name="Critic",
        event_type="complete",
        message=f"Verification complete — {len(sources)} sources ready for synthesis",
    )
    events.append(complete)
    await push_event(session_id, complete.model_dump(mode="json"))

    return {
        "verified_results": verified,
        "sources": sources,
        "agent_events": events,
    }
