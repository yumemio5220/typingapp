export interface TypingProblem {
  id: number;
  text: string;
  hiragana: string;
}

export interface TypingResult {
  wpm: number;
  cpm: number;
  accuracy: number;
  timeElapsed: number;
  problemText: string;
  date: string;
}

export interface ScoreRecord {
  id: string;
  results: TypingResult[];
}
