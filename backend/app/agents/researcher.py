import asyncio

from app.core.redis_client import push_event
from app.models.schemas import AgentEvent
from app.tools.arxiv_search import arxiv_search
from app.tools.exa_search import exa_search
from app.tools.tavily_search import tavily_search


async def run_researcher(state: dict) -> dict:
    """
    Invoked via LangGraph Send() — receives {sub_question, mode, session_id}.
    Returns partial updates that accumulate into ResearchState via operator.add.
    """
    sub_question: str = state["sub_question"]
    mode: str = state["mode"]
    session_id: str = state["session_id"]

    events: list[AgentEvent] = []

    thinking = AgentEvent(
        agent_name="Researcher",
        event_type="thinking",
        message=f"Searching: {sub_question[:80]}",
    )
    events.append(thinking)
    await push_event(session_id, thinking.model_dump(mode="json"))

    # Build task list based on research mode
    tasks = [tavily_search(sub_question)]
    if mode == "academic":
        tasks.append(arxiv_search(sub_question))
    if mode == "deep":
        tasks.extend([arxiv_search(sub_question), exa_search(sub_question)])

    batches = await asyncio.gather(*tasks, return_exceptions=True)

    seen_urls: set[str] = set()
    merged: list[dict] = []
    for batch in batches:
        if isinstance(batch, Exception):
            continue
        for result in batch:
            url = result.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                merged.append(result)

    action = AgentEvent(
        agent_name="Researcher",
        event_type="action",
        message=f"Retrieved {len(merged)} unique results for: {sub_question[:60]}",
    )
    events.append(action)
    await push_event(session_id, action.model_dump(mode="json"))

    return {
        "search_results": merged,
        "agent_events": events,
    }
