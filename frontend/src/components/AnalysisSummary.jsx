import React from 'react';
import { Layers, Activity, Maximize2, ShieldCheck, PieChart, Info } from 'lucide-react';

export default function AnalysisSummary({ metrics, resolution, threshold }) {
  if (!metrics) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full flex flex-col justify-center items-center text-center">
        <Activity className="w-10 h-10 text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Awaiting Inference Run</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Upload Before & After temporal imagery and run analysis to compute building change metrics.
        </p>
      </div>
    );
  }

  const {
    total_area_m2,
    changed_area_m2,
    unchanged_area_m2,
    total_area_ha,
    changed_area_ha,
    total_pixels,
    changed_pixels,
    unchanged_pixels,
    change_percentage,
    confidence_score,
    changed_confidence,
    gsd_m_per_pixel,
    confidence_method
  } = metrics;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between h-full space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-cyan-950 border border-cyan-800 rounded-md text-cyan-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Analysis Summary</h3>
            <p className="text-[11px] text-slate-400">Physical metrics (GSD: {gsd_m_per_pixel}m/px)</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {resolution ? `${resolution[0]}×${resolution[1]} px` : '256×256 px'}
        </span>
      </div>

      {/* 4 Primary Cards Required by Specification */}
      <div className="grid grid-cols-2 gap-3">

        {/* Metric 1: Total Area Analyzed */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Area Analyzed
          </span>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono text-white tracking-tight">
              {total_area_m2.toLocaleString()} <span className="text-xs font-normal text-slate-400">m²</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ({total_area_ha.toFixed(2)} ha • {total_pixels.toLocaleString()} px)
            </div>
          </div>
        </div>

        {/* Metric 2: Changed Area */}
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-300 uppercase tracking-wider">
              Changed Area
            </span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              {change_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono text-rose-200 tracking-tight">
              {changed_area_m2.toLocaleString()} <span className="text-xs font-normal text-rose-400">m²</span>
            </div>
            <div className="text-[11px] text-rose-300/60 font-mono">
              ({changed_area_ha.toFixed(2)} ha • {changed_pixels.toLocaleString()} px)
            </div>
          </div>
        </div>

        {/* Metric 3: No Change Area */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400/90 uppercase tracking-wider">
              No Change Area
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {(100 - change_percentage).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono text-white tracking-tight">
              {unchanged_area_m2.toLocaleString()} <span className="text-xs font-normal text-slate-400">m²</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {unchanged_pixels.toLocaleString()} px
            </div>
          </div>
        </div>

        {/* Metric 4: Confidence Score */}
        <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-cyan-300 uppercase tracking-wider">
              Confidence Score
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono text-cyan-300 tracking-tight">
              {confidence_score.toFixed(1)}%
            </div>
            <div className="text-[11px] text-cyan-400/70 font-mono">
              Active change certainty: {changed_confidence.toFixed(1)}%
            </div>
          </div>
        </div>

      </div>

      {/* Progress Bar Proportion */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Change Ratio</span>
          <span className="font-mono text-slate-300">{change_percentage}% Changed</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${change_percentage}%` }}
          />
          <div
            className="h-full bg-slate-700 transition-all duration-500"
            style={{ width: `${100 - change_percentage}%` }}
          />
        </div>
      </div>

      {/* Explanation note */}
      <div className="text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 rounded p-2.5 flex items-start space-x-2">
        <Info className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
        <span className="leading-tight">
          Calculated using LEVIR-CD Ground Sample Distance of 0.5m/px (1 pixel = 0.25 m²). Confidence reflects mathematical sigmoid certainty derived from raw network probability logits.
        </span>
      </div>

    </div>
  );
}
