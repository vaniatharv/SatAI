import logging
from pathlib import Path
from typing import Optional, Tuple
import torch
import torch.nn as nn

from backend.app.config import settings
from backend.app.model.model import SiameseUNet

logger = logging.getLogger(__name__)

# Global singleton model storage
_global_model: Optional[nn.Module] = None
_global_device: Optional[torch.device] = None
_model_metadata: dict = {}


def get_device(requested_device: Optional[str] = None) -> torch.device:
    """
    Selects target computing device (CUDA GPU when available, else CPU fallback).
    """
    req = requested_device or settings.DEVICE
    if req.lower().startswith("cuda") and torch.cuda.is_available():
        device = torch.device(req)
        logger.info(f"Using GPU device: {torch.cuda.get_device_name(0)}")
    else:
        device = torch.device("cpu")
        logger.info("Using CPU device fallback")
    return device


def load_model(
    model_path: Optional[str] = None,
    device: Optional[torch.device] = None
) -> Tuple[nn.Module, torch.device]:
    """
    Loads SiameseUNet model and weights from .pth checkpoint file once at startup.
    Supports state_dict or direct model instances.
    """
    global _global_model, _global_device, _model_metadata

    if _global_model is not None and _global_device is not None:
        return _global_model, _global_device

    pth_file = Path(model_path or settings.MODEL_PATH)
    target_device = device or get_device()

    if not pth_file.exists():
        raise FileNotFoundError(
            f"Model checkpoint not found at: {pth_file.resolve()}. "
            "Please configure MODEL_PATH in settings or verify the model checkpoint path."
        )

    logger.info(f"Loading change detection model from {pth_file.resolve()}...")

    # Initialize architecture
    model = SiameseUNet(
        in_channels=settings.IMAGE_CHANNELS,
        out_channels=1
    )

    try:
        # Load weights with map_location
        checkpoint = torch.load(pth_file, map_location=target_device)

        if isinstance(checkpoint, dict):
            # If checkpoint wrapped in a dict with 'state_dict' or 'model'
            if "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            elif "model" in checkpoint:
                state_dict = checkpoint["model"]
            else:
                state_dict = checkpoint

            # Strip possible 'module.' prefixes from DataParallel training
            cleaned_state_dict = {}
            for k, v in state_dict.items():
                clean_key = k[7:] if k.startswith("module.") else k
                cleaned_state_dict[clean_key] = v

            model.load_state_dict(cleaned_state_dict, strict=True)
            logger.info("Successfully loaded state_dict into SiameseUNet architecture.")
        elif isinstance(checkpoint, nn.Module):
            model = checkpoint
            logger.info("Direct nn.Module checkpoint loaded.")
        else:
            raise ValueError(f"Unrecognized checkpoint format: {type(checkpoint)}")

    except Exception as e:
        logger.error(f"Failed to load checkpoint into model: {e}")
        raise RuntimeError(f"Error loading model checkpoint: {e}")

    model.to(target_device)
    model.eval()

    _global_model = model
    _global_device = target_device
    _model_metadata = {
        "model_name": "Siamese U-Net (LEVIR-CD)",
        "model_type": "Bitemporal Siamese Feature Difference Network",
        "input_channels": settings.IMAGE_CHANNELS,
        "input_size": settings.INPUT_SIZE,
        "normalization": settings.NORMALIZATION,
        "threshold": settings.THRESHOLD,
        "device": str(target_device),
        "checkpoint_path": str(pth_file.resolve()),
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    }

    return _global_model, _global_device


def get_loaded_model() -> Tuple[nn.Module, torch.device]:
    """
    Returns the loaded model singleton and device.
    """
    if _global_model is None:
        return load_model()
    return _global_model, _global_device


def get_model_info() -> dict:
    """
    Returns current model runtime info and configuration.
    """
    if _global_model is None:
        try:
            load_model()
        except Exception as e:
            return {
                "model_loaded": False,
                "error": str(e),
                "device": "cpu",
                "cuda_available": torch.cuda.is_available()
            }

    return {
        "model_loaded": True,
        **_model_metadata
    }
