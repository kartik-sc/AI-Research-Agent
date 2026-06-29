import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.export import router as export_router
from app.api.research import router as research_router
from app.api.sessions import router as sessions_router
from app.core.config import settings
from app.core.database import create_tables
from app.core.redis_client import close_redis, get_redis

logger = logging.getLogger(__name__)


def _startup_banner() -> None:
    """Print API key status at startup so missing keys are obvious."""
    lines = [f"\n{'─' * 50}", f"  {settings.app_name}  ·  v0.3.0", "─" * 50]

    checks = [
        ("Google AI",  bool(settings.google_api_key),  True),
        ("Tavily",     bool(settings.tavily_api_key),   True),
        ("Exa",        bool(settings.exa_api_key),      False),
        ("GitHub",     bool(settings.github_token),     False),
    ]
    for name, ok, required in checks:
        icon  = "✓" if ok else ("✗" if required else "–")
        label = "configured" if ok else ("MISSING (required)" if required else "not set (optional)")
        lines.append(f"  {icon}  {name:<12} {label}")

    if not settings.tavily_api_key:
        lines.append("\n  ⚠  TAVILY_API_KEY missing — web search will return empty results.")
    if not settings.google_api_key:
        lines.append("\n  ⚠  GOOGLE_API_KEY missing — all LLM calls will fail.")

    lines.append("─" * 50 + "\n")
    print("\n".join(lines))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    try:
        await get_redis()
    except Exception as exc:
        logger.warning("Redis unavailable at startup: %s (caching disabled)", exc)
    _startup_banner()
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="ResearchOS API",
    version="0.3.0",
    description="Multi-agent AI research workspace",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.app_name, "version": "0.3.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
