import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.vector_db import vector_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("carepulse-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing CarePulse AI Inference Services...")
    await connect_to_mongo()
    vector_db.connect()
    yield
    # Shutdown
    logger.info("Shutting down CarePulse AI Inference Services...")
    await close_mongo_connection()


app = FastAPI(
    title="CarePulse AI Inference Service",
    version=settings.VERSION,
    description="FastAPI AI Model Inference, OCR, Semantic Search & Real-time Metrics",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus Metrics Instrumentation
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "service": "CarePulse AI Inference Engine (FastAPI)",
        "version": settings.VERSION,
        "status": "online",
        "metrics": "/metrics",
        "docs": "/docs",
        "pdpa_compliance": "Enforced"
    }
