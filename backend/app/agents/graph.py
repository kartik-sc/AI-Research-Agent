from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.agents.critic import run_critic
from app.agents.planner import run_planner
from app.agents.researcher import run_researcher
from app.agents.writer import run_writer
from app.models.state import ResearchState


def _dispatch_to_researchers(state: ResearchState) -> list[Send]:
    """Fan-out: one researcher invocation per sub-question, all run in parallel."""
    return [
        Send(
            "researcher",
            {
                "sub_question": q,
                "mode": state["mode"],
                "session_id": state["session_id"],
            },
        )
        for q in state["sub_questions"]
    ]


def _route_after_research(state: ResearchState) -> str:
    """Fan-in routing: skip Critic in quick mode."""
    return "writer" if state["mode"] == "quick" else "critic"


def build_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    graph.add_node("planner", run_planner)
    graph.add_node("researcher", run_researcher)
    graph.add_node("critic", run_critic)
    graph.add_node("writer", run_writer)

    # START → planner
    graph.add_edge(START, "planner")

    # planner → researchers (fan-out via Send)
    graph.add_conditional_edges("planner", _dispatch_to_researchers, ["researcher"])

    # researchers → critic or writer (fan-in, routes once after all complete)
    graph.add_conditional_edges(
        "researcher",
        _route_after_research,
        {"critic": "critic", "writer": "writer"},
    )

    # critic → writer → END
    graph.add_edge("critic", "writer")
    graph.add_edge("writer", END)

    return graph.compile()


research_graph = build_graph()
