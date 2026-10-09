from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    cuda_available: bool
    gpu_name: Optional[str] = None
    app_version: str


class ModelInfoResponse(BaseModel):
    model_loaded: bool
    model_name: Optional[str] = None
    model_type: Optional[str] = None
    device: str
    input_channels: Optional[int] = None
    input_size: Optional[int] = None
    normalization: Optional[str] = None
    threshold: Optional[float] = None
    checkpoint_path: Optional[str] = None
    cuda_available: bool
    gpu_name: Optional[str] = None
    error: Optional[str] = None


class MetricsModel(BaseModel):
    total_pixels: int
    changed_pixels: int
    unchanged_pixels: int
    change_percentage: float
    total_area_m2: float
    changed_area_m2: float
    unchanged_area_m2: float
    total_area_ha: float
    changed_area_ha: float
    confidence_score: float
    changed_confidence: float
    gsd_m_per_pixel: float
    confidence_method: str


class PredictResponse(BaseModel):
    analysis_id: str
    status: str
    created_at: str
    before_filename: str
    after_filename: str
    threshold: float
    resolution: List[int]
    metrics: MetricsModel
    before_image_url: str
    after_image_url: str
    change_map_url: str
    heatmap_url: str
    overlay_url: str


class AnalysisListItem(BaseModel):
    id: str
    created_at: str
    before_filename: str
    after_filename: str
    changed_area_m2: float
    total_area_m2: float
    change_percentage: float
    confidence_score: float
    status: str
    before_url: str
    after_url: str
    mask_url: str
    heatmap_url: str
    overlay_url: str


class DeleteResponse(BaseModel):
    success: bool
    message: str
    analysis_id: str
