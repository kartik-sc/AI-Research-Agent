from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.agents.critic import run_critic
from app.agents.github_agent import run_github_agent
from app.agents.huggingface_agent import run_huggingface_agent
from app.agents.planner import run_planner
from app.agents.researcher import run_researcher
from app.agents.writer import run_writer
from app.models.state import ResearchState


def _dispatch_all_agents(state: ResearchState) -> list[Send]:
    """Fan-out: researchers in parallel + optional GitHub / HuggingFace agents."""
    flags: dict = state.get("topic_flags") or {}

    sends: list[Send] = [
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

    if flags.get("is_technical"):
        sends.append(
            Send(
                "github_agent",
                {
                    "query": state["query"],
                    "mode": state["mode"],
                    "session_id": state["session_id"],
                },
            )
        )

    if flags.get("involves_ai_model"):
        sends.append(
            Send(
                "huggingface_agent",
                {
                    "query": state["query"],
                    "mode": state["mode"],
                    "session_id": state["session_id"],
                },
            )
        )

    return sends


def _route_after_branch(state: dict) -> str:
    """Fan-in routing: skip Critic in quick mode."""
    return "writer" if state.get("mode") == "quick" else "critic"


def build_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    graph.add_node("planner", run_planner)
    graph.add_node("researcher", run_researcher)
    graph.add_node("github_agent", run_github_agent)
    graph.add_node("huggingface_agent", run_huggingface_agent)
    graph.add_node("critic", run_critic)
    graph.add_node("writer", run_writer)

    graph.add_edge(START, "planner")

    graph.add_conditional_edges(
        "planner",
        _dispatch_all_agents,
        ["researcher", "github_agent", "huggingface_agent"],
    )

    # All parallel branches share the same fan-in routing
    for branch in ("researcher", "github_agent", "huggingface_agent"):
        graph.add_conditional_edges(
            branch,
            _route_after_branch,
            {"critic": "critic", "writer": "writer"},
        )

    graph.add_edge("critic", "writer")
    graph.add_edge("writer", END)

    return graph.compile()


research_graph = build_graph()
