import React, { useState } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

export default function ChangeDetectionMap({
  beforeUrl,
  afterUrl,
  maskUrl,
  overlayUrl,
  heatmapUrl,
  isLoading
}) {
  // Mode: 'overlay' | 'mask' | 'original' | 'heatmap'
  const [viewMode, setViewMode] = useState('overlay');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [opacity, setOpacity] = useState(0.65);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    let targetUrl = overlayUrl;
    if (viewMode === 'mask') targetUrl = maskUrl;
    if (viewMode === 'original') targetUrl = afterUrl;
    if (viewMode === 'heatmap') targetUrl = heatmapUrl;

    if (!targetUrl) return;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `satellite_change_${viewMode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasResults = Boolean(maskUrl && overlayUrl);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between ${isFullScreen ? 'fixed inset-4 z-50 overflow-hidden' : 'h-full min-h-[440px]'
      }`}>

      {/* Header and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-rose-950/80 border border-rose-800/80 rounded-md text-rose-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Change Detection Map</h3>
            <p className="text-[11px] text-slate-400">High-resolution AI building change prediction</p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${viewMode === 'overlay' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setViewMode('mask')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${viewMode === 'mask' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
          >
            Mask
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${viewMode === 'original' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
          >
            Original
          </button>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-1.5 text-slate-400">
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
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!hasResults}
            className="p-1.5 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
            title="Download Map"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas / Display Area */}
      <div className="relative my-3 flex-1 min-h-[300px] bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800/80 flex items-center justify-center">
        {hasResults ? (
          <div
            className="relative transition-transform duration-200 ease-out flex items-center justify-center max-h-[420px] max-w-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* View: Original After Image */}
            {viewMode === 'original' && (
              <img
                src={afterUrl}
                alt="Original After Satellite"
                className="max-h-[400px] w-auto object-contain rounded shadow"
              />
            )}

            {/* View: Binary Change Mask */}
            {viewMode === 'mask' && (
              <img
                src={maskUrl}
                alt="Binary Change Detection Mask"
                className="max-h-[400px] w-auto object-contain rounded shadow filter invert-0"
              />
            )}

            {/* View: Interactive Overlay (After + Mask with Opacity Slider) */}
            {viewMode === 'overlay' && (
              <div className="relative inline-block">
                <img
                  src={afterUrl}
                  alt="Base Satellite"
                  className="max-h-[400px] w-auto object-contain rounded shadow"
                />
                <img
                  src={maskUrl}
                  alt="Mask Overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
                  style={{
                    opacity: opacity,
                    filter: 'drop-shadow(0px 0px 4px rgba(239, 68, 68, 0.8)) hue-rotate(300deg) saturate(3)'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6 text-slate-500">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No analysis performed yet.</p>
            <p className="text-[11px] text-slate-600">Generated change detection map will appear here.</p>
          </div>
        )}

        {/* Legend Overlay */}
        {hasResults && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md px-3 py-1.5 flex items-center space-x-3 text-[11px] shadow">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
              <span className="text-slate-300 font-medium">Building Change</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-700 inline-block" />
              <span className="text-slate-400 font-medium">Unchanged</span>
            </div>
          </div>
        )}

        {/* Opacity slider for Overlay mode */}
        {hasResults && viewMode === 'overlay' && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-1 flex items-center space-x-2 text-[11px]">
            <span className="text-slate-400">Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800"
            />
            <span className="font-mono text-cyan-400 text-[10px]">{Math.round(opacity * 100)}%</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
        <span>Mode: {viewMode.toUpperCase()}</span>
        <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
      </div>

    </div>
  );
}
