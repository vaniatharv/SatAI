/**
 * API client service for Satellite Change Detection
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchModelInfo() {
  const res = await fetch(`${API_BASE}/model-info`);
  if (!res.ok) throw new Error('Failed to fetch model info');
  return res.json();
}

export async function fetchSamplePairs() {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample pairs');
  return res.json();
}

export async function runPrediction({ beforeFile, afterFile, threshold = 0.5, onProgress }) {
  const formData = new FormData();
  formData.append('before_image', beforeFile);
  formData.append('after_image', afterFile);
  formData.append('threshold', threshold.toString());

  if (onProgress) onProgress('Uploading images to inference server...');

  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = 'Inference failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      errorDetail = `Server error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchAnalyses() {
  const res = await fetch(`${API_BASE}/analyses`);
  if (!res.ok) throw new Error('Failed to fetch analyses list');
  return res.json();
}

export async function fetchAnalysisById(id) {
  const res = await fetch(`${API_BASE}/analyses/${id}`);
  if (!res.ok) throw new Error(`Failed to load analysis ${id}`);
  return res.json();
}

export async function deleteAnalysis(id) {
  const res = await fetch(`${API_BASE}/analyses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete analysis ${id}`);
  return res.json();
}
