import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import init_db
from backend.app.model.loader import load_model
from backend.app.routes import health, prediction, analyses, samples

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("satellite_cd")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and Preload Model
    logger.info("Initializing SQLite database...")
    init_db()

    logger.info("Pre-loading PyTorch Siamese model checkpoint...")
    try:
        model, device = load_model()
        logger.info(f"Model successfully loaded onto device: {device}")
    except Exception as e:
        logger.error(f"Failed to load model at startup: {e}")
        logger.warning(f"Backend will still start; check MODEL_PATH or place model checkpoint in backend/models/ or root directory: {e}")

    yield

    # Shutdown
    logger.info("Satellite Change Detection backend shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-quality backend for AI-powered Temporal Satellite Image Change Detection "
        "trained on the LEVIR-CD benchmark dataset."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for results and uploaded samples
app.mount("/static/results", StaticFiles(directory=str(settings.RESULTS_DIR)), name="results")
app.mount("/static/samples", StaticFiles(directory=str(settings.SAMPLES_DIR)), name="samples")

# Include Routers
app.include_router(health.router)
app.include_router(prediction.router)
app.include_router(analyses.router)
app.include_router(samples.router)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "status": "online"
    }
