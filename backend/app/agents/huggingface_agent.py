import json
import logging

import httpx
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.models import ModelRouter
from app.core.redis_client import push_event
from app.models.schemas import AgentEvent

logger = logging.getLogger(__name__)

_ANALYSIS_SYSTEM = """You are a machine learning research analyst reviewing a HuggingFace model.
Return ONLY valid JSON with this exact structure:
{
  "name": "model display name",
  "description": "one sentence: what this model does",
  "use_cases": ["use case 1", "use case 2"],
  "performance_tier": "SOTA|competitive|outdated",
  "downloads": 0,
  "tags": ["tag1", "tag2"]
}
No markdown fences. Return only JSON."""


async def _analyze_model(model_info: dict, mode: str) -> dict:
    router = ModelRouter(mode=mode)
    prompt = (
        f"Model ID: {model_info.get('modelId', 'unknown')}\n"
        f"Pipeline: {model_info.get('pipeline_tag', 'unknown')}\n"
        f"Library: {model_info.get('library_name', 'unknown')}\n"
        f"Downloads (30d): {model_info.get('downloads', 0)}\n"
        f"Likes: {model_info.get('likes', 0)}\n"
        f"Tags: {', '.join((model_info.get('tags') or [])[:10])}\n"
        f"Created: {(model_info.get('createdAt') or '')[:10]}\n"
        f"Last modified: {(model_info.get('lastModified') or '')[:10]}"
    )
    raw = await router.call(
        "search_analysis",
        [SystemMessage(content=_ANALYSIS_SYSTEM), HumanMessage(content=prompt)],
        temperature=0.1,
    )
    if "```" in raw:
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw)


async def run_huggingface_agent(state: dict) -> dict:
    query: str = state["query"]
    mode: str = state.get("mode", "deep")
    session_id: str = state["session_id"]
    events: list[AgentEvent] = []

    thinking = AgentEvent(
        agent_name="HuggingFace",
        event_type="thinking",
        message=f"Searching HuggingFace models for: {query[:60]}",
    )
    events.append(thinking)
    await push_event(session_id, thinking.model_dump(mode="json"))

    search_results: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://huggingface.co/api/models",
                params={"search": query, "sort": "downloads", "limit": 5},
            )
            if not resp.is_success:
                raise RuntimeError(f"HuggingFace API returned {resp.status_code}")

            models = resp.json()[:3]
            if not models:
                raise RuntimeError("No models found")

        for model_info in models:
            try:
                analysis = await _analyze_model(model_info, mode)
                model_id = model_info.get("modelId") or model_info.get("id", "unknown")

                search_results.append({
                    "url": f"https://huggingface.co/{model_id}",
                    "title": analysis.get("name") or model_id,
                    "source_type": "huggingface",
                    "content": analysis.get("description", ""),
                    "published_date": (model_info.get("createdAt") or "")[:10] or None,
                    "metadata": {
                        **analysis,
                        "downloads": model_info.get("downloads", 0),
                        "likes": model_info.get("likes", 0),
                        "pipeline_tag": model_info.get("pipeline_tag", ""),
                        "tags": (model_info.get("tags") or [])[:8],
                    },
                })
            except Exception as exc:
                logger.warning("HuggingFace: failed to analyze model %s: %s", model_info.get("modelId"), exc)

        action = AgentEvent(
            agent_name="HuggingFace",
            event_type="action",
            message=f"Analyzed {len(search_results)} HuggingFace models",
        )
        events.append(action)
        await push_event(session_id, action.model_dump(mode="json"))

    except Exception as exc:
        logger.warning("HuggingFace agent failed: %s", exc)
        err = AgentEvent(
            agent_name="HuggingFace",
            event_type="complete",
            message=f"HuggingFace search skipped: {exc}",
        )
        events.append(err)
        await push_event(session_id, err.model_dump(mode="json"))

    return {"search_results": search_results, "agent_events": events}
