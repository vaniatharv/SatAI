import React, { useState } from 'react';
import { Flame, Download, ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers } from 'lucide-react';

export default function Heatmap({ heatmapUrl, overlayUrl, rawProbStats }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    if (!heatmapUrl) return;
    const link = document.createElement('a');
    link.href = heatmapUrl;
    link.download = 'change_intensity_heatmap.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-orange-950/70 border border-orange-800/80 rounded-md text-orange-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Change Intensity Heatmap</h3>
            <p className="text-[11px] text-slate-400">Continuous model probability distribution [0.0 - 1.0]</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {overlayUrl && (
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center space-x-1 px-2.5 py-1 text-xs rounded border transition-all ${showOverlay
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay Mode</span>
            </button>
          )}

          <div className="flex items-center space-x-1 text-slate-400">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={!heatmapUrl}
              className="p-1.5 hover:text-orange-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
              title="Download Heatmap"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Canvas */}
      <div className="relative h-[340px] bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        {heatmapUrl ? (
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center max-h-[320px]"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={heatmapUrl}
              alt="Change Intensity Heatmap"
              className="max-h-[320px] w-auto object-contain rounded shadow"
            />
          </div>
        ) : (
          <div className="text-center p-6 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Awaiting inference run.</p>
            <p className="text-[11px] text-slate-600">Continuous probability heatmap will render here.</p>
          </div>
        )}
      </div>

      {/* Turbo Colormap Scale Legend */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>0.0 (Unchanged / Baseline)</span>
          <span className="text-center text-slate-300">Continuous Probability Spectrum</span>
          <span>1.0 (Definite Building Change)</span>
        </div>
        <div
          className="h-3.5 w-full rounded-md shadow-inner border border-slate-700/60"
          style={{
            background: 'linear-gradient(to right, #30123b, #4662d8, #28bbec, #35f793, #a2fc3c, #fcc835, #f66319, #cb2802, #7a0403)'
          }}
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Low Probability</span>
          <span>Moderate Divergence</span>
          <span>High Intensity Change</span>
        </div>
      </div>

    </div>
  );
}
