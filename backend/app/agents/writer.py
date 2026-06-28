import json
from urllib.parse import urlparse

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.models import ModelRouter
from app.core.redis_client import push_event
from app.models.schemas import AgentEvent, KnowledgeEdge, KnowledgeNode, Source
from app.models.state import ResearchState

_REPORT_SYSTEM = """You are a technical research writer. Generate a structured markdown report.

Format (use exactly these section headers):

## Executive Summary
3-4 sentences summarising the key answer.

## [Title derived from sub-question 1]
Answer with inline citations like [1], [2]. Be specific and factual.

## [Title derived from sub-question 2]
...repeat for each sub-question...

## Key Insights
- Concise bullet list of the most important findings
- Note any conflicts between sources explicitly

## Open Questions
1. First unanswered question
2. ...up to 5 items

## Sources
[1] Title — URL
[2] Title — URL
...

Rules:
- Every factual claim must have at least one citation
- Citation numbers map to the numbered sources list
- Flag contradictions between sources where found
- Write in clear, technical prose"""

_GRAPH_SYSTEM = """You are an entity extraction agent. Extract the key concepts, entities, and relationships from this research report.
Return ONLY valid JSON with this exact structure:
{
  "nodes": [
    {"id": "string", "label": "string", "type": "concept|person|paper|model|framework|dataset", "description": "one sentence"}
  ],
  "edges": [
    {"source": "node_id", "target": "node_id", "label": "relationship verb", "strength": 0.5}
  ]
}
Limit to 20 nodes and 30 edges max. Focus on the most important relationships.
strength is a float from 0.1 to 1.0 indicating relationship importance.
node id values must be short kebab-case strings matching the ids in nodes array exactly.
Return only JSON, no markdown fences, no explanation."""


def _build_quick_sources(search_results: list[dict]) -> list[Source]:
    seen: set[str] = set()
    sources: list[Source] = []
    for r in search_results:
        url = r.get("url", "")
        if not url or url in seen:
            continue
        seen.add(url)
        try:
            domain = urlparse(url).netloc.lower().lstrip("www.")
        except Exception:
            domain = ""
        sources.append(
            Source(
                url=url,
                title=r.get("title", "Untitled"),
                domain=domain,
                snippet=(r.get("content") or "")[:400],
                trust_score=r.get("score", 0.5),
                published_date=r.get("published_date"),
                source_type=r.get("source_type", "web"),
                metadata=r.get("metadata"),
            )
        )
    return sources


async def _extract_knowledge_graph(
    report: str,
    router: ModelRouter,
) -> tuple[list[KnowledgeNode], list[KnowledgeEdge]]:
    try:
        raw = await router.call(
            "entity_extraction",
            [SystemMessage(content=_GRAPH_SYSTEM), HumanMessage(content=f"Research report:\n\n{report[:6000]}")],
            temperature=0.1,
        )
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)

        nodes = [
            KnowledgeNode(
                id=n["id"],
                label=n["label"],
                type=n.get("type", "concept"),
                description=n.get("description", ""),
            )
            for n in data.get("nodes", [])[:20]
        ]
        valid_ids = {n.id for n in nodes}
        edges = [
            KnowledgeEdge(
                source=e["source"],
                target=e["target"],
                label=e.get("label", "relates to"),
                strength=max(0.1, min(1.0, float(e.get("strength", 0.5)))),
            )
            for e in data.get("edges", [])[:30]
            if e.get("source") in valid_ids and e.get("target") in valid_ids
        ]
        return nodes, edges
    except Exception:
        return [], []


async def run_writer(state: ResearchState) -> dict:
    query = state["query"]
    mode = state["mode"]
    session_id = state["session_id"]
    sub_questions = state.get("sub_questions") or [query]
    sources: list[Source] = list(state.get("sources") or [])
    events: list[AgentEvent] = []

    if not sources:
        sources = _build_quick_sources(state.get("search_results") or [])

    thinking = AgentEvent(
        agent_name="Writer",
        event_type="thinking",
        message=f"Synthesising {len(sources)} sources into structured report",
    )
    events.append(thinking)
    await push_event(session_id, thinking.model_dump(mode="json"))

    router = ModelRouter(mode=mode)

    sources_block = "\n".join(
        f"[{i + 1}] {s.title} ({s.source_type}, trust: {s.trust_score:.2f})\n{s.snippet}"
        for i, s in enumerate(sources[:30])
    )
    sub_q_block = "\n".join(f"- {q}" for q in sub_questions)

    try:
        report = await router.call(
            "synthesis",
            [
                SystemMessage(content=_REPORT_SYSTEM),
                HumanMessage(
                    content=(
                        f"Research query: {query}\n\n"
                        f"Sub-questions:\n{sub_q_block}\n\n"
                        f"Sources:\n{sources_block}"
                    )
                ),
            ],
            temperature=0.3,
        )
    except Exception as exc:
        report = f"# {query}\n\n*Report generation failed: {exc}*"

    drafted = AgentEvent(
        agent_name="Writer",
        event_type="action",
        message=f"Report drafted ({len(report.split())} words) — extracting knowledge graph",
    )
    events.append(drafted)
    await push_event(session_id, drafted.model_dump(mode="json"))

    knowledge_nodes, knowledge_edges = await _extract_knowledge_graph(report, router)

    complete = AgentEvent(
        agent_name="Writer",
        event_type="complete",
        message=f"Research complete · {len(knowledge_nodes)} concepts mapped",
    )
    events.append(complete)
    await push_event(session_id, complete.model_dump(mode="json"))

    return {
        "report": report,
        "sources": sources,
        "knowledge_nodes": knowledge_nodes,
        "knowledge_edges": knowledge_edges,
        "agent_events": events,
    }
