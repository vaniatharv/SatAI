import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.config import settings

router = APIRouter(prefix="/samples", tags=["Sample Datasets"])

SAMPLES_INFO = [
    {
        "id": "levir_austin_subdivision",
        "title": "Suburban Residential Expansion",
        "region": "Austin, TX (LEVIR-CD)",
        "description": "Conversion of rural terrain/grassland into residential subdivision with single-family homes and access roads.",
        "before_url": "/static/samples/sample1_before.png",
        "after_url": "/static/samples/sample1_after.png",
        "gsd": "0.5m/px",
        "resolution": "512 x 512"
    },
    {
        "id": "levir_kyle_logistics",
        "title": "Commercial Logistics Hub Construction",
        "region": "Kyle / Buda, TX (LEVIR-CD)",
        "description": "Large-scale industrial development featuring twin distribution warehouses and concrete pavement apron.",
        "before_url": "/static/samples/sample2_before.png",
        "after_url": "/static/samples/sample2_after.png",
        "gsd": "0.5m/px",
        "resolution": "512 x 512"
    }
]

@router.get("")
def list_sample_pairs():
    """Returns available preloaded LEVIR-CD benchmark test pairs."""
    return SAMPLES_INFO
