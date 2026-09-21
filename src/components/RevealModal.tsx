import React, { useEffect } from 'react';
import type { RoundResult } from '../types/game';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  Ruler, 
  Flag, 
  Info
} from 'lucide-react';

interface RevealModalProps {
  result: RoundResult;
  currentRound: number;
  totalRounds: number;
  onNextRound: () => void;
}

export const RevealModal: React.FC<RevealModalProps> = ({
  result,
  currentRound,
  totalRounds,
  onNextRound,
}) => {
  const { referenceTrack, targetTrack, guessedScale, accuracy, score, scaleDeltaPercent, trivia } = result;

  // Trigger celebratory confetti for great/flawless scores (>= 90 pts)
  useEffect(() => {
    if (score >= 90) {
      confetti({
        particleCount: score >= 95 ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#FFDE00', '#00E676', '#FF3366', '#FFFFFF'],
      });
    }
  }, [score]);

  // Scoring qualitative grade
  const grade = (() => {
    if (score >= 95) return { text: 'FLAWLESS CALIBRATION', color: 'text-telemetry-green', border: 'border-emerald-500/50', bg: 'bg-emerald-950/80', badge: 'bg-emerald-500 text-carbon-950' };
    if (score >= 80) return { text: 'EXCELLENT ESTIMATE', color: 'text-telemetry-cyan', border: 'border-cyan-500/50', bg: 'bg-cyan-950/80', badge: 'bg-cyan-400 text-carbon-950' };
    if (score >= 50) return { text: 'SOLID ESTIMATE', color: 'text-telemetry-yellow', border: 'border-amber-500/50', bg: 'bg-amber-950/80', badge: 'bg-amber-400 text-carbon-950' };
    return { text: 'TELEMETRY DISCREPANCY', color: 'text-telemetry-red', border: 'border-red-500/50', bg: 'bg-red-950/80', badge: 'bg-red-500 text-white' };
  })();

  const isLastRound = currentRound >= totalRounds;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 max-h-[88vh] overflow-y-auto pointer-events-auto animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-carbon-900/98 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden p-4 sm:p-6 flex flex-col gap-4">
        
        {/* Header Strip: Round counter and Score */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-carbon-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300">
              ROUND {currentRound} OF {totalRounds}
            </span>
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${grade.border} ${grade.bg} ${grade.color}`}>
              {grade.text}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">ROUND SCORE:</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-mono font-extrabold ${grade.color}`}>
                +{score}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* Mathematical Delta Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 font-mono">
          {/* Guessed Scale */}
          <div className="p-3 bg-carbon-950/90 rounded-xl border border-slate-800/80 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Your Guess</span>
            <span className="text-base sm:text-lg font-bold text-amber-400 mt-1">
              {guessedScale.toFixed(3)}x
            </span>
            <span className="text-[10px] text-slate-500">Relative size</span>
          </div>

          {/* Actual Scale */}
          <div className="p-3 bg-carbon-950/90 rounded-xl border border-slate-800/80 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Actual Reality</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
              1.000x
            </span>
            <span className="text-[10px] text-slate-500">Ground truth</span>
          </div>

          {/* Scale Error Delta */}
          <div className="p-3 bg-carbon-950/90 rounded-xl border border-slate-800/80 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Scale Delta</span>
            <span className={`text-base sm:text-lg font-bold mt-1 ${Math.abs(scaleDeltaPercent) <= 5 ? 'text-emerald-400' : Math.abs(scaleDeltaPercent) <= 15 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {scaleDeltaPercent > 0 ? `+${scaleDeltaPercent.toFixed(1)}%` : `${scaleDeltaPercent.toFixed(1)}%`}
            </span>
            <span className="text-[10px] text-slate-500">
              {scaleDeltaPercent > 0 ? 'Overestimated' : 'Underestimated'}
            </span>
          </div>

          {/* Mathematical Accuracy */}
          <div className="p-3 bg-carbon-950/90 rounded-xl border border-slate-800/80 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Accuracy Metric</span>
            <span className={`text-base sm:text-lg font-bold mt-1 ${accuracy >= 0.95 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {(accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500">min(R, 1/R)</span>
          </div>
        </div>

        {/* Side-by-Side Physical Ground Truth Comparison Table */}
        <div className="bg-carbon-950/90 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-3.5 py-2 bg-carbon-800/50 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-semibold flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              PHYSICAL GROUND TRUTH TELEMETRY
            </span>
            <span className="text-[11px] text-slate-400">Metric Survey</span>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Target Track Column */}
            <div className="flex flex-col gap-2 p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-lg">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Flag className="w-3.5 h-3.5" />
                  <span>{targetTrack.name}</span>
                </div>
                <span className="text-[10px] uppercase px-1.5 py-0.2 bg-amber-400/10 text-amber-300 rounded">
                  {targetTrack.series}
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lap Length:</span>
                  <span className="text-slate-200">
                    {(targetTrack.officialLapLengthMeters / 1000).toFixed(3)} km ({targetTrack.officialLapLengthMiles.toFixed(3)} mi)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Footprint (W × H):</span>
                  <span className="text-slate-200">
                    {targetTrack.boundingWidthMeters}m × {targetTrack.boundingHeightMeters}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enclosed Area:</span>
                  <span className="text-slate-200">
                    {targetTrack.areaAcres} acres ({targetTrack.areaHectares} ha)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corners / Turns:</span>
                  <span className="text-slate-200">{targetTrack.turns} Turns</span>
                </div>
              </div>
            </div>

            {/* Reference Track Column */}
            <div className="flex flex-col gap-2 p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <Flag className="w-3.5 h-3.5" />
                  <span>{referenceTrack.name}</span>
                </div>
                <span className="text-[10px] uppercase px-1.5 py-0.2 bg-cyan-400/10 text-cyan-300 rounded">
                  {referenceTrack.series}
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lap Length:</span>
                  <span className="text-slate-200">
                    {(referenceTrack.officialLapLengthMeters / 1000).toFixed(3)} km ({referenceTrack.officialLapLengthMiles.toFixed(3)} mi)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Footprint (W × H):</span>
                  <span className="text-slate-200">
                    {referenceTrack.boundingWidthMeters}m × {referenceTrack.boundingHeightMeters}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enclosed Area:</span>
                  <span className="text-slate-200">
                    {referenceTrack.areaAcres} acres ({referenceTrack.areaHectares} ha)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corners / Turns:</span>
                  <span className="text-slate-200">{referenceTrack.turns} Turns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Scale Fact Box */}
        <div className="flex items-start gap-2.5 p-3.5 bg-gradient-to-r from-cyan-950/40 via-carbon-950 to-carbon-950 rounded-xl border border-cyan-500/30 text-xs">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-mono font-semibold text-cyan-300 uppercase tracking-wider text-[11px]">
              Scale Insight & Circuit Trivia
            </span>
            <p className="text-slate-300 leading-relaxed">
              {trivia}
            </p>
          </div>
        </div>

        {/* Action Button: Next Round / View Summary */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onNextRound}
            autoFocus
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-carbon-950 font-mono font-bold text-sm rounded-xl shadow-amber-glow transition-all active:scale-[0.98]"
          >
            <span>{isLastRound ? 'VIEW SESSION SUMMARY 📊' : 'CONTINUE TO NEXT ROUND'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
