import os
import uuid
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from PIL import Image

from backend.app.config import settings
from backend.app.database import insert_analysis
from backend.app.schemas import PredictResponse, MetricsModel
from backend.app.model.inference import predict
from backend.app.model.preprocessing import load_image

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Prediction"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}


def validate_image_file(file: UploadFile, label: str) -> None:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"{label} has unsupported extension '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


@router.post("/predict", response_model=PredictResponse)
async def predict_change(
    before_image: UploadFile = File(..., description="Earlier satellite image (T1)"),
    after_image: UploadFile = File(..., description="Later satellite image (T2)"),
    threshold: Optional[float] = Form(None, description="Detection threshold (0.0 to 1.0)"),
    metadata: Optional[str] = Form(None, description="Optional Geo/JSON metadata")
):
    """
    Primary satellite change detection endpoint.
    Performs real PyTorch Siamese model inference and generates
    change masks, probability heatmaps, original overlays, and physical metrics.
    """
    if not before_image or not after_image:
        raise HTTPException(status_code=400, detail="Both before_image and after_image are required.")

    validate_image_file(before_image, "Before image")
    validate_image_file(after_image, "After image")

    # Read binary contents
    try:
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded files: {str(e)}")

    if len(before_bytes) == 0 or len(after_bytes) == 0:
        raise HTTPException(status_code=400, detail="One or both uploaded image files are empty.")

    # Decode and validate with PIL
    try:
        pil_before = load_image(before_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted Before image: {str(e)}")

    try:
        pil_after = load_image(after_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted After image: {str(e)}")

    # Check dimensions
    if pil_before.size != pil_after.size:
        # Resize after image to match before image or return warning
        logger.warning(
            f"Image dimensions differ: Before={pil_before.size}, After={pil_after.size}. "
            "Resizing After image to match Before dimensions."
        )
        pil_after = pil_after.resize(pil_before.size, Image.Resampling.BILINEAR)

    # Generate unique analysis identifier
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    uid = str(uuid.uuid4())[:8]
    analysis_id = f"ANL_{timestamp}_{uid}"

    # Directory for this run's artifacts
    run_dir = settings.RESULTS_DIR / analysis_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # Run real model inference
    try:
        eff_threshold = threshold if threshold is not None else settings.THRESHOLD
        result = predict(
            before_image=pil_before,
            after_image=pil_after,
            threshold=eff_threshold,
            output_dir=run_dir,
            analysis_id=analysis_id
        )
    except Exception as e:
        logger.error(f"Inference execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    # Construct public URLs
    base_url = f"/static/results/{analysis_id}"
    before_url = f"{base_url}/before.png"
    after_url = f"{base_url}/after.png"
    mask_url = f"{base_url}/change_mask.png"
    heatmap_url = f"{base_url}/heatmap.png"
    overlay_url = f"{base_url}/overlay.png"

    metrics_data = result["metrics"]
    res_str = f"{result['original_resolution'][0]}x{result['original_resolution'][1]}"

    # Save to SQLite database
    db_record = {
        "id": analysis_id,
        "created_at": datetime.utcnow().isoformat(),
        "before_filename": before_image.filename or "before.png",
        "after_filename": after_image.filename or "after.png",
        "total_area_m2": metrics_data["total_area_m2"],
        "changed_area_m2": metrics_data["changed_area_m2"],
        "unchanged_area_m2": metrics_data["unchanged_area_m2"],
        "total_pixels": metrics_data["total_pixels"],
        "changed_pixels": metrics_data["changed_pixels"],
        "unchanged_pixels": metrics_data["unchanged_pixels"],
        "change_percentage": metrics_data["change_percentage"],
        "confidence_score": metrics_data["confidence_score"],
        "changed_confidence": metrics_data["changed_confidence"],
        "threshold": eff_threshold,
        "resolution": res_str,
        "before_url": before_url,
        "after_url": after_url,
        "mask_url": mask_url,
        "heatmap_url": heatmap_url,
        "overlay_url": overlay_url,
        "status": "completed",
        "metadata": metadata or json.dumps(result.get("raw_prob_stats", {}))
    }

    try:
        insert_analysis(db_record)
    except Exception as e:
        logger.error(f"Failed to record analysis to database: {e}")

    return PredictResponse(
        analysis_id=analysis_id,
        status="completed",
        created_at=db_record["created_at"],
        before_filename=db_record["before_filename"],
        after_filename=db_record["after_filename"],
        threshold=eff_threshold,
        resolution=result["original_resolution"],
        metrics=MetricsModel(**metrics_data),
        before_image_url=before_url,
        after_image_url=after_url,
        change_map_url=mask_url,
        heatmap_url=heatmap_url,
        overlay_url=overlay_url
    )
