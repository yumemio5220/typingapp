export interface TypingProblem {
  id: number;
  text: string;
  hiragana: string;
}

export interface TypingResult {
  score: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  timeElapsed: number;
  problemText: string;
  date: string;
  completedCount?: number;
  mistypes?: number;
}

export interface ScoreRecord {
  id: string;
  results: TypingResult[];
}

export interface RankingEntry {
  id: string;
  username: string;
  score: number;
  completed_count: number;
  mistypes: number;
  created_at: string;
}
