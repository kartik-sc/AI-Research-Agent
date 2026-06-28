from sqlalchemy import select

from fastapi import APIRouter, HTTPException

from app.core.database import ResearchSession, SessionLocal
from app.models.schemas import SessionSummary

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionSummary])
async def list_sessions() -> list[SessionSummary]:
    async with SessionLocal() as db:
        result = await db.execute(
            select(ResearchSession).order_by(ResearchSession.created_at.desc()).limit(100)
        )
        records = result.scalars().all()

    return [
        SessionSummary(
            session_id=r.id,
            query=r.query,
            mode=r.mode,
            status=r.status,
            created_at=r.created_at,
            source_count=0,  # avoid deserialising JSON just for the list
        )
        for r in records
    ]


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str) -> None:
    async with SessionLocal() as db:
        record = await db.get(ResearchSession, session_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Session not found")
        await db.delete(record)
        await db.commit()
