import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Storage directories
STORAGE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = STORAGE_DIR / "uploads"
RESULTS_DIR = STORAGE_DIR / "results"
HEATMAPS_DIR = STORAGE_DIR / "heatmaps"
MASKS_DIR = STORAGE_DIR / "masks"
SAMPLES_DIR = STORAGE_DIR / "samples"
DB_PATH = STORAGE_DIR / "analyses.db"

# Model paths and parameters
# Prioritize best_siamese_unet (1).pth if present, with fallbacks
candidate_model_paths = [
    BASE_DIR / "best_siamese_unet (1).pth",
    STORAGE_DIR / "models" / "best_siamese_unet (1).pth",
    STORAGE_DIR / "models" / "best_siamese_unet.pth",
    BASE_DIR / "best_siamese_unet.pth",
]
DEFAULT_MODEL_PATH = next((p for p in candidate_model_paths if p.exists()), BASE_DIR / "best_siamese_unet (1).pth")

class Settings(BaseModel):
    # App
    APP_NAME: str = "Satellite Change Detection API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Model Configuration
    # Easily modified via environment variables or settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))
    DEVICE: str = os.getenv("DEVICE", "cuda")  # Auto-fallback to cpu if cuda not available
    INPUT_SIZE: int = int(os.getenv("INPUT_SIZE", "256"))  # Patch size for Siamese model inference (256x256)
    IMAGE_CHANNELS: int = int(os.getenv("IMAGE_CHANNELS", "3"))
    NORMALIZATION: str = os.getenv("NORMALIZATION", "imagenet")  # 'imagenet' or 'standard' or 'none'
    THRESHOLD: float = float(os.getenv("THRESHOLD", "0.5"))  # Binary decision threshold
    GSD: float = float(os.getenv("GSD", "0.5"))  # Ground Sample Distance: 0.5m/pixel for LEVIR-CD
    
    # Storage Paths
    UPLOADS_DIR: Path = UPLOADS_DIR
    RESULTS_DIR: Path = RESULTS_DIR
    HEATMAPS_DIR: Path = HEATMAPS_DIR
    MASKS_DIR: Path = MASKS_DIR
    SAMPLES_DIR: Path = SAMPLES_DIR
    DB_PATH: Path = DB_PATH
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

# Ensure directories exist
for folder in [settings.UPLOADS_DIR, settings.RESULTS_DIR, settings.HEATMAPS_DIR, settings.MASKS_DIR, settings.SAMPLES_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
