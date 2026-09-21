import React from 'react';
import type { TransformState, Track } from '../types/game';
import { 
  RotateCw, 
  Layers, 
  Crosshair, 
  CheckCircle2, 
  Sparkles,
  Gauge
} from 'lucide-react';

interface ControlsProps {
  targetTransform: TransformState;
  targetTrack: Track;
  referenceTrack?: Track;
  isRevealing: boolean;
  onScaleChange: (scale: number) => void;
  onNudgeScale: (delta: number) => void;
  onRotate90: () => void;
  onOpacityChange: (opacity: number) => void;
  onCenterTarget: () => void;
  onLockIn: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  targetTransform,
  targetTrack,
  isRevealing,
  onScaleChange,
  onNudgeScale,
  onRotate90,
  onOpacityChange,
  onCenterTarget,
  onLockIn,
}) => {
  const currentWidthMeters = Math.round(targetTrack.boundingWidthMeters * targetTransform.scale);
  const currentHeightMeters = Math.round(targetTrack.boundingHeightMeters * targetTransform.scale);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 backdrop-blur-xl shadow-2xl flex flex-col gap-3 select-none transition-colors">
      {/* Top Row: Precision Scale Scrubber & Telemetry Readout */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Gauge className="w-4 h-4 text-amber-500" />
            <span className="font-bold">RELATIVE SCALE ESTIMATE</span>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              Est: {currentWidthMeters}m × {currentHeightMeters}m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">TARGET SCALE:</span>
            <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-sm">
              {targetTransform.scale.toFixed(3)}x
            </span>
          </div>
        </div>

        {/* Range Slider with Fine Stepper Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nudge -1% */}
          <button
            onClick={() => onNudgeScale(-0.01)}
            disabled={isRevealing}
            title="Nudge Scale -1.0%"
            className="flex items-center justify-center px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
          >
            -1.0%
          </button>

          {/* Nudge -0.5% */}
          <button
            onClick={() => onNudgeScale(-0.005)}
            disabled={isRevealing}
            title="Fine Nudge Scale -0.5%"
            className="flex items-center justify-center px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
          >
            -0.5%
          </button>

          {/* Main Continuous Precision Slider */}
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0.20"
              max="3.00"
              step="0.005"
              value={targetTransform.scale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              disabled={isRevealing}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none border border-slate-300 dark:border-slate-800"
            />
          </div>

          {/* Nudge +0.5% */}
          <button
            onClick={() => onNudgeScale(0.005)}
            disabled={isRevealing}
            title="Fine Nudge Scale +0.5%"
            className="flex items-center justify-center px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
          >
            +0.5%
          </button>

          {/* Nudge +1% */}
          <button
            onClick={() => onNudgeScale(0.01)}
            disabled={isRevealing}
            title="Nudge Scale +1.0%"
            className="flex items-center justify-center px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
          >
            +1.0%
          </button>
        </div>
      </div>

      {/* Bottom Row: Orientation Controls, Ghosting & Lock In Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-200 dark:border-slate-800">
        {/* Left Sub-Group: Alignment and Transparency */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rotate 90° Button */}
          <button
            onClick={onRotate90}
            disabled={isRevealing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm"
            title="Rotate 90 degrees to align straights"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Rotate 90°</span>
            <span className="text-slate-400 text-[10px]">({targetTransform.rotation}°)</span>
          </button>

          {/* Re-center Target Button */}
          <button
            onClick={onCenterTarget}
            disabled={isRevealing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold transition-all shadow-sm"
            title="Re-center target over anchor"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Center</span>
          </button>

          {/* Opacity Scrubber */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm">
            <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-medium hidden sm:inline">Ghost:</span>
            <input
              type="range"
              min="0.25"
              max="1.0"
              step="0.05"
              value={targetTransform.opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              disabled={isRevealing}
              className="w-16 sm:w-20 h-1.5 bg-slate-300 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              title="Adjust overlay opacity"
            />
            <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
              {Math.round(targetTransform.opacity * 100)}%
            </span>
          </div>
        </div>

        {/* Right Sub-Group: The Primary Lock In Button */}
        <div>
          <button
            onClick={onLockIn}
            disabled={isRevealing}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-mono font-black text-sm tracking-wider uppercase transition-all duration-200 shadow-md ${
              isRevealing
                ? 'bg-emerald-600 text-white cursor-not-allowed opacity-80'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-95'
            }`}
          >
            {isRevealing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>COMPUTING DELTA...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>LOCK IN ESTIMATE 🏁</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
