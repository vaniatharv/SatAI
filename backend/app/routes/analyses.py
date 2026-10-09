import shutil
import logging
from typing import List
from fastapi import APIRouter, HTTPException

from backend.app.config import settings
from backend.app.database import get_all_analyses, get_analysis_by_id, delete_analysis_by_id
from backend.app.schemas import AnalysisListItem, DeleteResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Analyses History"])


@router.get("/analyses", response_model=List[AnalysisListItem])
def list_analyses(limit: int = 50):
    """
    Returns list of previous change detection runs ordered by date.
    """
    rows = get_all_analyses(limit=limit)
    return rows


@router.get("/analyses/{analysis_id}")
def get_analysis_details(analysis_id: str):
    """
    Returns complete record and URLs for a specific analysis.
    """
    row = get_analysis_by_id(analysis_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")
    return row


@router.delete("/analyses/{analysis_id}", response_model=DeleteResponse)
def delete_analysis(analysis_id: str):
    """
    Removes an analysis record and its corresponding artifact files.
    """
    row = get_analysis_by_id(analysis_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")

    # Remove from SQLite
    delete_analysis_by_id(analysis_id)

    # Clean up disk artifacts if present
    run_dir = settings.RESULTS_DIR / analysis_id
    if run_dir.exists() and run_dir.is_dir():
        try:
            shutil.rmtree(run_dir)
        except Exception as e:
            logger.warning(f"Could not remove directory {run_dir}: {e}")

    return DeleteResponse(
        success=True,
        message=f"Analysis '{analysis_id}' removed successfully.",
        analysis_id=analysis_id
    )
