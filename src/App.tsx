import { useState, useMemo, useCallback } from 'react';
import type { Track, GameMode, RoundResult, UserStats, DailyChallengeState } from './types/game';
import { TrackCanvas } from './components/TrackCanvas';
import { Controls } from './components/Controls';
import { RevealModal } from './components/RevealModal';
import { ScoreCard } from './components/ScoreCard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { CircuitGarage } from './components/CircuitGarage';
import { useCanvasTransform } from './hooks/useCanvasTransform';
import { 
  createMulberry32, 
  getDailySeed, 
  calculateRoundScore, 
  generateSessionMatchups,
  type RoundSetup,
  loadUserStats,
  loadDailyChallenge,
  saveDailyChallenge,
  updateUserStatsOnComplete
} from './utils/gameUtils';
import { 
  Flame, 
  HelpCircle, 
  Compass, 
  Radio
} from 'lucide-react';

// Subcomponent managing an individual round's interactive canvas and controls
interface GameRoundStageProps {
  referenceTrack: Track;
  targetTrack: Track;
  initialScale: number;
  currentRoundIndex: number;
  onLockInCommit: (result: RoundResult) => void;
}

function GameRoundStage({
  referenceTrack,
  targetTrack,
  initialScale,
  currentRoundIndex,
  onLockInCommit,
}: GameRoundStageProps) {
  const {
    targetTransform,
    ghostTransform,
    stageTransform,
    isRevealing,
    setScale,
    nudgeScale,
    rotate90,
    setOpacity,
    centerTargetTrack,
    triggerReveal,
    handlers,
  } = useCanvasTransform({
    referenceTrack,
    targetTrack,
    initialScale,
  });

  const handleLockIn = useCallback(() => {
    if (isRevealing) return;
    const scoreData = calculateRoundScore(targetTransform.scale, 1.0);
    const triviaFact = targetTrack.trivia[currentRoundIndex % targetTrack.trivia.length];
    
    const result: RoundResult = {
      roundNumber: currentRoundIndex + 1,
      referenceTrack,
      targetTrack,
      initialScale,
      guessedScale: targetTransform.scale,
      actualScale: 1.0,
      ratio: scoreData.ratio,
      accuracy: scoreData.accuracy,
      score: scoreData.score,
      scaleDeltaPercent: scoreData.scaleDeltaPercent,
      trivia: triviaFact,
    };

    triggerReveal(() => {
      onLockInCommit(result);
    });
  }, [isRevealing, targetTransform.scale, targetTrack, currentRoundIndex, referenceTrack, initialScale, triggerReveal, onLockInCommit]);

  return (
    <>
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <TrackCanvas
          referenceTrack={referenceTrack}
          targetTrack={targetTrack}
          targetTransform={targetTransform}
          ghostTransform={ghostTransform}
          stageTransform={stageTransform}
          isRevealing={isRevealing}
          handlers={handlers}
          onCenterTarget={centerTargetTrack}
        />
      </main>

      <Controls
        targetTransform={targetTransform}
        targetTrack={targetTrack}
        referenceTrack={referenceTrack}
        isRevealing={isRevealing}
        onScaleChange={setScale}
        onNudgeScale={nudgeScale}
        onRotate90={rotate90}
        onOpacityChange={setOpacity}
        onCenterTarget={centerTargetTrack}
        onLockIn={handleLockIn}
      />
    </>
  );
}

export function App() {
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const todaySeedInfo = useMemo(() => getDailySeed(), []);

  // User statistics loaded from localStorage
  const [userStats, setUserStats] = useState<UserStats>(() => loadUserStats());
  const [isDailyCompleted, setIsDailyCompleted] = useState<boolean>(() => 
    !!loadDailyChallenge(todaySeedInfo.dateString)?.completed
  );

  // Derive initial setups and results
  const [roundSetups, setRoundSetups] = useState<RoundSetup[]>(() => {
    const existingDaily = loadDailyChallenge(todaySeedInfo.dateString);
    if (existingDaily && existingDaily.completed) {
      const prng = createMulberry32(todaySeedInfo.seed);
      return generateSessionMatchups('daily', prng);
    }
    const prng = createMulberry32(todaySeedInfo.seed);
    return generateSessionMatchups('daily', prng);
  });

  const [currentRoundIndex, setCurrentRoundIndex] = useState(() => {
    const existingDaily = loadDailyChallenge(todaySeedInfo.dateString);
    return existingDaily && existingDaily.completed ? 4 : 0;
  });

  const [results, setResults] = useState<RoundResult[]>(() => {
    const existingDaily = loadDailyChallenge(todaySeedInfo.dateString);
    return existingDaily && existingDaily.completed ? existingDaily.roundResults : [];
  });

  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState<boolean>(() => {
    const existingDaily = loadDailyChallenge(todaySeedInfo.dateString);
    return !!existingDaily?.completed;
  });

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGarage, setShowGarage] = useState(false);

  // Start / restart game session
  const initGameSession = useCallback((mode: GameMode) => {
    let setups: RoundSetup[] = [];
    if (mode === 'daily') {
      const prng = createMulberry32(todaySeedInfo.seed);
      setups = generateSessionMatchups('daily', prng);
      
      const existingDaily = loadDailyChallenge(todaySeedInfo.dateString);
      if (existingDaily && existingDaily.completed) {
        setIsDailyCompleted(true);
        setResults(existingDaily.roundResults);
        setRoundSetups(setups);
        setCurrentRoundIndex(4);
        setShowScoreCard(true);
        setShowRevealModal(false);
        return;
      }
    } else {
      setups = generateSessionMatchups(mode);
    }

    setRoundSetups(setups);
    setCurrentRoundIndex(0);
    setResults([]);
    setShowRevealModal(false);
    setShowScoreCard(false);
  }, [todaySeedInfo]);

  // Mode change handler
  const handleModeSwitch = (newMode: GameMode) => {
    if (newMode === gameMode) return;
    setGameMode(newMode);
    initGameSession(newMode);
  };

  // Lock In completed by child round stage
  const handleLockInCommit = useCallback((result: RoundResult) => {
    setResults(prev => [...prev, result]);
    setShowRevealModal(true);
  }, []);

  // Advance to next round or end of session
  const handleNextRound = useCallback(() => {
    setShowRevealModal(false);

    if (currentRoundIndex < roundSetups.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      const totalScore = results.reduce((acc, r) => acc + r.score, 0);

      if (gameMode === 'daily') {
        const dailyState: DailyChallengeState = {
          dateString: todaySeedInfo.dateString,
          completed: true,
          score: totalScore,
          roundResults: results,
        };
        saveDailyChallenge(dailyState);
        setIsDailyCompleted(true);
      }

      const updatedStats = updateUserStatsOnComplete(
        userStats,
        gameMode,
        totalScore,
        results,
        todaySeedInfo.dateString
      );
      setUserStats(updatedStats);
      setShowScoreCard(true);
    }
  }, [currentRoundIndex, roundSetups.length, results, gameMode, todaySeedInfo.dateString, userStats]);

  const currentSetup = roundSetups[currentRoundIndex] || null;
  const activeResult = results[results.length - 1];

  return (
    <div className="relative w-screen h-screen flex flex-col bg-carbon-950 text-slate-100 overflow-hidden select-none font-sans">
      
      {/* ========================================================================= */}
      {/* 1. MOTORSPORT TELEMETRY TOP HEADER                                        */}
      {/* ========================================================================= */}
      <header className="h-14 shrink-0 px-4 bg-carbon-900/90 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between z-30">
        {/* Brand & Live Telemetry Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-carbon-950 border border-cyan-500/50 flex items-center justify-center shadow-cyan-glow">
              <span className="text-cyan-400 font-mono font-black text-sm">LS</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold text-base tracking-wider text-slate-100">
                  LAPSIZE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/40 rounded font-bold">
                  v2.0
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span>CALIBRATED METRIC GROUND TRUTH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Selector Tabs */}
        <div className="hidden md:flex items-center p-1 bg-carbon-950 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => handleModeSwitch('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              gameMode === 'daily'
                ? 'bg-amber-400 text-carbon-950 shadow-amber-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>DAILY</span>
            {isDailyCompleted ? (
              <span className="text-[11px] text-emerald-950 font-bold bg-emerald-400/80 px-1 rounded">✓</span>
            ) : userStats.dailyStreak > 0 ? (
              <span className="flex items-center text-[10px] gap-0.5 bg-carbon-950/40 px-1 py-0.2 rounded text-slate-900">
                <Flame className="w-2.5 h-2.5 fill-current" />
                {userStats.dailyStreak}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => handleModeSwitch('f1')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              gameMode === 'f1'
                ? 'bg-cyan-400 text-carbon-950 shadow-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FORMULA 1
          </button>

          <button
            onClick={() => handleModeSwitch('nascar')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              gameMode === 'nascar'
                ? 'bg-cyan-400 text-carbon-950 shadow-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            NASCAR
          </button>

          <button
            onClick={() => handleModeSwitch('indycar')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              gameMode === 'indycar'
                ? 'bg-cyan-400 text-carbon-950 shadow-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            INDYCAR
          </button>

          <button
            onClick={() => handleModeSwitch('open')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              gameMode === 'open'
                ? 'bg-cyan-400 text-carbon-950 shadow-cyan-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OPEN CLASS
          </button>
        </div>

        {/* Action Utility Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Mobile Series Dropdown */}
          <div className="md:hidden">
            <select
              value={gameMode}
              onChange={e => handleModeSwitch(e.target.value as GameMode)}
              className="bg-carbon-950 text-slate-200 border border-slate-700 text-xs px-2 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="daily">Daily Race</option>
              <option value="f1">Formula 1</option>
              <option value="nascar">NASCAR</option>
              <option value="indycar">IndyCar</option>
              <option value="open">Open Class</option>
            </select>
          </div>

          {/* Circuit Archive / Garage button */}
          <button
            onClick={() => setShowGarage(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-carbon-800 hover:bg-carbon-700 text-slate-300 rounded-lg border border-slate-700 transition-colors shadow-sm"
            title="Browse all circuits"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Circuits</span>
          </button>

          {/* How to Play Help button */}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-carbon-800 hover:bg-carbon-700 text-slate-300 rounded-lg border border-slate-700 transition-colors shadow-sm"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ROUND TELEMETRY TRACKER STRIP                                          */}
      {/* ========================================================================= */}
      <div className="h-9 shrink-0 px-4 bg-carbon-950 border-b border-slate-800/80 flex items-center justify-between z-20 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map(idx => {
            const isCompleted = idx < results.length;
            const isCurrent = idx === currentRoundIndex && !showScoreCard;
            const roundScore = results[idx]?.score;

            return (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-mono transition-all ${
                  isCompleted
                    ? 'bg-carbon-900 border-slate-700 text-slate-200'
                    : isCurrent
                    ? 'bg-amber-950/80 border-amber-400/80 text-amber-300 shadow-[0_0_8px_rgba(255,222,0,0.3)] animate-pulse'
                    : 'bg-carbon-950 border-slate-800 text-slate-600'
                }`}
              >
                <span>R{idx + 1}</span>
                {isCompleted && (
                  <span className={`font-bold ${
                    roundScore >= 95 ? 'text-emerald-400' : roundScore >= 80 ? 'text-cyan-400' : 'text-amber-400'
                  }`}>
                    {roundScore}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 hidden sm:inline">SESSION SCORE:</span>
          <span className="text-sm font-bold text-amber-400">
            {results.reduce((acc, r) => acc + r.score, 0)}
          </span>
          <span className="text-slate-600">/ 500</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 & 4. PRIMARY STAGE & CONTROLS (Fresh instance per round)                */}
      {/* ========================================================================= */}
      {currentSetup ? (
        <GameRoundStage
          key={`${gameMode}-${currentRoundIndex}`}
          referenceTrack={currentSetup.referenceTrack}
          targetTrack={currentSetup.targetTrack}
          initialScale={currentSetup.initialScale}
          currentRoundIndex={currentRoundIndex}
          onLockInCommit={handleLockInCommit}
        />
      ) : (
        <div className="w-full flex-1 flex items-center justify-center font-mono text-slate-400">
          Loading track telemetry...
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. POST-ROUND REVEAL DRAWER                                               */}
      {/* ========================================================================= */}
      {showRevealModal && activeResult && (
        <RevealModal
          result={activeResult}
          currentRound={currentRoundIndex + 1}
          totalRounds={roundSetups.length}
          onNextRound={handleNextRound}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. END-OF-SESSION SCORE CARD                                              */}
      {/* ========================================================================= */}
      {showScoreCard && (
        <ScoreCard
          results={results}
          gameMode={gameMode}
          dateString={todaySeedInfo.dateString}
          stats={userStats}
          onPlayAgain={() => initGameSession(gameMode)}
          onChangeMode={handleModeSwitch}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. HOW TO PLAY MODAL                                                      */}
      {/* ========================================================================= */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* ========================================================================= */}
      {/* 8. CIRCUIT GARAGE ARCHIVE                                                 */}
      {/* ========================================================================= */}
      <CircuitGarage
        isOpen={showGarage}
        onClose={() => setShowGarage(false)}
      />

    </div>
  );
}

export default App;
