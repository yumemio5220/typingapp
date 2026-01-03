'use client';

import { useState, useEffect, useRef } from 'react';
import { typingProblems } from '@/data/problems';
import { hiraganaToRomaji, getAcceptableRomaji } from '@/utils/romajiConverter';
import { TypingResult } from '@/types/typing';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type GameState = 'ready' | 'playing' | 'finished';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [results, setResults] = useLocalStorage<TypingResult[]>('typing-results', []);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentProblem = typingProblems[currentProblemIndex];

  const getTargetRomaji = () => {
    if (!currentProblem) return '';
    const allRomaji = hiraganaToRomaji(currentProblem.hiragana);
    const matching = allRomaji.filter(r => r.startsWith(userInput));
    return matching.length > 0 ? matching[0] : allRomaji[0];
  };

  const targetRomaji = getTargetRomaji();

  const finishGameRef = useRef<() => void>();

  useEffect(() => {
    finishGameRef.current = finishGame;
  });

  useEffect(() => {
    if (gameState === 'playing' && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishGameRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (gameState !== 'playing' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setCurrentProblemIndex(0);
    setUserInput('');
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(Date.now());
    setEndTime(null);
    setTimeLeft(60);
    inputRef.current?.focus();
  };

  const finishGame = () => {
    setGameState('finished');
    const now = Date.now();
    setEndTime(now);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startTime) {
      const timeElapsed = (now - startTime) / 1000;
      const minutes = timeElapsed / 60;
      const wpm = Math.round((correctChars / 5) / minutes);
      const cpm = Math.round(correctChars / minutes);
      const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

      const result: TypingResult = {
        wpm,
        cpm,
        accuracy,
        timeElapsed,
        problemText: typingProblems.slice(0, currentProblemIndex + 1).map(p => p.text).join(', '),
        date: new Date().toISOString(),
      };

      setResults([result, ...results].slice(0, 10));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;

    const input = e.target.value.toLowerCase();
    const prevInputLength = userInput.length;

    if (input.length > prevInputLength) {
      setTotalChars((prev) => prev + 1);
    }

    const allPossibleRomaji = hiraganaToRomaji(currentProblem.hiragana);
    const acceptable = allPossibleRomaji.filter(romaji => romaji.startsWith(input));

    if (acceptable.length === 0 && input.length > 0) {
      return;
    }

    setUserInput(input);

    if (acceptable.some(romaji => romaji === input)) {
      setCorrectChars((prev) => prev + input.length);

      if (currentProblemIndex < typingProblems.length - 1) {
        setCurrentProblemIndex((prev) => prev + 1);
        setUserInput('');
      } else {
        finishGame();
      }
    } else if (input.length > prevInputLength && acceptable.length > 0) {
      setCorrectChars((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setGameState('ready');
    setCurrentProblemIndex(0);
    setUserInput('');
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(null);
    setEndTime(null);
    setTimeLeft(60);
  };

  const selectProblem = (index: number) => {
    if (gameState === 'ready') {
      setCurrentProblemIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
            タイピング練習
          </h1>

          {gameState === 'ready' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-4">
                  問題を選択してスタートボタンを押してください
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-lg"
                >
                  スタート
                </button>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">問題一覧</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {typingProblems.map((problem, index) => (
                    <button
                      key={problem.id}
                      onClick={() => selectProblem(index)}
                      className={`p-3 text-left rounded-lg border-2 transition-colors ${
                        currentProblemIndex === index
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium">{problem.text}</div>
                      <div className="text-sm text-gray-500">{problem.hiragana}</div>
                    </button>
                  ))}
                </div>
              </div>

              {results.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">過去の成績</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">日時</th>
                          <th className="px-4 py-2 text-right">WPM</th>
                          <th className="px-4 py-2 text-right">CPM</th>
                          <th className="px-4 py-2 text-right">正確率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">
                              {new Date(result.date).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-4 py-2 text-right font-bold">{result.wpm}</td>
                            <td className="px-4 py-2 text-right">{result.cpm}</td>
                            <td className="px-4 py-2 text-right">{result.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-700">
                  問題 {currentProblemIndex + 1} / {typingProblems.length}
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  残り {timeLeft}秒
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-center mb-4">
                  {currentProblem.text}
                </div>
                <div className="text-xl text-gray-600 text-center mb-2">
                  {currentProblem.hiragana}
                </div>
                <div className="text-lg text-center mb-6 font-mono">
                  {targetRomaji.split('').map((char, index) => (
                    <span
                      key={index}
                      className={
                        index < userInput.length
                          ? userInput[index] === char
                            ? 'text-green-600'
                            : 'text-red-600'
                          : 'text-gray-400'
                      }
                    >
                      {char}
                    </span>
                  ))}
                </div>
                <div className="text-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInputChange}
                    className="w-full max-w-md px-6 py-4 text-2xl border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={resetGame}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  やり直す
                </button>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center text-purple-600 mb-8">
                結果
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-6 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-2">WPM</div>
                  <div className="text-4xl font-bold text-purple-600">
                    {results[0]?.wpm || 0}
                  </div>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-2">CPM</div>
                  <div className="text-4xl font-bold text-pink-600">
                    {results[0]?.cpm || 0}
                  </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-2">正確率</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {results[0]?.accuracy || 0}%
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  完了した問題: {currentProblemIndex + 1} / {typingProblems.length}
                </p>
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-lg"
                >
                  もう一度挑戦
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
