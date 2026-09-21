import React, { useRef, useMemo } from 'react';
import type { Track, TransformState } from '../types/game';
import type { StageTransform } from '../hooks/useCanvasTransform';
import { Compass, Move, Maximize2 } from 'lucide-react';

interface TrackCanvasProps {
  referenceTrack: Track;
  targetTrack: Track;
  targetTransform: TransformState;
  ghostTransform: TransformState | null;
  stageTransform: StageTransform;
  isRevealing: boolean;
  handlers: {
    onTargetPointerDown: (e: React.PointerEvent) => void;
    onStagePointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  onResetCamera?: () => void;
  onCenterTarget?: () => void;
}

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  referenceTrack,
  targetTrack,
  targetTransform,
  ghostTransform,
  stageTransform,
  isRevealing,
  handlers,
  onResetCamera,
  onCenterTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stroke width that scales inversely with zoom to maintain sharp ~3.5px line weight on screen
  const strokeWidth = useMemo(() => {
    return Math.max(1.5, Math.min(6.0, 3.2 / stageTransform.zoom));
  }, [stageTransform.zoom]);

  // Scaled stroke for ghost line
  const ghostStrokeWidth = useMemo(() => {
    return Math.max(1.0, Math.min(4.0, 2.0 / stageTransform.zoom));
  }, [stageTransform.zoom]);

  // Calculate dynamic metric ruler length (find a nice round number in meters: 100m, 250m, 500m, 1000m)
  const rulerMetric = useMemo(() => {
    // Want ruler bar to be ~100 to 180 pixels wide on screen
    const targetPixels = 120;
    const rawMeters = targetPixels / stageTransform.zoom;

    const roundSteps = [50, 100, 200, 250, 500, 1000, 2000, 5000];
    let chosen = roundSteps[0];
    for (const step of roundSteps) {
      if (Math.abs(step - rawMeters) < Math.abs(chosen - rawMeters)) {
        chosen = step;
      }
    }
    const pixelWidth = chosen * stageTransform.zoom;
    const feet = Math.round(chosen * 3.28084);
    return {
      meters: chosen,
      feet,
      pixelWidth,
    };
  }, [stageTransform.zoom]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-carbon-950 cursor-crosshair touch-none"
      onPointerDown={handlers.onStagePointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onWheel={handlers.onWheel}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
    >
      {/* Dynamic Telemetry Grid Lines (fixed screen overlay) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 telemetry-grid"
        style={{
          backgroundPosition: `${stageTransform.x % 40}px ${stageTransform.y % 40}px`,
        }}
      />

      {/* Crosshair Center Reticle */}
      <div 
        className="absolute pointer-events-none transition-transform duration-75"
        style={{
          left: `calc(50% + ${stageTransform.x}px)`,
          top: `calc(50% + ${stageTransform.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Main Interactive SVG Viewport */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        style={{
          transformOrigin: '50% 50%',
        }}
      >
        <defs>
          {/* Cyan Glow Filter */}
          <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00F0FF" floodOpacity="0.85" />
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#00F0FF" floodOpacity="0.4" />
          </filter>

          {/* Yellow Glow Filter */}
          <filter id="yellowGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFDE00" floodOpacity="0.85" />
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#FFDE00" floodOpacity="0.45" />
          </filter>

          {/* Ghost Glow Filter */}
          <filter id="ghostGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#F59E0B" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Global World Space: Centered at canvas center (50% 50%) + stage pan & zoom */}
        <g
          style={{
            transform: `translate(calc(50% + ${stageTransform.x}px), calc(50% + ${stageTransform.y}px)) scale(${stageTransform.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Reference Track (Cyan Vector Stroke - Fixed Anchor at 1.0x Scale) */}
          <g id="reference-track-group">
            {/* Soft Ambient Fill */}
            <path
              d={referenceTrack.svgPath}
              fill="#00F0FF"
              fillOpacity="0.04"
              stroke="none"
            />
            {/* Primary High-Contrast Cyan Stroke */}
            <path
              d={referenceTrack.svgPath}
              fill="none"
              stroke="#00F0FF"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#cyanGlow)"
              className="transition-colors duration-200"
            />
          </g>

          {/* Ghost Target Outline (Visible during reveal to show user's committed guess) */}
          {ghostTransform && (
            <g
              id="ghost-track-group"
              style={{
                transform: `translate(${ghostTransform.x}px, ${ghostTransform.y}px) rotate(${ghostTransform.rotation}deg) scale(${ghostTransform.scale})`,
                transformOrigin: '0 0',
              }}
            >
              <path
                d={targetTrack.svgPath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={ghostStrokeWidth}
                strokeDasharray={`${6 / stageTransform.zoom}, ${5 / stageTransform.zoom}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
                filter="url(#ghostGlow)"
              />
            </g>
          )}

          {/* Target Track (Interactive Neon Yellow/Amber Vector Stroke) */}
          <g
            id="target-track-group"
            style={{
              transform: `translate(${targetTransform.x}px, ${targetTransform.y}px) rotate(${targetTransform.rotation}deg) scale(${targetTransform.scale})`,
              transformOrigin: '0 0',
              opacity: targetTransform.opacity,
            }}
          >
            {/* Ambient Interior Fill */}
            <path
              d={targetTrack.svgPath}
              fill="#FFDE00"
              fillOpacity={0.08}
              stroke="none"
            />

            {/* Neon Yellow Stroke with Glow */}
            <path
              d={targetTrack.svgPath}
              fill="none"
              stroke={isRevealing ? "#00E676" : "#FFDE00"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#yellowGlow)"
            />

            {/* Invisible Thick Hit-Area Stroke for Easy Touch/Mouse Dragging */}
            <path
              d={targetTrack.svgPath}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(40, 30 / stageTransform.zoom)}
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              onPointerDown={handlers.onTargetPointerDown}
            />
          </g>
        </g>
      </svg>

      {/* Overlay HUD Badges & Indicators */}
      {/* Top Left: Track Telemetry Cards */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        {/* Reference Track Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-carbon-900/90 border border-cyan-500/40 rounded-lg shadow-cyan-glow backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-telemetry-cyan shadow-[0_0_8px_#00F0FF] animate-pulse" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-semibold tracking-wider uppercase">
              <span>{referenceTrack.shortName}</span>
              <span className="text-[10px] text-cyan-500/70">({referenceTrack.series.toUpperCase()})</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {(referenceTrack.officialLapLengthMeters / 1000).toFixed(3)} km • {referenceTrack.boundingWidthMeters}m × {referenceTrack.boundingHeightMeters}m
            </div>
          </div>
          <div className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold">
            1.000x ANCHOR
          </div>
        </div>

        {/* Target Track Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-carbon-900/90 border border-amber-500/40 rounded-lg shadow-amber-glow backdrop-blur-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-telemetry-yellow shadow-[0_0_8px_#FFDE00]" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-semibold tracking-wider uppercase">
              <span>{targetTrack.shortName}</span>
              <span className="text-[10px] text-amber-500/70">({targetTrack.series.toUpperCase()})</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {(targetTrack.officialLapLengthMeters / 1000).toFixed(3)} km • {targetTrack.turns} Turns
            </div>
          </div>
          <div className={`ml-2 px-2 py-0.5 rounded text-xs font-mono font-bold border ${
            isRevealing 
              ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-400 shadow-green-glow' 
              : 'bg-amber-950/80 border-amber-400/40 text-amber-300'
          }`}>
            {isRevealing ? 'TRUE SCALE: 1.000x' : `GUESS: ${targetTransform.scale.toFixed(3)}x`}
          </div>
        </div>
      </div>

      {/* Top Right: Compass & Orientation Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {onCenterTarget && (
          <button
            onClick={onCenterTarget}
            title="Center Target Track over Reference"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-carbon-900/90 hover:bg-carbon-800 border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300 transition-colors shadow-sm"
          >
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Center Target</span>
          </button>
        )}

        {onResetCamera && (
          <button
            onClick={onResetCamera}
            title="Reset Viewport Framing"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-carbon-900/90 hover:bg-carbon-800 border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300 transition-colors shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        )}

        {/* North Compass Badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-carbon-900/90 border border-slate-700/60 text-slate-400">
          <Compass className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      {/* Bottom Left: Calibrated Metric Scale Ruler */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 p-2 bg-carbon-900/85 border border-slate-800/80 rounded-lg backdrop-blur-md pointer-events-none">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>0m</span>
          <span className="font-semibold text-slate-200">
            {rulerMetric.meters >= 1000 ? `${rulerMetric.meters / 1000} km` : `${rulerMetric.meters} m`}
          </span>
        </div>
        {/* Visual Scale Bar */}
        <div 
          className="h-1.5 bg-cyan-400/80 rounded-sm border-x border-cyan-200 shadow-[0_0_6px_rgba(0,240,255,0.4)]"
          style={{ width: `${Math.max(40, rulerMetric.pixelWidth)}px` }}
        />
        <div className="text-[9px] font-mono text-slate-500 text-right">
          {rulerMetric.feet.toLocaleString()} ft
        </div>
      </div>

      {/* Interactive Guidance Tip Banner */}
      {!isRevealing && (
        <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2 px-3 py-1.5 bg-carbon-900/80 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 pointer-events-none backdrop-blur-sm">
          <Move className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Drag amber track • Shift+Wheel to resize • Space+Drag to pan</span>
        </div>
      )}
    </div>
  );
};
