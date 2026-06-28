import asyncio
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.agents.graph import research_graph
from app.core.database import ResearchSession, SessionLocal
from app.core.redis_client import (
    get_new_events,
    get_complete,
    mark_complete,
    push_event,
)
from app.models.schemas import (
    AgentEvent,
    KnowledgeEdge,
    KnowledgeNode,
    ResearchRequest,
    ResearchResponse,
    Source,
)
from app.models.state import ResearchState

router = APIRouter(prefix="/research", tags=["research"])

_SSE_POLL_INTERVAL = 0.2   # seconds
_SSE_TIMEOUT      = 300    # seconds


# ── POST /research ──────────────────────────────────────────────────────────

@router.post("", response_model=dict, status_code=202)
async def start_research(request: ResearchRequest) -> dict:
    session_id = request.session_id or str(uuid.uuid4())

    async with SessionLocal() as db:
        record = ResearchSession(
            id=session_id,
            query=request.query,
            mode=request.mode,
            status="running",
            created_at=datetime.utcnow(),
        )
        db.add(record)
        await db.commit()

    initial_state: ResearchState = {
        "query": request.query,
        "session_id": session_id,
        "mode": request.mode,
        "sub_questions": [],
        "search_results": [],
        "verified_results": [],
        "sources": [],
        "agent_events": [],
        "report": "",
        "error": None,
    }

    asyncio.create_task(_run_graph(session_id, initial_state))

    return {"session_id": session_id, "status": "started"}


# ── GET /research/stream/{session_id} ────────────────────────────────────────

@router.get("/stream/{session_id}")
async def stream_research(session_id: str) -> EventSourceResponse:
    async def _generator():
        cursor = 0
        elapsed = 0.0

        while elapsed < _SSE_TIMEOUT:
            # 1. Stream any new agent events from Redis
            new_events = await get_new_events(session_id, cursor)
            for raw in new_events:
                yield {"data": json.dumps(raw, default=str)}
            cursor += len(new_events)

            # 2. Check if graph has completed
            complete_payload = await get_complete(session_id)
            if complete_payload is not None:
                yield {"data": json.dumps(complete_payload, default=str)}
                return

            await asyncio.sleep(_SSE_POLL_INTERVAL)
            elapsed += _SSE_POLL_INTERVAL

        yield {"data": json.dumps({"type": "error", "message": "Stream timed out"})}

    return EventSourceResponse(_generator())


# ── GET /research/{session_id}/result ────────────────────────────────────────

@router.get("/{session_id}/result", response_model=ResearchResponse)
async def get_result(session_id: str) -> ResearchResponse:
    async with SessionLocal() as db:
        record = await db.get(ResearchSession, session_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if record.status != "complete":
        raise HTTPException(status_code=202, detail="Research still in progress")

    sources: list[Source] = []
    if record.sources_json:
        sources = [Source(**s) for s in json.loads(record.sources_json)]

    sub_questions: list[str] = []
    if record.sub_questions_json:
        sub_questions = json.loads(record.sub_questions_json)

    knowledge_nodes: list[KnowledgeNode] = []
    if record.knowledge_nodes_json:
        knowledge_nodes = [KnowledgeNode(**n) for n in json.loads(record.knowledge_nodes_json)]

    knowledge_edges: list[KnowledgeEdge] = []
    if record.knowledge_edges_json:
        knowledge_edges = [KnowledgeEdge(**e) for e in json.loads(record.knowledge_edges_json)]

    return ResearchResponse(
        session_id=session_id,
        status="complete",
        report=record.report or "",
        sources=sources,
        sub_questions=sub_questions,
        knowledge_nodes=knowledge_nodes,
        knowledge_edges=knowledge_edges,
    )


# ── Background graph runner ───────────────────────────────────────────────────

async def _run_graph(session_id: str, initial_state: ResearchState) -> None:
    try:
        final_state = await research_graph.ainvoke(initial_state)

        sources: list[Source] = final_state.get("sources") or []
        sub_questions: list[str] = final_state.get("sub_questions") or []
        report: str = final_state.get("report") or ""
        knowledge_nodes: list[KnowledgeNode] = final_state.get("knowledge_nodes") or []
        knowledge_edges: list[KnowledgeEdge] = final_state.get("knowledge_edges") or []

        # Persist to PostgreSQL
        async with SessionLocal() as db:
            record = await db.get(ResearchSession, session_id)
            if record:
                record.status = "complete"
                record.report = report
                record.sources_json = json.dumps(
                    [s.model_dump() for s in sources], default=str
                )
                record.sub_questions_json = json.dumps(sub_questions)
                record.knowledge_nodes_json = json.dumps(
                    [n.model_dump() for n in knowledge_nodes], default=str
                )
                record.knowledge_edges_json = json.dumps(
                    [e.model_dump() for e in knowledge_edges], default=str
                )
                record.completed_at = datetime.utcnow()
                await db.commit()

        await mark_complete(
            session_id,
            {
                "type": "complete",
                "session_id": session_id,
                "report": report,
                "sources": [s.model_dump() for s in sources],
                "sub_questions": sub_questions,
                "knowledge_nodes": [n.model_dump() for n in knowledge_nodes],
                "knowledge_edges": [e.model_dump() for e in knowledge_edges],
            },
        )

    except Exception as exc:
        # Record failure in DB
        async with SessionLocal() as db:
            record = await db.get(ResearchSession, session_id)
            if record:
                record.status = "failed"
                record.completed_at = datetime.utcnow()
                await db.commit()

        # Push error event so SSE can surface it
        error_event = AgentEvent(
            agent_name="System",
            event_type="complete",
            message=f"Research failed: {exc}",
        )
        await push_event(session_id, error_event.model_dump(mode="json"))
        await mark_complete(
            session_id,
            {"type": "error", "message": str(exc), "session_id": session_id},
        )
