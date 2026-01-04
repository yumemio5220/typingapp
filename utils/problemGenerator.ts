import { TypingProblem } from '@/types/typing';
import { japaneseWords } from '@/data/wordList';

// カタカナをひらがなに変換する関数
function toHiragana(text: string): string {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // カタカナ（ァ-ヶ）をひらがな（ぁ-ゖ）に変換
      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCharCode(code - 0x60);
      }
      // 長音記号「ー」を処理（直前の母音を延ばす）
      if (char === 'ー') {
        return 'ー'; // とりあえずそのまま返す（ローマ字変換で処理される）
      }
      return char;
    })
    .join('');
}

// ランダムな問題を生成する関数
export function generateRandomProblem(id: number): TypingProblem {
  const randomIndex = Math.floor(Math.random() * japaneseWords.length);
  const text = japaneseWords[randomIndex];
  const hiragana = toHiragana(text);

  return {
    id,
    text,
    hiragana,
  };
}

// 指定された数だけランダムな問題を生成する関数
export function generateRandomProblems(count: number): TypingProblem[] {
  const problems: TypingProblem[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < count; i++) {
    let randomIndex: number;

    // 重複しない単語を選択
    do {
      randomIndex = Math.floor(Math.random() * japaneseWords.length);
    } while (usedIndices.has(randomIndex) && usedIndices.size < japaneseWords.length);

    usedIndices.add(randomIndex);

    const text = japaneseWords[randomIndex];
    const hiragana = toHiragana(text);

    problems.push({
      id: i + 1,
      text,
      hiragana,
    });
  }

  return problems;
}

// 無限モード用: 次の問題を1つ生成
export function generateNextProblem(currentId: number, usedWords: Set<string>): TypingProblem {
  let text: string;
  let attempts = 0;
  const maxAttempts = 100;

  // 使用していない単語を探す（最大100回試行）
  do {
    const randomIndex = Math.floor(Math.random() * japaneseWords.length);
    text = japaneseWords[randomIndex];
    attempts++;

    // 全ての単語を使い切った場合、または試行回数が上限に達した場合はリセット
    if (attempts >= maxAttempts) {
      usedWords.clear();
      break;
    }
  } while (usedWords.has(text));

  usedWords.add(text);
  const hiragana = toHiragana(text);

  return {
    id: currentId,
    text,
    hiragana,
  };
}
