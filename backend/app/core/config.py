import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AI providers
    google_api_key: str = ""
    tavily_api_key: str = ""
    exa_api_key: str = ""
    github_token: str = ""

    # Model routing
    PLANNER_MODEL: str = "gemini-2.5-pro"
    RESEARCHER_MODEL: str = "gemini-2.5-flash"

    # Database — Neon/Railway provide postgresql:// which needs the asyncpg dialect prefix
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/researchos"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    secret_key: str = "change_this_to_random_string"

    # App
    app_name: str = "ResearchOS"
    debug: bool = False

    # Kept as str so pydantic-settings never JSON-parses it at source level
    # (list[str] fields trigger json.loads in the env source, crashing on comma-separated values).
    # Accepts "a,b,c" or '["a","b"]' formats — parsed via get_cors_origins().
    cors_origins: str = "http://localhost:3000"

    @field_validator("database_url", mode="before")
    @classmethod
    def _fix_db_url(cls, v: object) -> object:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return "postgresql+asyncpg://" + v[len("postgres://"):]
            if v.startswith("postgresql://"):
                return "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    def get_cors_origins(self) -> list[str]:
        v = self.cors_origins.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]


settings = Settings()
