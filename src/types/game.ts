export type TrackSeries = 'f1' | 'nascar' | 'indycar';

export type TrackType = 
  | 'street' 
  | 'road' 
  | 'superspeedway' 
  | 'short_oval' 
  | 'intermediate_oval'
  | 'tri_oval';

export interface TrackPoint {
  x: number;
  y: number;
}

export interface Track {
  id: string;
  name: string;
  shortName: string;
  series: TrackSeries;
  trackType: TrackType;
  country: string;
  countryCode: string;
  city: string;
  turns: number;
  
  // Real world ground-truth metric scale attributes
  officialLapLengthMeters: number;
  officialLapLengthMiles: number;
  boundingWidthMeters: number;
  boundingHeightMeters: number;
  areaHectares: number;
  areaAcres: number;

  // Render properties (normalized in meters centered at (0, 0))
  svgPath: string;
  viewBox: string;
  centerlinePoints?: TrackPoint[];

  // Historical & contextual facts
  yearOpened: number;
  trivia: string[];
}

export interface TransformState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface RoundResult {
  roundNumber: number;
  referenceTrack: Track;
  targetTrack: Track;
  initialScale: number;
  guessedScale: number;
  actualScale: number; // Always 1.0 in normalized metric coordinate space
  ratio: number;       // guessedScale / actualScale
  accuracy: number;    // min(ratio, 1 / ratio)
  score: number;       // round(100 * (accuracy ^ 1.75))
  scaleDeltaPercent: number; // (guessedScale - 1.0) * 100
  trivia: string;
}

export type GameMode = 
  | 'daily' 
  | 'f1' 
  | 'nascar' 
  | 'indycar' 
  | 'open';

export interface DailyChallengeState {
  dateString: string; // YYYY-MM-DD
  completed: boolean;
  score: number;
  roundResults: RoundResult[];
}

export interface UserStats {
  gamesPlayed: number;
  dailyStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  highScore: number;
  averageScore: number;
  history: {
    date: string;
    mode: GameMode;
    score: number;
    results: { score: number; ratio: number }[];
  }[];
}
