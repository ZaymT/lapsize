import React, { useEffect } from 'react';
import type { RoundResult } from '../types/game';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  MapPin, 
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
  const { score, accuracy, scaleDeltaPercent, guessedScale, trivia, referenceTrack, targetTrack } = result;

  // Trigger celebration confetti for high-scoring guesses
  useEffect(() => {
    if (score >= 80) {
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
    if (score >= 95) return { text: 'FLAWLESS CALIBRATION', color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-500/50', bg: 'bg-emerald-50 dark:bg-emerald-950/80', badge: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950' };
    if (score >= 80) return { text: 'EXCELLENT ESTIMATE', color: 'text-blue-700 dark:text-cyan-400', border: 'border-blue-300 dark:border-cyan-500/50', bg: 'bg-blue-50 dark:bg-cyan-950/80', badge: 'bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950' };
    if (score >= 50) return { text: 'SOLID ESTIMATE', color: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-500/50', bg: 'bg-amber-50 dark:bg-amber-950/80', badge: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950' };
    return { text: 'TELEMETRY DISCREPANCY', color: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-500/50', bg: 'bg-red-50 dark:bg-red-950/80', badge: 'bg-red-600 text-white' };
  })();

  const isLastRound = currentRound >= totalRounds;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 max-h-[88vh] overflow-y-auto pointer-events-auto animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-white/98 dark:bg-slate-900/98 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden p-4 sm:p-6 flex flex-col gap-4 transition-colors">
        
        {/* Header Strip: Round counter and Score */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              ROUND {currentRound} OF {totalRounds}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-black tracking-wider uppercase border shadow-sm ${grade.border} ${grade.bg} ${grade.color}`}>
              {grade.text}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">ROUND SCORE:</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-mono font-black ${grade.color}`}>
                +{score}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* Mathematical Delta Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">GUESSED SCALE</span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
              {guessedScale.toFixed(3)}x
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Your committed size</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">ACTUAL RELATIVE</span>
            <span className="text-lg font-black text-blue-700 dark:text-cyan-400 mt-0.5">
              1.000x
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">True metric ground truth</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">SCALE DELTA</span>
            <span className={`text-lg font-black mt-0.5 ${Math.abs(scaleDeltaPercent) <= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {scaleDeltaPercent > 0 ? `+${scaleDeltaPercent.toFixed(1)}%` : `${scaleDeltaPercent.toFixed(1)}%`}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {scaleDeltaPercent > 0 ? 'Overestimated' : 'Underestimated'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">ACCURACY INDEX</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {(accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Min(R, 1/R) formula</span>
          </div>
        </div>

        {/* Side-by-Side Metric Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          {/* Reference Track Footprint */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-cyan-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{referenceTrack.name}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-cyan-950 text-blue-800 dark:text-cyan-300 font-bold uppercase">
                ANCHOR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">BOUNDING FOOTPRINT</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {referenceTrack.boundingWidthMeters}m × {referenceTrack.boundingHeightMeters}m
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({Math.round(referenceTrack.boundingWidthMeters * 3.28084)}ft × {Math.round(referenceTrack.boundingHeightMeters * 3.28084)}ft)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">LAP LENGTH & ENCLOSED LAND</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(referenceTrack.officialLapLengthMeters / 1000).toFixed(3)} km ({referenceTrack.officialLapLengthMiles.toFixed(2)} mi)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {referenceTrack.areaAcres ? `${referenceTrack.areaAcres} acres (${referenceTrack.areaHectares} ha)` : `${referenceTrack.turns} turns`}
                </span>
              </div>
            </div>
          </div>

          {/* Target Track Footprint */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{targetTrack.name}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold uppercase">
                GUESS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">BOUNDING FOOTPRINT</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {targetTrack.boundingWidthMeters}m × {targetTrack.boundingHeightMeters}m
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({Math.round(targetTrack.boundingWidthMeters * 3.28084)}ft × {Math.round(targetTrack.boundingHeightMeters * 3.28084)}ft)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">LAP LENGTH & ENCLOSED LAND</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(targetTrack.officialLapLengthMeters / 1000).toFixed(3)} km ({targetTrack.officialLapLengthMiles.toFixed(2)} mi)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {targetTrack.areaAcres ? `${targetTrack.areaAcres} acres (${targetTrack.areaHectares} ha)` : `${targetTrack.turns} turns`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Scale Trivia Box */}
        {trivia && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-mono shadow-sm">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5">
                TELEMETRY INSIGHT:
              </span>
              {trivia}
            </div>
          </div>
        )}

        {/* Action Button: Next Round / View Final Results */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onNextRound}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono font-black text-sm tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95"
          >
            <span>{isLastRound ? 'FINISH SESSION & VIEW SCORECARD' : 'NEXT TELEMETRY ROUND'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
