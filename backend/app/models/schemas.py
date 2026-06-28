from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Source(BaseModel):
    url: str
    title: str
    domain: str
    snippet: str
    trust_score: float = Field(default=0.5, ge=0.0, le=1.0)
    published_date: str | None = None
    source_type: str = "web"


class AgentEvent(BaseModel):
    agent_name: str
    event_type: Literal["thinking", "action", "complete"]
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    mode: Literal["quick", "deep", "academic"] = "deep"
    session_id: str | None = None


class KnowledgeNode(BaseModel):
    id: str
    label: str
    type: str
    description: str = ""
    related: list[str] = []


class KnowledgeEdge(BaseModel):
    source: str
    target: str
    label: str
    strength: float = Field(default=0.5, ge=0.1, le=1.0)


class ResearchResponse(BaseModel):
    session_id: str
    status: str
    report: str
    sources: list[Source]
    sub_questions: list[str]
    knowledge_nodes: list[KnowledgeNode]
    knowledge_edges: list[KnowledgeEdge] = []


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    color: str = "#7F77DD"
    icon: str = "folder"


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str | None
    color: str
    icon: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectSummary(ProjectOut):
    session_count: int = 0


# ── Sessions ──────────────────────────────────────────────────────────────────

class SessionSummary(BaseModel):
    session_id: str
    query: str
    mode: str
    status: str
    created_at: datetime
    source_count: int
    duration_seconds: int | None = None
    project_id: str | None = None


class SessionDetail(ResearchResponse):
    """Full session: all ResearchResponse fields + session metadata."""
    query: str
    mode: str
    created_at: datetime
    completed_at: datetime | None = None
    duration_seconds: int | None = None
    project_id: str | None = None


class AssignProjectBody(BaseModel):
    project_id: str | None = None


# ── Misc ──────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
