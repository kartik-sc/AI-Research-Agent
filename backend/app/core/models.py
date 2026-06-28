import asyncio
import logging
from typing import Any

from langchain_core.messages import BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)

# Maps purpose → model tier. Resolved at call time against settings so model
# names remain configurable via environment variables.
_PRO_PURPOSES = {"planning", "synthesis"}


class ModelRouter:
    """Routes LLM calls to pro/flash models by purpose with retry + fallback."""

    def __init__(self, mode: str = "deep"):
        self.mode = mode

    def _resolve_model(self, purpose: str) -> str:
        # Quick mode and any "quick_*" purpose always use the fast model
        if self.mode == "quick" or purpose.startswith("quick_"):
            return settings.researcher_model
        return settings.planner_model if purpose in _PRO_PURPOSES else settings.researcher_model

    async def call(
        self,
        purpose: str,
        messages: list[BaseMessage],
        **kwargs: Any,
    ) -> str:
        primary = self._resolve_model(purpose)
        flash = settings.researcher_model
        last_exc: Exception | None = None

        for attempt in range(3):
            try:
                llm = ChatGoogleGenerativeAI(
                    model=primary,
                    google_api_key=settings.google_api_key,
                    **kwargs,
                )
                response = await llm.ainvoke(messages)
                return response.content.strip()
            except Exception as exc:
                last_exc = exc
                if attempt < 2:
                    await asyncio.sleep(2**attempt)

        # Fallback to flash if primary is pro (and they differ)
        if primary != flash:
            logger.warning(
                "ModelRouter: purpose=%s failed after 3 attempts (%s) — falling back to %s",
                purpose,
                last_exc,
                flash,
            )
            try:
                llm = ChatGoogleGenerativeAI(
                    model=flash,
                    google_api_key=settings.google_api_key,
                    **kwargs,
                )
                response = await llm.ainvoke(messages)
                return response.content.strip()
            except Exception as exc:
                last_exc = exc

        raise RuntimeError(f"ModelRouter.call({purpose}) exhausted all attempts: {last_exc}") from last_exc
