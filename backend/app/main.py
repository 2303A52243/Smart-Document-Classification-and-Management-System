"""
FastAPI application entry point for the Smart Document Classification System.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import connect_db, disconnect_db
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.analytics import router as analytics_router
from app.api.categories import categories_router, health_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.VERSION}")
    if not settings.DEBUG and settings.JWT_SECRET_KEY == "change-this-secret-in-production-min-32-chars-long":
        logger.warning("⚠️ SECURITY WARNING: Using default JWT_SECRET_KEY in production! Please set JWT_SECRET_KEY in environment variables.")
    await connect_db()
    yield
    await disconnect_db()
    logger.info("👋 Server shut down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "Smart Document Classification and Management System — "
        "upload documents, extract text using NLP, classify with TF-IDF + SVM, "
        "and manage them in a MongoDB-backed document library."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS — allow the React frontend (local dev and any Vercel domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with /api prefix
API_PREFIX = "/api"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(categories_router, prefix=API_PREFIX)
app.include_router(health_router, prefix=API_PREFIX)
app.include_router(health_router)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "docs": "/api/docs",
    }

