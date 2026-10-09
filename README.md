# SatAI - Satellite Image Change Detection System (LEVIR-CD Siamese U-Net)

A modern, production-grade Earth Observation (EO) web application and deep learning inference platform for detecting temporal building changes in bitemporal satellite imagery.

Trained and configured specifically for the **LEVIR-CD** benchmark dataset (Very High Resolution 0.5 m/pixel Ground Sample Distance) utilizing the **`best_siamese_unet.pth`** PyTorch model.

---

## Architecture Overview

```
Before Image (T1) ──┐
                    ├──> Siamese Encoder (Shared Weights) ──> |T1 - T2| Feature Diff ──> Transposed Conv Decoder ──> Change Logits
After Image (T2)  ──┘                                                                                                      │
                                                                                                                           ├──> Binary Change Mask
                                                                                                                           ├──> Turbo Probability Heatmap
                                                                                                                           ├──> Alpha Satellite Overlay
                                                                                                                           └──> Physical Metrics (m², ha, %)
```

### Tech Stack
* **Deep Learning Framework**: PyTorch (Siamese U-Net with differential skip connections)
* **Computer Vision**: OpenCV, Pillow, TorchVision, NumPy
* **Backend API**: FastAPI, Uvicorn, Python-Multipart, SQLite3, Pydantic v2
* **Frontend Application**: React 19, Vite, Tailwind CSS, Lucide React
* **Benchmark Dataset Compatibility**: LEVIR-CD (Austin, Buda, Kyle, Lakeway, Texas bitemporal patches)

---

## Getting Started

### 1. Prerequisites
* Python 3.10+ (tested with Python 3.14)
* Node.js 18+ (tested with Node.js v24)
* Model weights: `best_siamese_unet.pth` (placed in `backend/models/`)

---

### 2. Backend Setup & Startup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
* **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
* **Model Info**: [http://127.0.0.1:8000/model-info](http://127.0.0.1:8000/model-info)

---

### 3. Frontend Setup & Startup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend dashboard will be available at:
* **Dashboard URL**: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## Dashboard Features

1. **Input Images Section**:
   * Drag-and-drop or file browser upload for T1 (Before) and T2 (After) satellite imagery.
   * Real-time image previews, resolution indicators, and file size detection.
   * **1-Click LEVIR-CD Sample Preloaders**: Instantly test real suburban residential expansions and commercial warehouse logistics developments in Texas.

2. **Real Siamese PyTorch Inference**:
   * Single-instance GPU/CPU model loading on startup with no overhead on requests.
   * Exact tensor transformation, ImageNet normalization, and differential feature forward pass.
   * Configurable probability threshold (0.1 to 0.9) with instant re-thresholding.

3. **Change Detection Map**:
   * Multi-view mode toggle: **Overlay** (with adjustable opacity slider), **Binary Mask**, and **Original Imagery**.
   * Canvas zoom in, zoom out, reset zoom, fullscreen mode, and direct PNG export download.

4. **Analysis Summary**:
   * **Total Area Analyzed** ($m^2$, hectares, pixel count).
   * **Changed Area** ($m^2$, hectares, change percentage).
   * **No Change Area** ($m^2$, pixel count).
   * **Model Confidence Score** (mathematically derived from network sigmoid logits).

5. **Before & After Interactive Comparison Slider**:
   * Smooth horizontal draggable divider handle to visually inspect ground truth changes against detected regions.

6. **Change Intensity Heatmap**:
   * Turbo continuous spectral color distribution visualizing model certainty from 0.0 to 1.0.

7. **Recent Analysis History**:
   * Persistent SQLite storage for previous runs.
   * 1-click reloading of historical analyses with instant visual recovery and deletion support.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check, device info (CUDA/CPU), model readiness |
| `GET` | `/model-info` | Architecture specs, patch size, normalization, checkpoint path |
| `GET` | `/samples` | Preloaded LEVIR-CD test pairs |
| `POST` | `/predict` | Bitemporal prediction (`before_image`, `after_image`, `threshold`) |
| `GET` | `/analyses` | List recent runs from SQLite database |
| `GET` | `/analyses/{id}`| Detailed metrics and artifact URLs for an analysis |
| `DELETE` | `/analyses/{id}`| Delete historical analysis and disk artifacts |
