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
  // Compute estimated bounding dimensions for target track at current scale
  const currentWidthMeters = Math.round(targetTrack.boundingWidthMeters * targetTransform.scale);
  const currentHeightMeters = Math.round(targetTrack.boundingHeightMeters * targetTransform.scale);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 bg-carbon-900/95 border-t border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col gap-3.5 select-none">
      {/* Top Row: Precision Scale Scrubber & Quick Multipliers */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">RELATIVE SCALE ESTIMATE</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Est. Footprint: {currentWidthMeters}m × {currentHeightMeters}m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">TARGET SCALE:</span>
            <span className="text-amber-400 font-mono font-bold text-base bg-carbon-950 px-2 py-0.5 rounded border border-amber-400/30">
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
            className="flex items-center justify-center px-2 py-1.5 bg-carbon-800 hover:bg-carbon-700 disabled:opacity-50 text-slate-200 rounded border border-slate-700 text-xs font-mono font-medium transition-colors"
          >
            -1.0%
          </button>

          {/* Nudge -0.5% */}
          <button
            onClick={() => onNudgeScale(-0.005)}
            disabled={isRevealing}
            title="Fine Nudge Scale -0.5%"
            className="flex items-center justify-center px-2 py-1.5 bg-carbon-800 hover:bg-carbon-700 disabled:opacity-50 text-slate-200 rounded border border-slate-700 text-xs font-mono font-medium transition-colors"
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
              className="w-full h-2 bg-carbon-950 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none border border-slate-800"
            />
          </div>

          {/* Nudge +0.5% */}
          <button
            onClick={() => onNudgeScale(0.005)}
            disabled={isRevealing}
            title="Fine Nudge Scale +0.5%"
            className="flex items-center justify-center px-2 py-1.5 bg-carbon-800 hover:bg-carbon-700 disabled:opacity-50 text-slate-200 rounded border border-slate-700 text-xs font-mono font-medium transition-colors"
          >
            +0.5%
          </button>

          {/* Nudge +1% */}
          <button
            onClick={() => onNudgeScale(0.01)}
            disabled={isRevealing}
            title="Nudge Scale +1.0%"
            className="flex items-center justify-center px-2 py-1.5 bg-carbon-800 hover:bg-carbon-700 disabled:opacity-50 text-slate-200 rounded border border-slate-700 text-xs font-mono font-medium transition-colors"
          >
            +1.0%
          </button>
        </div>
      </div>

      {/* Bottom Row: Orientation Controls, Ghosting & Lock In Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
        {/* Left Sub-Group: Alignment and Transparency */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rotate 90° Button */}
          <button
            onClick={onRotate90}
            disabled={isRevealing}
            className="flex items-center gap-1.5 px-3 py-2 bg-carbon-800 hover:bg-carbon-700 active:bg-carbon-600 disabled:opacity-50 text-slate-200 rounded-lg border border-slate-700/80 text-xs font-mono font-semibold transition-colors"
            title="Rotate 90 degrees to align straights"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Rotate 90°</span>
            <span className="text-slate-400 text-[10px]">({targetTransform.rotation}°)</span>
          </button>

          {/* Re-center Target Button */}
          <button
            onClick={onCenterTarget}
            disabled={isRevealing}
            className="flex items-center gap-1.5 px-3 py-2 bg-carbon-800 hover:bg-carbon-700 active:bg-carbon-600 disabled:opacity-50 text-slate-200 rounded-lg border border-slate-700/80 text-xs font-mono font-semibold transition-colors"
            title="Re-center target over anchor"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Center</span>
          </button>

          {/* Opacity Scrubber */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-carbon-950/80 border border-slate-800 rounded-lg">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Ghost:</span>
            <input
              type="range"
              min="0.25"
              max="1.0"
              step="0.05"
              value={targetTransform.opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              disabled={isRevealing}
              className="w-16 sm:w-20 h-1.5 bg-carbon-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Adjust overlay opacity"
            />
            <span className="text-[10px] font-mono text-slate-400">
              {Math.round(targetTransform.opacity * 100)}%
            </span>
          </div>
        </div>

        {/* Right Sub-Group: The Primary Lock In Button */}
        <div>
          <button
            onClick={onLockIn}
            disabled={isRevealing}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg font-mono font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-lg ${
              isRevealing
                ? 'bg-emerald-600 text-white cursor-not-allowed opacity-80'
                : 'bg-amber-400 hover:bg-amber-300 text-carbon-950 shadow-amber-glow active:scale-[0.98]'
            }`}
          >
            {isRevealing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>COMPUTING DELTA...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-carbon-950" />
                <span>LOCK IN ESTIMATE 🏁</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
