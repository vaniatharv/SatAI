import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Satellite, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

export default function Header({ health, modelInfo, onOpenSettings }) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isModelReady = health?.model_loaded ?? false;
  const isCuda = health?.cuda_available ?? false;
  const deviceName = health?.gpu_name || health?.device?.toUpperCase() || 'CPU';

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Satellite className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white m-0">
                  Satellite Change Detection
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  LEVIR-CD
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                AI-powered temporal satellite imagery analysis
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Live Model Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                isModelReady ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
              }`} />
              <span className="font-medium text-slate-200">
                {isModelReady ? 'Model Ready' : 'Initializing Model'}
              </span>
              <span className="text-slate-500">|</span>
              <div className="flex items-center space-x-1 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[11px]">{deviceName}</span>
              </div>
            </div>

            {/* LEVIR-CD Benchmark details button */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              title="Benchmark Details"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all shadow-sm"
              title="Model & Detection Settings"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Settings</span>
            </button>

          </div>
        </div>
      </header>

      {/* Dataset & Model Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-cyan-950/60 border border-cyan-800/80 rounded-lg text-cyan-400">
                <Satellite className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">LEVIR-CD Siamese U-Net Benchmark</h3>
                <p className="text-xs text-slate-400">Remote Sensing Building Change Detection</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>LEVIR-CD</strong> is a benchmark dataset consisting of Very High Resolution (<strong>0.5 m/pixel GSD</strong>) Google Earth image patch pairs covering 20 regions in Texas (Austin, Lakeway, Buda, Kyle, Pflugerville, etc.) spanning 5 to 14 temporal years.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Architecture:</span>
                  <span className="text-cyan-400">Siamese U-Net (Feature Difference)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Checkpoint:</span>
                  <span className="text-emerald-400">
                    {modelInfo?.checkpoint_path ? (modelInfo.checkpoint_path.split(/[\\/]/).pop() || modelInfo.checkpoint_path) : 'best_siamese_unet (1).pth'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Resolution:</span>
                  <span className="text-slate-200">256 x 256 (Siamese Patch)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GSD:</span>
                  <span className="text-slate-200">0.5 meters / pixel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Input Channels:</span>
                  <span className="text-slate-200">3 (RGB Bitemporal)</span>
                </div>
              </div>
              <p className="text-slate-400">
                The network extracts multi-scale visual features from both timestamps through a weight-shared encoder, isolates structural differentials, and outputs pixel-accurate change masks and intensity heatmaps.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
