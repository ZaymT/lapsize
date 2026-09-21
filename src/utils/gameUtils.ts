import type { Track, GameMode, RoundResult, UserStats, DailyChallengeState } from '../types/game';
import { TRACKS, getTracksBySeries } from '../data/tracks';

// --------------------------------------------------------------------------------
// Deterministic Seeded PRNG (Mulberry32)
// --------------------------------------------------------------------------------
export function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert UTC date to 32-bit integer seed
export function getDailySeed(date: Date = new Date()): { seed: number; dateString: string } {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const dateString = `${y}-${m}-${d}`;
  
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash * 31 + dateString.charCodeAt(i)) >>> 0;
  }
  return { seed: hash, dateString };
}

// --------------------------------------------------------------------------------
// Strict Mathematical Scoring Algorithm (spec.md)
// --------------------------------------------------------------------------------
export function calculateRoundScore(guessedScale: number, actualScale: number = 1.0): {
  ratio: number;
  accuracy: number;
  score: number;
  scaleDeltaPercent: number;
} {
  // 1. Let R = Guessed Scale / Actual Scale
  const ratio = guessedScale / actualScale;
  
  // 2. Accuracy = min(R, 1/R)
  const accuracy = Math.min(ratio, 1 / ratio);
  
  // 3. Score = round(100 * (Accuracy)^1.75)
  const score = Math.max(0, Math.min(100, Math.round(100 * Math.pow(accuracy, 1.75))));
  
  // Scale delta percentage
  const scaleDeltaPercent = (guessedScale - actualScale) * 100;
  
  return {
    ratio,
    accuracy,
    score,
    scaleDeltaPercent,
  };
}

// --------------------------------------------------------------------------------
// Matchup Generator for 5-Round Session
// --------------------------------------------------------------------------------
export interface RoundSetup {
  referenceTrack: Track;
  targetTrack: Track;
  initialScale: number;
}

export function generateSessionMatchups(
  mode: GameMode,
  seedRandom?: () => number
): RoundSetup[] {
  const rng = seedRandom || Math.random;
  const roundsCount = 5;
  const setups: RoundSetup[] = [];

  let pool: Track[] = TRACKS;
  if (mode === 'f1') pool = getTracksBySeries('f1');
  else if (mode === 'nascar') pool = getTracksBySeries('nascar');
  else if (mode === 'indycar') pool = getTracksBySeries('indycar');

  // Used track IDs to avoid immediate duplicate comparisons
  const usedRefIds = new Set<string>();
  const usedTargetIds = new Set<string>();

  for (let r = 0; r < roundsCount; r++) {
    // Select Reference Track
    let availableRefs = pool.filter(t => !usedRefIds.has(t.id));
    if (availableRefs.length === 0) availableRefs = pool;
    const ref = availableRefs[Math.floor(rng() * availableRefs.length)];
    usedRefIds.add(ref.id);

    // Select Target Track
    let availableTargets = pool.filter(t => t.id !== ref.id && !usedTargetIds.has(t.id));
    if (availableTargets.length === 0) availableTargets = pool.filter(t => t.id !== ref.id);
    
    // For Open Class or Daily, deliberately mix disciplines for exciting contrasts
    if ((mode === 'open' || mode === 'daily') && rng() > 0.35) {
      const crossSeries = availableTargets.filter(t => t.series !== ref.series);
      if (crossSeries.length > 0) {
        availableTargets = crossSeries;
      }
    }

    const target = availableTargets[Math.floor(rng() * availableTargets.length)];
    usedTargetIds.add(target.id);

    // Randomize initial scale between 0.30x and 2.50x, avoiding dangerously close to 1.0 (0.90 - 1.10)
    let initScale = 0.35 + rng() * 1.95;
    if (initScale >= 0.88 && initScale <= 1.12) {
      initScale = rng() > 0.5 ? 0.65 + rng() * 0.15 : 1.35 + rng() * 0.35;
    }
    initScale = Number(initScale.toFixed(3));

    setups.push({
      referenceTrack: ref,
      targetTrack: target,
      initialScale: initScale,
    });
  }

  return setups;
}

// --------------------------------------------------------------------------------
// LocalStorage Persistence
// --------------------------------------------------------------------------------
const STATS_STORAGE_KEY = 'lapsize_user_stats_v1';
const DAILY_STORAGE_PREFIX = 'lapsize_daily_v1_';

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load stats from localStorage', e);
  }
  return {
    gamesPlayed: 0,
    dailyStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    highScore: 0,
    averageScore: 0,
    history: [],
  };
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats to localStorage', e);
  }
}

export function loadDailyChallenge(dateString: string): DailyChallengeState | null {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_PREFIX + dateString);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load daily challenge from localStorage', e);
  }
  return null;
}

export function saveDailyChallenge(state: DailyChallengeState): void {
  try {
    localStorage.setItem(DAILY_STORAGE_PREFIX + state.dateString, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save daily challenge to localStorage', e);
  }
}

export function updateUserStatsOnComplete(
  currentStats: UserStats,
  mode: GameMode,
  totalScore: number,
  results: RoundResult[],
  todayDateString: string
): UserStats {
  const newGamesPlayed = currentStats.gamesPlayed + 1;
  const newHighScore = Math.max(currentStats.highScore, totalScore);
  const totalPrevScore = currentStats.averageScore * currentStats.gamesPlayed;
  const newAvgScore = Math.round((totalPrevScore + totalScore) / newGamesPlayed);

  // Daily streak calculation
  let newDailyStreak = currentStats.dailyStreak;
  let newMaxStreak = currentStats.maxStreak;

  if (mode === 'daily') {
    if (!currentStats.lastPlayedDate) {
      newDailyStreak = 1;
    } else {
      const lastDate = new Date(currentStats.lastPlayedDate);
      const today = new Date(todayDateString);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newDailyStreak += 1;
      } else if (diffDays > 1) {
        newDailyStreak = 1; // broken streak
      }
    }
    newMaxStreak = Math.max(newMaxStreak, newDailyStreak);
  }

  const updated: UserStats = {
    gamesPlayed: newGamesPlayed,
    dailyStreak: newDailyStreak,
    maxStreak: newMaxStreak,
    lastPlayedDate: mode === 'daily' ? todayDateString : currentStats.lastPlayedDate,
    highScore: newHighScore,
    averageScore: newAvgScore,
    history: [
      ...currentStats.history.slice(-20),
      {
        date: todayDateString,
        mode,
        score: totalScore,
        results: results.map(r => ({ score: r.score, ratio: r.ratio })),
      },
    ],
  };

  saveUserStats(updated);
  return updated;
}
