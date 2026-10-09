import sqlite3
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.config import settings

def get_db_connection() -> sqlite3.Connection:
    """
    Creates and returns an SQLite database connection with row factory.
    """
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initializes the SQLite schema for storing analysis runs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            before_filename TEXT NOT NULL,
            after_filename TEXT NOT NULL,
            total_area_m2 REAL NOT NULL,
            changed_area_m2 REAL NOT NULL,
            unchanged_area_m2 REAL NOT NULL,
            total_pixels INTEGER NOT NULL,
            changed_pixels INTEGER NOT NULL,
            unchanged_pixels INTEGER NOT NULL,
            change_percentage REAL NOT NULL,
            confidence_score REAL NOT NULL,
            changed_confidence REAL NOT NULL,
            threshold REAL NOT NULL,
            resolution TEXT NOT NULL,
            before_url TEXT NOT NULL,
            after_url TEXT NOT NULL,
            mask_url TEXT NOT NULL,
            heatmap_url TEXT NOT NULL,
            overlay_url TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed',
            metadata TEXT
        )
    """)
    conn.commit()
    conn.close()


def insert_analysis(record: Dict[str, Any]) -> str:
    """
    Inserts a newly completed analysis record.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analyses (
            id, created_at, before_filename, after_filename,
            total_area_m2, changed_area_m2, unchanged_area_m2,
            total_pixels, changed_pixels, unchanged_pixels,
            change_percentage, confidence_score, changed_confidence,
            threshold, resolution,
            before_url, after_url, mask_url, heatmap_url, overlay_url,
            status, metadata
        ) VALUES (
            :id, :created_at, :before_filename, :after_filename,
            :total_area_m2, :changed_area_m2, :unchanged_area_m2,
            :total_pixels, :changed_pixels, :unchanged_pixels,
            :change_percentage, :confidence_score, :changed_confidence,
            :threshold, :resolution,
            :before_url, :after_url, :mask_url, :heatmap_url, :overlay_url,
            :status, :metadata
        )
    """, record)
    conn.commit()
    conn.close()
    return record["id"]


def get_all_analyses(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieves previous analyses ordered by newest first.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM analyses
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches full analysis results for a given ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_analysis_by_id(analysis_id: str) -> bool:
    """
    Deletes an analysis record from SQLite.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0
