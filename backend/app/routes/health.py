import torch
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas import HealthResponse, ModelInfoResponse
from backend.app.model.loader import get_model_info, get_device

router = APIRouter(tags=["System & Health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Returns API health status, model loading state, and compute device.
    """
    info = get_model_info()
    return HealthResponse(
        status="ok",
        model_loaded=info.get("model_loaded", False),
        device=str(info.get("device", "cpu")),
        cuda_available=torch.cuda.is_available(),
        gpu_name=torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        app_version=settings.APP_VERSION
    )


@router.get("/model-info", response_model=ModelInfoResponse)
def model_information():
    """
    Returns architecture specifications, checkpoint details, and inference parameters.
    """
    info = get_model_info()
    return ModelInfoResponse(**info)
