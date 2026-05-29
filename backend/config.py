from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    llm_api_base: str
    llm_api_key: str
    llm_model: str = "qwen-plus"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cv_builder"

    class Config:
        env_file = ".env"


settings = Settings()
