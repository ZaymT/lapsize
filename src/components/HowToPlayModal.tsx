import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-carbon-950/85 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-carbon-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-mono font-bold text-base text-slate-100 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>HOW TO PLAY LAPSIZE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-carbon-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Concept */}
        <div className="text-xs text-slate-300 leading-relaxed font-mono bg-carbon-950/70 p-3.5 rounded-xl border border-slate-800">
          <p>
            <strong className="text-cyan-400">LapSize</strong> is a relative spatial size challenge for motorsport enthusiasts.
            Every track uses real-world surveyed geographic coordinates scaled to physical metric ground truth.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3.5 text-xs font-mono">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-400 flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <div className="font-bold text-slate-100 mb-0.5">THE CYAN ANCHOR TRACK</div>
              <p className="text-slate-400 leading-relaxed">
                The cyan track is locked at calibrated 1.000x real-world metric scale. It is your fixed ground-truth reference.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-400/50 text-amber-400 flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <div className="font-bold text-slate-100 mb-0.5">THE AMBER GUESS TRACK</div>
              <p className="text-slate-400 leading-relaxed">
                The neon amber track starts at an incorrect, randomized scale. Drag it over the canvas and resize it until you believe its physical proportions match the anchor track.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 text-slate-300 flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <div className="font-bold text-slate-100 mb-0.5">ALIGNMENT & NUDGING</div>
              <p className="text-slate-400 leading-relaxed">
                Use <strong className="text-amber-300">Rotate 90°</strong> to line up straightaways, <strong className="text-slate-200">±0.5% Nudge</strong> for micro-adjustments, and the <strong className="text-cyan-300">Ghost slider</strong> to see overlap clearly.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400/50 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              4
            </div>
            <div>
              <div className="font-bold text-slate-100 mb-0.5">LOCK IN & SCORING</div>
              <p className="text-slate-400 leading-relaxed">
                Commit your guess. Smooth spring physics will interpolate the track to exact ground truth. Accuracy is calculated via <code className="text-emerald-300 bg-carbon-950 px-1 py-0.5 rounded">Score = 100 × (min(R, 1/R))^1.75</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Scoring Key */}
        <div className="p-3 bg-carbon-950 rounded-xl border border-slate-800/80 text-[11px] font-mono flex flex-col gap-1.5">
          <span className="font-bold text-slate-300 uppercase tracking-wider">Scoring Tiers (Per Round)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mt-1">
            <div className="p-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded text-emerald-400">
              <span className="font-bold block">95 - 100</span>
              <span className="text-[9px] text-slate-400">±3% error</span>
            </div>
            <div className="p-1.5 bg-cyan-950/60 border border-cyan-500/30 rounded text-cyan-400">
              <span className="font-bold block">80 - 94</span>
              <span className="text-[9px] text-slate-400">±10% error</span>
            </div>
            <div className="p-1.5 bg-amber-950/60 border border-amber-500/30 rounded text-amber-400">
              <span className="font-bold block">50 - 79</span>
              <span className="text-[9px] text-slate-400">±25% error</span>
            </div>
            <div className="p-1.5 bg-red-950/60 border border-red-500/30 rounded text-red-400">
              <span className="font-bold block">&lt; 50</span>
              <span className="text-[9px] text-slate-400">Large drift</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-carbon-950 font-mono font-bold text-sm rounded-xl shadow-amber-glow transition-all"
        >
          GOT IT, LET'S RACE! 🏁
        </button>

      </div>
    </div>
  );
};
