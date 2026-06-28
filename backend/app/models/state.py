from typing import Annotated, Literal, NotRequired
from typing_extensions import TypedDict
import operator

from app.models.schemas import AgentEvent, KnowledgeEdge, KnowledgeNode, Source


class ResearchState(TypedDict):
    query: str
    session_id: str
    mode: Literal["quick", "deep", "academic"]

    # Filled by Planner
    sub_questions: list[str]

    # Per-researcher field — injected by Send(), absent in main state
    sub_question: NotRequired[str]

    # Filled by Researchers (accumulated across parallel invocations)
    search_results: Annotated[list[dict], operator.add]

    # Filled by Critic
    verified_results: list[dict]

    # Final source list (accumulated by Critic, or synthesised in quick mode)
    sources: Annotated[list[Source], operator.add]

    # Streamed to frontend
    agent_events: Annotated[list[AgentEvent], operator.add]

    # Filled by Writer
    report: str
    knowledge_nodes: list[KnowledgeNode]
    knowledge_edges: list[KnowledgeEdge]

    error: str | None
