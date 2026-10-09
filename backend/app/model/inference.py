import logging
from pathlib import Path
from typing import Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image
import torch

from backend.app.config import settings
from backend.app.model.loader import get_loaded_model
from backend.app.model.preprocessing import preprocess_pair, load_image

logger = logging.getLogger(__name__)


def generate_heatmap_colored(prob_map: np.ndarray) -> Image.Image:
    """
    Creates a continuous Turbo/Jet color-mapped visualization representing
    change probability intensity (0.0 to 1.0).
    """
    # Scale probabilities [0, 1] to uint8 [0, 255]
    prob_uint8 = np.clip(prob_map * 255.0, 0, 255).astype(np.uint8)
    # Apply JET or TURBO colormap
    colored_bgr = cv2.applyColorMap(prob_uint8, cv2.COLORMAP_TURBO)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(colored_rgb)


def generate_change_mask_image(binary_mask: np.ndarray) -> Image.Image:
    """
    Converts binary 0/1 mask to high-contrast visual PNG (255 for changed, 0 for unchanged).
    """
    mask_uint8 = (binary_mask * 255).astype(np.uint8)
    return Image.fromarray(mask_uint8, mode="L")


def generate_overlay_image(
    base_image: Image.Image,
    binary_mask: np.ndarray,
    prob_map: np.ndarray,
    color_rgb: Tuple[int, int, int] = (239, 68, 68),  # Vibrant red #ef4444
    alpha: float = 0.55
) -> Image.Image:
    """
    Blends the detected change regions cleanly over the original satellite image
    with a vibrant semi-transparent highlight.
    """
    base_rgb = base_image.convert("RGB")
    base_np = np.array(base_rgb).astype(np.float32)

    # Color highlight layer
    overlay_layer = base_np.copy()
    change_idx = binary_mask > 0

    # Fill changed regions with target highlight color
    overlay_layer[change_idx] = np.array(color_rgb, dtype=np.float32)

    # Weighted blend
    blended = cv2.addWeighted(
        overlay_layer.astype(np.uint8),
        alpha,
        base_np.astype(np.uint8),
        1.0 - alpha,
        0
    )
    return Image.fromarray(blended)


def calculate_metrics(
    binary_mask: np.ndarray,
    prob_map: np.ndarray,
    gsd_m: float = 0.5
) -> Dict[str, Any]:
    """
    Calculates exact change statistics, physical area (based on LEVIR-CD 0.5m GSD),
    and model confidence scores.

    Confidence metric derivation:
    Model outputs probabilities p in [0, 1]. For each pixel, certainty is
    confidence_i = max(p, 1 - p), ranging from 0.5 (maximum uncertainty) to 1.0 (certainty).
    We normalize this to [0, 100]% certainty and compute mean model confidence,
    as well as mean confidence specifically over changed regions.
    """
    total_pixels = int(binary_mask.size)
    changed_pixels = int(np.sum(binary_mask > 0))
    unchanged_pixels = total_pixels - changed_pixels
    change_percentage = round((changed_pixels / total_pixels) * 100.0, 2)

    # Physical area calculation based on Ground Sample Distance (GSD in meters/pixel)
    # 1 pixel = (GSD * GSD) m²
    pixel_area_m2 = gsd_m * gsd_m
    total_area_m2 = round(total_pixels * pixel_area_m2, 2)
    changed_area_m2 = round(changed_pixels * pixel_area_m2, 2)
    unchanged_area_m2 = round(unchanged_pixels * pixel_area_m2, 2)

    # Convert to hectares and km² for remote sensing metrics
    total_area_ha = round(total_area_m2 / 10000.0, 4)
    changed_area_ha = round(changed_area_m2 / 10000.0, 4)

    # Derive confidence from raw model probability distribution
    # p is in [0, 1]
    certainty_map = np.abs(prob_map - 0.5) * 2.0  # [0, 1], 1 = 100% certain, 0 = at boundary (0.5)
    overall_confidence = float(np.mean(certainty_map) * 100.0)

    if changed_pixels > 0:
        changed_confidence = float(np.mean(prob_map[binary_mask > 0]) * 100.0)
    else:
        changed_confidence = 100.0

    return {
        "total_pixels": total_pixels,
        "changed_pixels": changed_pixels,
        "unchanged_pixels": unchanged_pixels,
        "change_percentage": change_percentage,
        "total_area_m2": total_area_m2,
        "changed_area_m2": changed_area_m2,
        "unchanged_area_m2": unchanged_area_m2,
        "total_area_ha": total_area_ha,
        "changed_area_ha": changed_area_ha,
        "confidence_score": round(overall_confidence, 1),
        "changed_confidence": round(changed_confidence, 1),
        "gsd_m_per_pixel": gsd_m,
        "confidence_method": "Derived from mean prediction probability certainty: 2 * |p - 0.5|"
    }


def predict(
    before_image: Image.Image,
    after_image: Image.Image,
    threshold: float = None,
    output_dir: Path = None,
    analysis_id: str = "temp"
) -> Dict[str, Any]:
    """
    Executes complete change detection inference pipeline:
    1. Loads singleton Siamese model.
    2. Preprocesses Before and After image tensors.
    3. Runs model.eval() inference under torch.no_grad().
    4. Applies Sigmoid activation to obtain change probability map.
    5. Thresholds probability map into binary change mask.
    6. Upsamples/resizes mask and probability map to original input dimensions.
    7. Generates Change Mask, Color Heatmap, and Original Overlay.
    8. Calculates statistical metrics and physical areas.
    9. Saves output files.
    """
    eff_threshold = threshold if threshold is not None else settings.THRESHOLD
    model, device = get_loaded_model()

    # Preprocess
    orig_w, orig_h = before_image.size
    t1, t2, _ = preprocess_pair(
        before_img=before_image,
        after_img=after_image,
        target_size=(settings.INPUT_SIZE, settings.INPUT_SIZE),
        normalization=settings.NORMALIZATION
    )

    t1 = t1.to(device)
    t2 = t2.to(device)

    # Inference
    model.eval()
    with torch.no_grad():
        logits = model(t1, t2)
        probs = torch.sigmoid(logits)  # (1, 1, H, W) in [0, 1]

    # Convert probability tensor to 2D numpy array
    prob_np = probs.squeeze().cpu().numpy()

    # Resize probability map back to original input resolution using bilinear interpolation
    if (prob_np.shape[1], prob_np.shape[0]) != (orig_w, orig_h):
        prob_orig = cv2.resize(prob_np, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
    else:
        prob_orig = prob_np

    # Apply decision threshold to produce binary change mask
    binary_mask = (prob_orig >= eff_threshold).astype(np.uint8)

    # Generate visualizations
    mask_img = generate_change_mask_image(binary_mask)
    heatmap_img = generate_heatmap_colored(prob_orig)
    overlay_img = generate_overlay_image(after_image, binary_mask, prob_orig)

    # Save artifacts if output_dir provided
    saved_files = {}
    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
        
        before_path = output_dir / "before.png"
        after_path = output_dir / "after.png"
        mask_path = output_dir / "change_mask.png"
        heatmap_path = output_dir / "heatmap.png"
        overlay_path = output_dir / "overlay.png"

        before_image.save(before_path, format="PNG")
        after_image.save(after_path, format="PNG")
        mask_img.save(mask_path, format="PNG")
        heatmap_img.save(heatmap_path, format="PNG")
        overlay_img.save(overlay_path, format="PNG")

        saved_files = {
            "before_path": str(before_path),
            "after_path": str(after_path),
            "mask_path": str(mask_path),
            "heatmap_path": str(heatmap_path),
            "overlay_path": str(overlay_path)
        }

    # Calculate metrics
    metrics = calculate_metrics(binary_mask, prob_orig, gsd_m=settings.GSD)

    return {
        "analysis_id": analysis_id,
        "threshold": eff_threshold,
        "original_resolution": [orig_w, orig_h],
        "metrics": metrics,
        "files": saved_files,
        "raw_prob_stats": {
            "min": float(prob_orig.min()),
            "max": float(prob_orig.max()),
            "mean": float(prob_orig.mean())
        }
    }
