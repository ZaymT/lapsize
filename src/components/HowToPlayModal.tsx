import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex justify-center items-start py-8 sm:py-12 animate-in fade-in duration-200">
      <div className="w-full max-w-xl my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-mono font-bold text-base uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>HOW TO PLAY LAPSIZE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Concept */}
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p>
            <strong className="text-blue-600 dark:text-cyan-400">LapSize</strong> is an interactive spatial scale challenge for motorsport fans.
            Every circuit uses authentic surveyed coordinates scaled to real-world metric ground truth.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3.5 text-xs font-mono">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-cyan-950 border border-blue-400 dark:border-cyan-400 text-blue-700 dark:text-cyan-400 flex items-center justify-center font-black shrink-0">
              1
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">THE ANCHOR TRACK (BLUE / CYAN)</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The anchor track is locked at calibrated 1.000x metric scale. It represents your fixed real-world ground-truth reference.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-400 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
              2
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">THE GUESS TRACK (ORANGE / AMBER)</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The guess track starts at a randomized, incorrect scale. Drag it over the stage and resize it until you believe its physical proportions match reality.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black shrink-0">
              3
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">ALIGNMENT & NUDGING</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Use <strong className="text-amber-700 dark:text-amber-300">Rotate 90°</strong> to line up straightaways, <strong className="text-slate-800 dark:text-slate-200">±0.5% Nudge</strong> for micro-adjustments, and the <strong className="text-blue-700 dark:text-cyan-300">Ghost slider</strong> to inspect overlap.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
              4
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">LOCK IN & SCORING</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Commit your guess. Smooth spring physics will interpolate the track to exact ground truth. Accuracy is calculated via <code className="text-emerald-700 dark:text-emerald-300 bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">Score = 100 × (min(R, 1/R))^1.75</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Scoring Key */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex flex-col gap-1.5 shadow-sm">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Scoring Tiers (Per Round)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mt-1">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 rounded-lg text-emerald-700 dark:text-emerald-400">
              <span className="font-black block text-xs">95 - 100</span>
              <span className="text-[10px] text-slate-500">±3% error</span>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-cyan-950/60 border border-blue-300 dark:border-cyan-500/30 rounded-lg text-blue-700 dark:text-cyan-400">
              <span className="font-black block text-xs">80 - 94</span>
              <span className="text-[10px] text-slate-500">±10% error</span>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-400">
              <span className="font-black block text-xs">50 - 79</span>
              <span className="text-[10px] text-slate-500">±25% error</span>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-400">
              <span className="font-black block text-xs">&lt; 50</span>
              <span className="text-[10px] text-slate-500">Large drift</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-sm rounded-xl shadow-md transition-all active:scale-95"
        >
          GOT IT, LET'S RACE! 🏁
        </button>

      </div>
    </div>
  );
};
