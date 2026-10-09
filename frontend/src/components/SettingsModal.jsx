import React from 'react';
import { X, Sliders, Cpu, Database, Save, Info } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  modelInfo,
  threshold,
  onThresholdChange
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Sliders className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-wide">System & Model Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          
          {/* Runtime Info */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <h4 className="text-slate-300 font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>PyTorch Runtime Configuration</span>
            </h4>
            <div className="space-y-1 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Model Architecture:</span>
                <span className="text-slate-200">{modelInfo?.model_type || 'Siamese U-Net'}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Device:</span>
                <span className="text-cyan-400">{modelInfo?.device?.toUpperCase() || 'CPU'}</span>
              </div>
              <div className="flex justify-between">
                <span>CUDA Enabled:</span>
                <span className={modelInfo?.cuda_available ? 'text-emerald-400' : 'text-amber-400'}>
                  {modelInfo?.cuda_available ? 'YES' : 'NO (CPU Optimized)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resolution / Patch Size:</span>
                <span className="text-slate-200">{modelInfo?.input_size} × {modelInfo?.input_size}</span>
              </div>
              <div className="flex justify-between">
                <span>Checkpoint Path:</span>
                <span className="text-slate-200 truncate max-w-[200px]" title={modelInfo?.checkpoint_path}>
                  {modelInfo?.checkpoint_path ? (modelInfo.checkpoint_path.split(/[\\/]/).pop() || modelInfo.checkpoint_path) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Decision Threshold */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                Decision Threshold (Sigmoid Cutoff)
              </label>
              <span className="font-mono text-cyan-400 font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <p className="text-[11px] text-slate-500">
              Higher values (e.g. 0.65) require stronger model activation to register as building change. Lower values (e.g. 0.35) increase sensitivity to subtle ground variations.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
}
