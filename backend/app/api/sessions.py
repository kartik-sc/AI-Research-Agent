import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from app.core.database import Project, ResearchSession, SessionLocal
from app.models.schemas import (
    AssignProjectBody,
    KnowledgeEdge,
    KnowledgeNode,
    ProjectCreate,
    ProjectOut,
    ProjectSummary,
    ResearchResponse,
    SessionDetail,
    SessionSummary,
    Source,
)

router = APIRouter(tags=["sessions"])


# ── Sessions list ─────────────────────────────────────────────────────────────

@router.get("/sessions", response_model=list[SessionSummary])
async def list_sessions(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    project_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
) -> list[SessionSummary]:
    async with SessionLocal() as db:
        stmt = select(ResearchSession).order_by(ResearchSession.created_at.desc())

        if project_id is not None:
            stmt = stmt.where(ResearchSession.project_id == project_id)

        if search:
            stmt = stmt.where(ResearchSession.query.ilike(f"%{search}%"))

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        records = result.scalars().all()

    summaries = []
    for r in records:
        source_count = 0
        if r.sources_json:
            try:
                source_count = len(json.loads(r.sources_json))
            except Exception:
                pass
        summaries.append(
            SessionSummary(
                session_id=r.id,
                query=r.query,
                mode=r.mode,
                status=r.status,
                created_at=r.created_at,
                source_count=source_count,
                duration_seconds=r.duration_seconds,
                project_id=r.project_id,
            )
        )
    return summaries


# ── Session detail ────────────────────────────────────────────────────────────

@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(session_id: str) -> SessionDetail:
    async with SessionLocal() as db:
        record = await db.get(ResearchSession, session_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Session not found")

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

    return SessionDetail(
        session_id=session_id,
        query=record.query,
        mode=record.mode,
        status=record.status,
        report=record.report or "",
        sources=sources,
        sub_questions=sub_questions,
        knowledge_nodes=knowledge_nodes,
        knowledge_edges=knowledge_edges,
        created_at=record.created_at,
        completed_at=record.completed_at,
        duration_seconds=record.duration_seconds,
        project_id=record.project_id,
    )


# ── Session delete ────────────────────────────────────────────────────────────

@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str) -> None:
    async with SessionLocal() as db:
        record = await db.get(ResearchSession, session_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Session not found")
        await db.delete(record)
        await db.commit()


# ── Assign session to project ─────────────────────────────────────────────────

@router.patch("/sessions/{session_id}/project", response_model=SessionSummary)
async def assign_project(session_id: str, body: AssignProjectBody) -> SessionSummary:
    async with SessionLocal() as db:
        record = await db.get(ResearchSession, session_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Session not found")

        if body.project_id is not None:
            project = await db.get(Project, body.project_id)
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

        record.project_id = body.project_id
        await db.commit()
        await db.refresh(record)

    source_count = 0
    if record.sources_json:
        try:
            source_count = len(json.loads(record.sources_json))
        except Exception:
            pass

    return SessionSummary(
        session_id=record.id,
        query=record.query,
        mode=record.mode,
        status=record.status,
        created_at=record.created_at,
        source_count=source_count,
        duration_seconds=record.duration_seconds,
        project_id=record.project_id,
    )


# ── Projects ──────────────────────────────────────────────────────────────────

@router.post("/projects", response_model=ProjectOut, status_code=201)
async def create_project(body: ProjectCreate) -> ProjectOut:
    async with SessionLocal() as db:
        project = Project(
            name=body.name,
            description=body.description,
            color=body.color,
            icon=body.icon,
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)

    return ProjectOut.model_validate(project)


@router.get("/projects", response_model=list[ProjectSummary])
async def list_projects() -> list[ProjectSummary]:
    async with SessionLocal() as db:
        # Projects with session count
        projects_result = await db.execute(
            select(Project).order_by(Project.created_at.desc())
        )
        projects = projects_result.scalars().all()

        # Session counts per project
        counts_result = await db.execute(
            select(ResearchSession.project_id, func.count(ResearchSession.id))
            .where(ResearchSession.project_id.isnot(None))
            .group_by(ResearchSession.project_id)
        )
        counts: dict[str, int] = {row[0]: row[1] for row in counts_result}

    return [
        ProjectSummary(
            **ProjectOut.model_validate(p).model_dump(),
            session_count=counts.get(p.id, 0),
        )
        for p in projects
    ]


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str) -> None:
    async with SessionLocal() as db:
        project = await db.get(Project, project_id)
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        await db.delete(project)
        await db.commit()
