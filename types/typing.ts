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
