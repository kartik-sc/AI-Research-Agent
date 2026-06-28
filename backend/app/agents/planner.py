import json

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings
from app.core.redis_client import push_event
from app.models.schemas import AgentEvent
from app.models.state import ResearchState

_SYSTEM = (
    "You are a research planning agent. Decompose the given research query "
    "into 3-5 focused, non-overlapping sub-questions that together give complete coverage. "
    "Return ONLY a JSON array of strings. No markdown, no explanation."
)


async def run_planner(state: ResearchState) -> dict:
    query = state["query"]
    session_id = state["session_id"]

    thinking = AgentEvent(
        agent_name="Planner",
        event_type="thinking",
        message=f"Decomposing: {query}",
    )
    await push_event(session_id, thinking.model_dump(mode="json"))

    llm = ChatGoogleGenerativeAI(
        model=settings.planner_model,
        google_api_key=settings.google_api_key,
        temperature=0.2,
    )

    try:
        response = await llm.ainvoke(
            [SystemMessage(content=_SYSTEM), HumanMessage(content=query)]
        )
        raw = response.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
        sub_questions: list[str] = json.loads(raw)
        if not isinstance(sub_questions, list):
            raise ValueError("LLM did not return a list")
    except Exception:
        # Fallback: treat the whole query as a single sub-question
        sub_questions = [query]

    sub_questions = [q for q in sub_questions if isinstance(q, str)][:5]

    complete = AgentEvent(
        agent_name="Planner",
        event_type="complete",
        message=f"Created {len(sub_questions)} sub-questions",
    )
    await push_event(session_id, complete.model_dump(mode="json"))

    return {
        "sub_questions": sub_questions,
        "agent_events": [thinking, complete],
    }
