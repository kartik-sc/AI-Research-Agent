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
    planner_model: str = "gemini-1.5-pro"
    researcher_model: str = "gemini-1.5-flash"

    # Database — Railway provides postgresql:// which needs the asyncpg dialect prefix
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/researchos"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    secret_key: str = "change_this_to_random_string"

    # App
    app_name: str = "ResearchOS"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("database_url", mode="before")
    @classmethod
    def _fix_db_url(cls, v: object) -> object:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return "postgresql+asyncpg://" + v[len("postgres://"):]
            if v.startswith("postgresql://"):
                return "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors(cls, v: object) -> object:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


settings = Settings()
