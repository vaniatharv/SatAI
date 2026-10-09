import React from 'react';
import { Play, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function ActionControls({
  canRun,
  isLoading,
  loadingMessage,
  onRun,
  onReset,
  samplePairs = [],
  onSelectSample,
  threshold,
  onThresholdChange
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">

      {/* Sample Quick Selector */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center space-x-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>LEVIR Samples:</span>
        </span>
        {samplePairs.map((sample) => (
          <button
            key={sample.id}
            onClick={() => onSelectSample(sample)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-cyan-950/40 hover:border-cyan-700/60 text-slate-300 hover:text-cyan-300 border border-slate-700/70 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            {sample.title}
          </button>
        ))}
      </div>

      {/* Threshold and Run Buttons */}
      <div className="flex items-center space-x-4 w-full md:w-auto justify-end">

        {/* Detection Sensitivity slider */}
        <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Threshold:</span>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="w-20 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="font-mono text-cyan-400 w-8 text-right font-medium">{threshold.toFixed(2)}</span>
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          title="Reset Inputs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onRun}
          disabled={!canRun || isLoading}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all shadow-lg ${!canRun || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 cursor-pointer active:scale-98'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{loadingMessage || 'Processing...'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Change Detection</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}
