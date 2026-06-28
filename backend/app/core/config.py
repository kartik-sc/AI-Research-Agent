from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AI providers
    google_api_key: str = ""
    tavily_api_key: str = ""
    exa_api_key: str = ""

    # Model routing
    planner_model: str = "gemini-1.5-pro"
    researcher_model: str = "gemini-1.5-flash"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/researchos"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    secret_key: str = "change_this_to_random_string"

    # App
    app_name: str = "ResearchOS"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
