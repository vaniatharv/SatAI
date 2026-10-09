import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, RotateCcw, Maximize2, MoveHorizontal } from 'lucide-react';

export default function ComparisonSlider({ beforeUrl, afterUrl }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const onGlobalMouseUp = () => setIsDragging(false);
    const onGlobalMouseMove = (e) => {
      if (isDragging) handleMove(e.clientX);
    };

    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('mousemove', onGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('mousemove', onGlobalMouseMove);
    };
  }, [isDragging, handleMove]);

  const handleReset = () => setSliderPosition(50);

  if (!beforeUrl || !afterUrl) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg min-h-[360px] flex flex-col justify-center items-center text-center">
        <Columns className="w-10 h-10 text-slate-700 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">Before & After Comparison</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select or upload temporal image pairs to visually verify building variations using the interactive slider.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-cyan-950 border border-cyan-800 rounded-md text-cyan-400">
            <Columns className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Before & After Comparison</h3>
            <p className="text-[11px] text-slate-400">Drag vertical slider horizontally to cross-reference changes</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Slider</span>
        </button>
      </div>

      {/* Comparison Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[380px] bg-black/40 rounded-lg overflow-hidden select-none border border-slate-800 cursor-ew-resize group"
      >
        {/* Layer 2: AFTER Image (Underneath) */}
        <img
          src={afterUrl}
          alt="After Satellite Imagery"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Layer 1: BEFORE Image (Clipped from left) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeUrl}
            alt="Before Satellite Imagery"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              maxWidth: 'none'
            }}
          />
        </div>

        {/* Draggable Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] z-20 cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Centered Circular Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-xl flex items-center justify-center text-cyan-300">
            <MoveHorizontal className="w-4 h-4" />
          </div>
        </div>

        {/* Labels: BEFORE and AFTER */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded border border-slate-700/80 text-[11px] font-mono font-semibold tracking-wider text-cyan-300 pointer-events-none z-10 shadow">
          BEFORE (T1)
        </div>
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded border border-slate-700/80 text-[11px] font-mono font-semibold tracking-wider text-blue-300 pointer-events-none z-10 shadow">
          AFTER (T2)
        </div>

        {/* Position percentage indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 pointer-events-none border border-slate-800">
          Slider: {Math.round(sliderPosition)}%
        </div>

      </div>
    </div>
  );
}
