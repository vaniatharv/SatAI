import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ImageUploadCard from '../components/ImageUploadCard';
import ActionControls from '../components/ActionControls';
import AnalysisSummary from '../components/AnalysisSummary';
import ChangeDetectionMap from '../components/ChangeDetectionMap';
import ComparisonSlider from '../components/ComparisonSlider';
import Heatmap from '../components/Heatmap';
import RecentAnalyses from '../components/RecentAnalyses';
import SettingsModal from '../components/SettingsModal';
import {
  fetchHealth,
  fetchModelInfo,
  fetchSamplePairs,
  runPrediction,
  fetchAnalyses,
  deleteAnalysis
} from '../services/api';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Dashboard() {
  // System State
  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [samplePairs, setSamplePairs] = useState([]);
  const [analysesList, setAnalysesList] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Input State
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [threshold, setThreshold] = useState(0.5);

  // Execution & Progress State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active Analysis Result
  const [currentResult, setCurrentResult] = useState(null);

  // Load system data on startup
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [healthData, modelData, samplesData, historyData] = await Promise.allSettled([
        fetchHealth(),
        fetchModelInfo(),
        fetchSamplePairs(),
        fetchAnalyses()
      ]);

      if (healthData.status === 'fulfilled') setHealth(healthData.value);
      if (modelData.status === 'fulfilled') setModelInfo(modelData.value);
      if (samplesData.status === 'fulfilled') {
        setSamplePairs(samplesData.value);
        // Pre-select first sample for immediate instant testing
        if (samplesData.value.length > 0 && !beforePreview) {
          handleSelectSample(samplesData.value[0]);
        }
      }
      if (historyData.status === 'fulfilled') setAnalysesList(historyData.value);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // Convert image URL to a File object for seamless upload handling
  const urlToFile = async (url, filename) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const handleSelectSample = async (sample) => {
    try {
      setErrorMessage(null);
      setBeforePreview(sample.before_url);
      setAfterPreview(sample.after_url);

      const [f1, f2] = await Promise.all([
        urlToFile(sample.before_url, `${sample.id}_before.png`),
        urlToFile(sample.after_url, `${sample.id}_after.png`)
      ]);

      setBeforeFile(f1);
      setAfterFile(f2);
      setSuccessMessage(`Loaded ${sample.title} (${sample.region})`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage(`Failed to load sample pair: ${err.message}`);
    }
  };

  const handleBeforeSelect = (file) => {
    setBeforeFile(file);
    setBeforePreview(URL.createObjectURL(file));
  };

  const handleAfterSelect = (file) => {
    setAfterFile(file);
    setAfterPreview(URL.createObjectURL(file));
  };

  const handleClearBefore = () => {
    setBeforeFile(null);
    setBeforePreview(null);
  };

  const handleClearAfter = () => {
    setAfterFile(null);
    setAfterPreview(null);
  };

  const handleResetAll = () => {
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview(null);
    setAfterPreview(null);
    setCurrentResult(null);
    setErrorMessage(null);
  };

  const handleRunInference = async () => {
    if (!beforeFile || !afterFile) {
      setErrorMessage('Please upload or select both Before and After satellite images.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Multi-phase progress indicator
    setLoadingStep('Preparing images...');
    await new Promise((r) => setTimeout(r, 200));

    try {
      setLoadingStep('Running Siamese AI model...');
      const result = await runPrediction({
        beforeFile,
        afterFile,
        threshold,
        onProgress: (msg) => setLoadingStep(msg)
      });

      setLoadingStep('Generating change map & metrics...');
      await new Promise((r) => setTimeout(r, 250));

      setCurrentResult(result);
      setSuccessMessage(`Inference completed successfully: #${result.analysis_id}`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refresh recent analyses table
      const updatedAnalyses = await fetchAnalyses();
      setAnalysesList(updatedAnalyses);
    } catch (err) {
      setErrorMessage(`Detection Error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSelectHistoryItem = (item) => {
    setBeforePreview(item.before_url);
    setAfterPreview(item.after_url);
    setCurrentResult({
      analysis_id: item.id,
      before_filename: item.before_filename,
      after_filename: item.after_filename,
      threshold: item.threshold,
      metrics: {
        total_area_m2: item.total_area_m2,
        changed_area_m2: item.changed_area_m2,
        unchanged_area_m2: item.unchanged_area_m2,
        total_pixels: item.total_pixels,
        changed_pixels: item.changed_pixels,
        unchanged_pixels: item.unchanged_pixels,
        change_percentage: item.change_percentage,
        confidence_score: item.confidence_score,
        changed_confidence: item.changed_confidence,
        total_area_ha: item.total_area_m2 / 10000,
        changed_area_ha: item.changed_area_m2 / 10000,
        gsd_m_per_pixel: 0.5,
        confidence_method: "Derived from model logits"
      },
      before_image_url: item.before_url,
      after_image_url: item.after_url,
      change_map_url: item.mask_url,
      heatmap_url: item.heatmap_url,
      overlay_url: item.overlay_url
    });

    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      await deleteAnalysis(id);
      setAnalysesList((prev) => prev.filter((a) => a.id !== id));
      if (currentResult?.analysis_id === id) {
        setCurrentResult(null);
      }
    } catch (err) {
      setErrorMessage(`Failed to delete record: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">

      {/* Top Header */}
      <Header
        health={health}
        modelInfo={modelInfo}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Notification Toasts */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center space-x-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section 1: Input Images */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 m-0">
              Input Images
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Temporal Bitemporal Pair (T1 & T2)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadCard
              id="before-upload"
              title="Before Image (T1)"
              subtitle="Earlier temporal satellite image"
              badgeColor="cyan"
              file={beforeFile}
              previewUrl={beforePreview}
              onFileSelect={handleBeforeSelect}
              onClear={handleClearBefore}
            />

            <ImageUploadCard
              id="after-upload"
              title="After Image (T2)"
              subtitle="Later temporal satellite image"
              badgeColor="blue"
              file={afterFile}
              previewUrl={afterPreview}
              onFileSelect={handleAfterSelect}
              onClear={handleClearAfter}
            />
          </div>
        </section>

        {/* Section 2: Action & Controls Bar */}
        <section>
          <ActionControls
            canRun={Boolean(beforeFile && afterFile)}
            isLoading={isLoading}
            loadingMessage={loadingStep}
            onRun={handleRunInference}
            onReset={handleResetAll}
            samplePairs={samplePairs}
            onSelectSample={handleSelectSample}
            threshold={threshold}
            onThresholdChange={setThreshold}
          />
        </section>

        {/* Section 3: Dual Grid - Change Map & Analysis Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Change Detection Map (7 Cols) */}
          <div className="lg:col-span-7">
            <ChangeDetectionMap
              beforeUrl={beforePreview}
              afterUrl={afterPreview}
              maskUrl={currentResult?.change_map_url}
              overlayUrl={currentResult?.overlay_url}
              heatmapUrl={currentResult?.heatmap_url}
              isLoading={isLoading}
            />
          </div>

          {/* Analysis Summary (5 Cols) */}
          <div className="lg:col-span-5">
            <AnalysisSummary
              metrics={currentResult?.metrics}
              resolution={currentResult?.resolution}
              threshold={threshold}
            />
          </div>
        </section>

        {/* Section 4: Before & After Comparison Slider */}
        <section>
          <ComparisonSlider
            beforeUrl={beforePreview}
            afterUrl={afterPreview}
          />
        </section>

        {/* Section 5: Change Intensity Heatmap */}
        <section>
          <Heatmap
            heatmapUrl={currentResult?.heatmap_url}
            overlayUrl={currentResult?.overlay_url}
          />
        </section>

        {/* Section 6: Recent Analyses Table */}
        <section>
          <RecentAnalyses
            analyses={analysesList}
            currentId={currentResult?.analysis_id}
            onSelectAnalysis={handleSelectHistoryItem}
            onDeleteAnalysis={handleDeleteHistoryItem}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-8 text-center text-xs text-slate-500 font-mono">
        Satellite Change Detection Dashboard • LEVIR-CD Benchmark • PyTorch Siamese U-Net Engine
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        modelInfo={modelInfo}
        threshold={threshold}
        onThresholdChange={setThreshold}
      />

    </div>
  );
}
