import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.models import ModelRouter
from app.core.redis_client import push_event
from app.core.topic_detector import detect_topic
from app.models.schemas import AgentEvent
from app.models.state import ResearchState

_SYSTEM = (
    "You are a research planning agent. Decompose the given research query "
    "into 3-5 focused, non-overlapping sub-questions that together give complete coverage. "
    "Return ONLY a JSON array of strings. No markdown, no explanation."
)


async def run_planner(state: ResearchState) -> dict:
    query = state["query"]
    mode = state["mode"]
    session_id = state["session_id"]

    thinking = AgentEvent(
        agent_name="Planner",
        event_type="thinking",
        message=f"Decomposing: {query}",
    )
    await push_event(session_id, thinking.model_dump(mode="json"))

    router = ModelRouter(mode=mode)

    # Run decomposition and topic detection concurrently
    import asyncio

    async def _decompose() -> list[str]:
        try:
            raw = await router.call(
                "planning",
                [SystemMessage(content=_SYSTEM), HumanMessage(content=query)],
                temperature=0.2,
            )
            if "```" in raw:
                raw = raw.split("```")[1].lstrip("json").strip()
            sub_questions: list[str] = json.loads(raw)
            if not isinstance(sub_questions, list):
                raise ValueError("LLM did not return a list")
            return [q for q in sub_questions if isinstance(q, str)][:5]
        except Exception:
            return [query]

    sub_questions, topic_flags = await asyncio.gather(
        _decompose(),
        detect_topic(query),
    )

    complete = AgentEvent(
        agent_name="Planner",
        event_type="complete",
        message=(
            f"Created {len(sub_questions)} sub-questions"
            + (", GitHub search queued" if topic_flags.is_technical else "")
            + (", HuggingFace search queued" if topic_flags.involves_ai_model else "")
        ),
    )
    await push_event(session_id, complete.model_dump(mode="json"))

    return {
        "sub_questions": sub_questions,
        "topic_flags": topic_flags.model_dump(),
        "agent_events": [thinking, complete],
    }
