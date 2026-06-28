import json
import logging

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

_SYSTEM = (
    "Classify this research query. Return ONLY valid JSON with these boolean fields: "
    '{"is_technical": bool, "involves_ai_model": bool, "involves_codebase": bool, "is_academic": bool}. '
    "No markdown fences, no explanation."
)

_FIELDS = {"is_technical", "involves_ai_model", "involves_codebase", "is_academic"}


class TopicFlags(BaseModel):
    is_technical: bool = False
    involves_ai_model: bool = False
    involves_codebase: bool = False
    is_academic: bool = False


async def detect_topic(query: str) -> TopicFlags:
    """Single flash call to classify query intent. Returns safe defaults on any failure."""
    llm = ChatGoogleGenerativeAI(
        model=settings.researcher_model,
        google_api_key=settings.google_api_key,
        temperature=0.0,
    )
    try:
        response = await llm.ainvoke(
            [SystemMessage(content=_SYSTEM), HumanMessage(content=query)]
        )
        raw = response.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
        data = json.loads(raw)
        return TopicFlags(**{k: bool(v) for k, v in data.items() if k in _FIELDS})
    except Exception as exc:
        logger.warning("detect_topic failed: %s — using defaults", exc)
        return TopicFlags()
