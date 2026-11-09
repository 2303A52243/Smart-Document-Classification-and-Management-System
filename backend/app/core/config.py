"""
Core configuration settings for the Smart Document Management System.
Reads from environment variables with safe defaults for development.
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Allow overriding via env variables (useful for Render persistent disk mount)
_uploads_env = os.getenv("UPLOADS_DIR", "")
_models_env = os.getenv("MODELS_DIR", "")

UPLOADS_DIR = Path(_uploads_env) if _uploads_env else BASE_DIR / "uploads"
MODELS_DIR = Path(_models_env) if _models_env else BASE_DIR / "models"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    # Application
    APP_NAME: str = "Smart Document Classification System"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production-min-32-chars-long")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "smart_doc_db")

    # File Upload
    UPLOAD_DIR: Path = UPLOADS_DIR
    MODEL_DIR: Path = MODELS_DIR
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "15"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: set = {"pdf", "docx", "txt"}

    # CORS — includes Vercel and local dev origins
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @property
    def CORS_ORIGINS(self) -> list:
        origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
        # Add any extra origins from env (comma-separated)
        extra = os.getenv("CORS_ORIGINS", "")
        if extra:
            origins += [o.strip() for o in extra.split(",") if o.strip()]
        # Always include FRONTEND_URL if set
        if self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    # NLP Model
    MODEL_PATH: Path = MODELS_DIR / "document_classifier.joblib"
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.40"))

    # Categories
    CATEGORIES: list = [
        "resume",
        "invoice",
        "research_paper",
        "academic_document",
        "legal_document",
        "report",
        "other",
    ]

settings = Settings()

