from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.research import router as research_router
from app.api.sessions import router as sessions_router
from app.core.config import settings
from app.core.database import create_tables
from app.core.redis_client import close_redis, get_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    await get_redis()  # warm connection
    print(f"{settings.app_name} ready")
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="ResearchOS API",
    version="0.2.0",
    description="Multi-agent AI research workspace",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.app_name, "version": "0.2.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
