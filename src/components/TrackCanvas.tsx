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
  isDark?: boolean;
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
  isDark = true,
  handlers,
  onResetCamera,
  onCenterTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stroke width that scales inversely with zoom to maintain sharp ~3.2px line weight on screen
  const strokeWidth = useMemo(() => {
    return Math.max(1.5, Math.min(6.0, 3.2 / stageTransform.zoom));
  }, [stageTransform.zoom]);

  // Scaled stroke for ghost line
  const ghostStrokeWidth = useMemo(() => {
    return Math.max(1.0, Math.min(4.0, 2.0 / stageTransform.zoom));
  }, [stageTransform.zoom]);

  // Palette definition based on active theme
  const palette = useMemo(() => {
    if (isDark) {
      return {
        anchorStroke: '#00F0FF',
        anchorFill: '#00F0FF',
        guessStroke: isRevealing ? '#10B981' : '#FBBF24',
        guessFill: '#FBBF24',
        ghostStroke: '#F59E0B',
        rulerBar: '#00F0FF',
        hudCard: 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-xl',
        hudButton: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
        reticle: 'border-slate-600/40',
        rulerCard: 'bg-slate-900/90 border-slate-700/80 text-slate-300',
      };
    }
    return {
      anchorStroke: '#1D4ED8', // Rich FIA royal blue
      anchorFill: '#1D4ED8',
      guessStroke: isRevealing ? '#059669' : '#EA580C', // Deep racing orange / emerald
      guessFill: '#EA580C',
      ghostStroke: '#C2410C',
      rulerBar: '#1D4ED8',
      hudCard: 'bg-white/95 border-slate-200 text-slate-900 shadow-lg',
      hudButton: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300',
      reticle: 'border-slate-400/40',
      rulerCard: 'bg-white/90 border-slate-200 text-slate-700',
    };
  }, [isDark, isRevealing]);

  // Calculate dynamic metric ruler length
  const rulerMetric = useMemo(() => {
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
      className={`relative w-full h-full overflow-hidden select-none cursor-crosshair touch-none ${
        isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]'
      }`}
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
        className="absolute inset-0 pointer-events-none telemetry-grid"
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
        <div className={`w-8 h-8 border ${palette.reticle} rounded-full flex items-center justify-center`}>
          <div className="w-1.5 h-1.5 bg-slate-400/40 rounded-full" />
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
          <filter id="cleanTrackShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity={isDark ? "0.65" : "0.2"} />
          </filter>
        </defs>

        {/* Global World Space: Centered at canvas center (50% 50%) + stage pan & zoom */}
        <g
          style={{
            transform: `translate(calc(50% + ${stageTransform.x}px), calc(50% + ${stageTransform.y}px)) scale(${stageTransform.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Reference Track (Fixed Anchor at 1.0x Scale) */}
          <g id="reference-track-group">
            {/* Ambient Interior Fill */}
            <path
              d={referenceTrack.svgPath}
              fill={palette.anchorFill}
              fillOpacity={isDark ? 0.06 : 0.05}
              stroke="none"
            />
            {/* Primary Clean Vector Stroke */}
            <path
              d={referenceTrack.svgPath}
              fill="none"
              stroke={palette.anchorStroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#cleanTrackShadow)"
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
                stroke={palette.ghostStroke}
                strokeWidth={ghostStrokeWidth}
                strokeDasharray={`${6 / stageTransform.zoom}, ${5 / stageTransform.zoom}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.65}
              />
            </g>
          )}

          {/* Target Track (Interactive Guess Vector Stroke) */}
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
              fill={palette.guessFill}
              fillOpacity={isDark ? 0.08 : 0.06}
              stroke="none"
            />

            {/* Sharp Vector Stroke */}
            <path
              d={targetTrack.svgPath}
              fill="none"
              stroke={palette.guessStroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#cleanTrackShadow)"
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
        <div className={`flex items-center gap-2.5 px-3.5 py-2 border rounded-xl backdrop-blur-md ${palette.hudCard}`}>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: palette.anchorStroke }} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase">
              <span className={isDark ? "text-cyan-400" : "text-blue-700"}>{referenceTrack.shortName}</span>
              <span className="text-[10px] opacity-60">({referenceTrack.series.toUpperCase()})</span>
            </div>
            <div className="text-[10px] font-mono opacity-70">
              {(referenceTrack.officialLapLengthMeters / 1000).toFixed(3)} km • {referenceTrack.boundingWidthMeters}m × {referenceTrack.boundingHeightMeters}m
            </div>
          </div>
          <div className={`ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${
            isDark 
              ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            1.000x ANCHOR
          </div>
        </div>

        {/* Target Track Badge */}
        <div className={`flex items-center gap-2.5 px-3.5 py-2 border rounded-xl backdrop-blur-md pointer-events-auto ${palette.hudCard}`}>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: palette.guessStroke }} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase">
              <span className={isDark ? "text-amber-400" : "text-amber-700"}>{targetTrack.shortName}</span>
              <span className="text-[10px] opacity-60">({targetTrack.series.toUpperCase()})</span>
            </div>
            <div className="text-[10px] font-mono opacity-70">
              {(targetTrack.officialLapLengthMeters / 1000).toFixed(3)} km • {targetTrack.turns} Turns
            </div>
          </div>
          <div className={`ml-2 px-2 py-0.5 rounded text-xs font-mono font-extrabold border ${
            isRevealing 
              ? (isDark ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800')
              : (isDark ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800')
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
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-mono font-semibold transition-colors shadow-sm ${palette.hudButton}`}
          >
            <Move className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Center Target</span>
          </button>
        )}

        {onResetCamera && (
          <button
            onClick={onResetCamera}
            title="Reset Viewport Framing"
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-mono font-semibold transition-colors shadow-sm ${palette.hudButton}`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        )}

        {/* North Compass Badge */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg border shadow-sm ${palette.hudButton}`}>
          <Compass className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
        </div>
      </div>

      {/* Bottom Left: Calibrated Metric Scale Ruler */}
      <div className={`absolute bottom-4 left-4 flex flex-col gap-1 p-2.5 border rounded-xl backdrop-blur-md pointer-events-none shadow-md ${palette.rulerCard}`}>
        <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
          <span>0m</span>
          <span className="font-bold">
            {rulerMetric.meters >= 1000 ? `${rulerMetric.meters / 1000} km` : `${rulerMetric.meters} m`}
          </span>
        </div>
        {/* Visual Scale Bar */}
        <div 
          className="h-1.5 rounded-sm"
          style={{ 
            width: `${Math.max(40, rulerMetric.pixelWidth)}px`,
            backgroundColor: palette.rulerBar 
          }}
        />
        <div className="text-[9px] font-mono opacity-60 text-right">
          {rulerMetric.feet.toLocaleString()} ft
        </div>
      </div>

      {/* Interactive Guidance Tip Banner */}
      {!isRevealing && (
        <div className={`absolute bottom-4 right-4 hidden md:flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[11px] font-mono pointer-events-none backdrop-blur-sm shadow-sm ${palette.hudCard}`}>
          <Move className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Drag guess track • Shift+Wheel to resize • Space+Drag to pan</span>
        </div>
      )}
    </div>
  );
};
