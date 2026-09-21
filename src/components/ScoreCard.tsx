import React, { useState } from 'react';
import type { RoundResult, GameMode, UserStats } from '../types/game';
import { 
  Trophy, 
  Share2, 
  RotateCcw, 
  Flame, 
  Check, 
  TrendingUp, 
  Award
} from 'lucide-react';

interface ScoreCardProps {
  results: RoundResult[];
  gameMode: GameMode;
  dateString: string;
  stats: UserStats;
  onPlayAgain: () => void;
  onChangeMode?: (mode: GameMode) => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  results,
  gameMode,
  dateString,
  stats,
  onPlayAgain,
  onChangeMode,
}) => {
  const [copied, setCopied] = useState(false);

  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const maxScore = results.length * 100;
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Overall qualitative classification
  const rank = (() => {
    if (totalScore >= 475) return { title: 'SUPREME GRID MASTER', subtitle: 'God-tier spatial intuition for motorsport geometry', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300', icon: '🏆' };
    if (totalScore >= 425) return { title: 'CHIEF TELEMETRY ENGINEER', subtitle: 'Precision spatial awareness matching FIA laser surveys', color: 'text-blue-600 dark:text-cyan-400', border: 'border-blue-500', badge: 'bg-blue-100 dark:bg-cyan-950 border-blue-300 dark:border-cyan-500 text-blue-800 dark:text-cyan-300', icon: '🏁' };
    if (totalScore >= 350) return { title: 'SENIOR RACE STRATEGIST', subtitle: 'Strong comparative sense across international circuits', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500', badge: 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-500 text-amber-800 dark:text-amber-300', icon: '🏎️' };
    if (totalScore >= 250) return { title: 'PROVISIONAL DRIVER', subtitle: 'Decent instincts, but trickier street tracks caused drift', color: 'text-amber-700 dark:text-amber-500', border: 'border-amber-600', badge: 'bg-amber-100 dark:bg-amber-950 border-amber-400 text-amber-900 dark:text-amber-200', icon: '🟡' };
    return { title: 'ROOKIE PIT CREW', subtitle: 'Calibration required: review track footprints and retry', color: 'text-red-600 dark:text-red-400', border: 'border-red-500', badge: 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-500 text-red-800 dark:text-red-300', icon: '🔧' };
  })();

  // Emoji generator for round results
  const getScoreEmoji = (score: number) => {
    if (score >= 95) return '🟩'; // Flawless
    if (score >= 80) return '🟦'; // Great
    if (score >= 50) return '🟨'; // Decent
    return '🟥'; // Off
  };

  // Generate share text (Wordle style)
  const generateShareText = () => {
    const emojis = results.map(r => getScoreEmoji(r.score)).join('');
    const modeLabel = gameMode === 'daily' ? `Daily #${dateString}` : `${gameMode.toUpperCase()} Class`;
    
    let text = `LapSize • ${modeLabel}\nScore: ${totalScore}/${maxScore} (${rank.icon})\n${emojis}\n\n`;
    
    results.forEach((r, idx) => {
      const emoji = getScoreEmoji(r.score);
      text += `${emoji} R${idx + 1}: ${r.targetTrack.shortName} vs ${r.referenceTrack.shortName} (+${r.score})\n`;
    });
    
    text += `\nTest your spatial motorsport scale: https://lapsize.game`;
    return text;
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
        // fallback
      }
    }
    prompt('Copy your LapSize score card:', text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex justify-center items-start py-8 sm:py-12 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-7 flex flex-col gap-6 text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header Ribbon */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
            <Award className="w-4 h-4 text-amber-500" />
            <span>SESSION COMPLETED • {gameMode.toUpperCase()} CLASS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-mono font-black text-slate-900 dark:text-slate-100 mt-1">
            {totalScore} <span className="text-slate-400 dark:text-slate-500 text-2xl font-normal">/ {maxScore}</span>
            <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 block mt-0.5 font-bold">
              {percentage}% OVERALL CALIBRATION
            </span>
          </h2>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl">{rank.icon}</span>
            <span className={`font-mono font-extrabold text-sm tracking-wide ${rank.color}`}>
              {rank.title}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            {rank.subtitle}
          </p>
        </div>

        {/* User Lifetime / Streak Statistics */}
        <div className="grid grid-cols-3 gap-3 font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>STREAK</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {stats.dailyStreak} <span className="text-xs text-slate-400 font-normal">days</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>HIGH SCORE</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {stats.highScore || totalScore}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>AVG SCORE</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {stats.averageScore ? Math.round(stats.averageScore) : totalScore}
            </span>
          </div>
        </div>

        {/* Round Breakdown List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ROUND-BY-ROUND TELEMETRY
          </span>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{getScoreEmoji(r.score)}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-amber-700 dark:text-amber-400">{r.targetTrack.shortName}</span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-blue-700 dark:text-cyan-400">{r.referenceTrack.shortName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Guess: {r.guessedScale.toFixed(3)}x • Delta: {r.scaleDeltaPercent > 0 ? `+${r.scaleDeltaPercent.toFixed(1)}%` : `${r.scaleDeltaPercent.toFixed(1)}%`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">+{r.score}</span>
                    <span className="text-[10px] text-slate-500 block">{(r.accuracy * 100).toFixed(1)}% acc</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm transition-all shadow-md active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-black'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>SHARE SCORECARD 📋</span>
              </>
            )}
          </button>

          {/* Play Again Button */}
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 dark:border-slate-600 font-mono font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>PLAY AGAIN</span>
          </button>
        </div>

        {/* Practice Other Series Quick Links */}
        {onChangeMode && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">PRACTICE OTHER DISCIPLINES:</span>
            <div className="flex items-center gap-1.5">
              {(['f1', 'nascar', 'indycar', 'open'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => onChangeMode(m)}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-bold uppercase transition-all shadow-sm active:scale-95 ${
                    gameMode === m 
                      ? 'bg-blue-100 dark:bg-cyan-950 border-blue-400 dark:border-cyan-500 text-blue-800 dark:text-cyan-300' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
