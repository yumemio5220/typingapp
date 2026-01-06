'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TypingProblem, TypingResult, RankingEntry } from '@/types/typing';
import { hiraganaToRomaji } from '@/utils/romajiConverter';
import { generateNextProblem } from '@/utils/problemGenerator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { submitScore, fetchRankings } from '@/lib/ranking';
import { playErrorSound } from '@/utils/sound';

type GameState = 'ready' | 'countdown' | 'playing' | 'finished';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentProblem, setCurrentProblem] = useState<TypingProblem | null>(null);
  const [problemCount, setProblemCount] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [results, setResults] = useLocalStorage<TypingResult[]>('typing-results', []);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [showMistypeEffect, setShowMistypeEffect] = useState(false);
  const [savedUsername, setSavedUsername] = useLocalStorage<string>('typing-username', '');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'ranking'>('history');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const usedWordsRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);
  const totalCharsRef = useRef(0);
  const completedWordsRef = useRef<string[]>([]);
  const finishGameRef = useRef<(() => void) | null>(null);

  const getTargetRomaji = () => {
    if (!currentProblem) return '';
    const allRomaji = hiraganaToRomaji(currentProblem.hiragana);
    const matching = allRomaji.filter(r => r.startsWith(userInput));
    return matching.length > 0 ? matching[0] : allRomaji[0];
  };

  const targetRomaji = getTargetRomaji();

  const finishGame = useCallback(() => {
    setGameState('finished');
    const now = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startTimeRef.current) {
      const timeElapsed = (now - startTimeRef.current) / 1000;
      const minutes = timeElapsed / 60;
      const wpm = Math.round((correctCharsRef.current / 5) / minutes);
      const cpm = Math.round(correctCharsRef.current / minutes);
      const accuracy = totalCharsRef.current > 0 ? Math.round((correctCharsRef.current / totalCharsRef.current) * 100) : 0;

      const result: TypingResult = {
        score: correctCharsRef.current,
        wpm,
        cpm,
        accuracy,
        timeElapsed,
        problemText: completedWordsRef.current.slice(0, 5).join(', ') + (completedWordsRef.current.length > 5 ? ' ...' : ''),
        date: new Date().toISOString(),
        completedCount: completedWordsRef.current.length,
        mistypes: totalCharsRef.current - correctCharsRef.current,
      };

      setResults((prevResults) => [result, ...prevResults].slice(0, 10));
    }

    // ランキングを自動取得
    fetchRankings(10).then(data => setRankings(data));

    // 保存されたユーザー名をデフォルト値として設定
    setUsername(savedUsername);
  }, [setResults, savedUsername]);

  // Refを同期
  useEffect(() => {
    startTimeRef.current = startTime;
    correctCharsRef.current = correctChars;
    totalCharsRef.current = totalChars;
    completedWordsRef.current = completedWords;
    finishGameRef.current = finishGame;
  }, [startTime, correctChars, totalChars, completedWords, finishGame]);

  const startGame = useCallback(() => {
    // カウントダウンを開始
    setCountdown(3);
    setGameState('countdown');
  }, []);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setCurrentProblem(null);
    setProblemCount(0);
    setUserInput('');
    setCorrectChars(0);
    setTotalChars(0);
    setCompletedWords([]);
    setStartTime(null);
    startTimeRef.current = null;
    correctCharsRef.current = 0;
    totalCharsRef.current = 0;
    completedWordsRef.current = [];
    setTimeLeft(10);
    usedWordsRef.current.clear();
    setSubmitStatus('idle');
  }, []);

  const handleSubmitScore = async () => {
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const latestResult = results[0];
    if (!latestResult) {
      setIsSubmitting(false);
      return;
    }

    const result = await submitScore({
      username: username.trim(),
      score: latestResult.score,
      completedCount: latestResult.completedCount ?? 0,
      mistypes: latestResult.mistypes ?? 0,
    });

    setIsSubmitting(false);
    setSubmitStatus(result.success ? 'success' : 'error');

    if (result.success) {
      // ユーザー名をlocalStorageに保存
      setSavedUsername(username.trim());
      const newRankings = await fetchRankings(10);
      setRankings(newRankings);
    }
  };

  const loadRankings = useCallback(async () => {
    const data = await fetchRankings(10);
    setRankings(data);
  }, []);

  // カウントダウン処理
  useEffect(() => {
    if (gameState !== 'countdown') return;

    if (countdown === 0) {
      // カウントダウンが0になったら実際にゲームを開始
      usedWordsRef.current.clear();
      const firstProblem = generateNextProblem(1, usedWordsRef.current);

      const now = Date.now();
      setCurrentProblem(firstProblem);
      setGameState('playing');
      setProblemCount(0);
      setUserInput('');
      setCorrectChars(0);
      setTotalChars(0);
      setCompletedWords([]);
      setStartTime(now);
      startTimeRef.current = now;
      correctCharsRef.current = 0;
      totalCharsRef.current = 0;
      completedWordsRef.current = [];
      setTimeLeft(10);
      inputRef.current?.focus();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameState, countdown]);

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

  useEffect(() => {
    if (gameState !== 'ready') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === ' ') {
        e.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, startGame]);

  useEffect(() => {
    if (gameState === 'ready') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, resetGame]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing' || !currentProblem) return;

    const input = e.target.value.toLowerCase();
    const prevInputLength = userInput.length;

    if (input.length > prevInputLength) {
      setTotalChars((prev) => prev + 1);
    }

    const allPossibleRomaji = hiraganaToRomaji(currentProblem.hiragana);
    const acceptable = allPossibleRomaji.filter(romaji => romaji.startsWith(input));

    if (acceptable.length === 0 && input.length > 0) {
      // ミスタイプ時に背景エフェクトを表示＆エラー音を再生
      setShowMistypeEffect(true);
      setTimeout(() => setShowMistypeEffect(false), 150);
      playErrorSound();
      return;
    }

    setUserInput(input);

    if (acceptable.some(romaji => romaji === input)) {
      // 最後の文字も正しいのでカウント
      if (input.length > prevInputLength) {
        setCorrectChars((prev) => prev + 1);
      }
      setCompletedWords((prev) => [...prev, currentProblem.text]);
      setProblemCount((prev) => prev + 1);

      // 次の問題を生成
      const nextProblem = generateNextProblem(problemCount + 2, usedWordsRef.current);
      setCurrentProblem(nextProblem);
      setUserInput('');
    } else if (input.length > prevInputLength && acceptable.length > 0) {
      setCorrectChars((prev) => prev + 1);
    }
  };


  return (
    <div className={`min-h-screen py-4 sm:py-8 px-2 sm:px-4 transition-colors duration-100 ${
      showMistypeEffect
        ? 'bg-red-200'
        : 'bg-gradient-to-br from-purple-50 to-pink-100'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
            タイピング練習
          </h1>

          {gameState === 'ready' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-4">
                  スタートボタンを押してください
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  または sキー / スペースキー でスタート
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-lg"
                >
                  スタート
                </button>
              </div>


              {/* タブ切り替え */}
              <div className="mt-8">
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-bold transition-colors ${
                      activeTab === 'history'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    最近の成績
                  </button>
                  <button
                    onClick={async () => {
                      setActiveTab('ranking');
                      if (rankings.length === 0) {
                        await loadRankings();
                      }
                    }}
                    className={`px-4 py-2 font-bold transition-colors ${
                      activeTab === 'ranking'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ランキング
                  </button>
                </div>

                {/* 最近の成績タブ */}
                {activeTab === 'history' && (
                  <>
                    {results.length > 0 ? (
                      <div className="space-y-3">
                        {results.map((result, index) => {
                          const isTopScore = index === results.indexOf(
                            results.reduce((max, r) => r.score > max.score ? r : max, results[0])
                          );
                          return (
                            <div
                              key={index}
                              className={`relative overflow-hidden rounded-xl p-4 transition-all hover:shadow-lg ${
                                isTopScore
                                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300'
                                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-4">
                                  <div className={`text-4xl font-bold ${isTopScore ? 'text-yellow-600' : 'text-purple-600'}`}>
                                    {result.score}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(result.date).toLocaleDateString('ja-JP', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  {isTopScore && (
                                    <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                                      ベスト
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-4 text-sm">
                                  <div className="flex flex-col items-center px-3 py-1 bg-white rounded-lg shadow-sm">
                                    <span className="text-gray-500 text-xs">単語数</span>
                                    <span className="font-bold text-gray-700">{result.completedCount ?? '-'}</span>
                                  </div>
                                  <div className="flex flex-col items-center px-3 py-1 bg-white rounded-lg shadow-sm">
                                    <span className="text-gray-500 text-xs">ミス</span>
                                    <span className={`font-bold ${(result.mistypes ?? 0) === 0 ? 'text-green-600' : (result.mistypes ?? 0) <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {result.mistypes ?? '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">まだ記録がありません</p>
                    )}
                  </>
                )}

                {/* ランキングタブ */}
                {activeTab === 'ranking' && (
                  <>
                    {rankings.length > 0 ? (
                      <div className="space-y-3">
                        {/* TOP3: リッチ表示 */}
                        {rankings.slice(0, 3).map((entry, index) => (
                          <div
                            key={entry.id}
                            className={`relative overflow-hidden rounded-xl p-4 transition-all hover:shadow-lg ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400'
                                : index === 1
                                ? 'bg-gradient-to-r from-slate-100 to-gray-200 border-2 border-slate-400'
                                : 'bg-gradient-to-r from-orange-100 to-amber-200 border-2 border-orange-400'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-4">
                                <span className={`text-2xl font-bold w-8 ${
                                  index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'
                                }`}>
                                  {index + 1}
                                </span>
                                <div className={`text-4xl font-bold ${
                                  index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'
                                }`}>
                                  {entry.score}
                                </div>
                                <span className="font-bold text-gray-800">{entry.username}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(entry.created_at).toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <div className="flex flex-col items-center px-3 py-1 bg-white rounded-lg shadow-sm">
                                  <span className="text-gray-500 text-xs">単語数</span>
                                  <span className="font-bold text-gray-700">{entry.completed_count}</span>
                                </div>
                                <div className="flex flex-col items-center px-3 py-1 bg-white rounded-lg shadow-sm">
                                  <span className="text-gray-500 text-xs">ミス</span>
                                  <span className={`font-bold ${entry.mistypes === 0 ? 'text-green-600' : entry.mistypes <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {entry.mistypes}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 4位以下: シンプル表示 */}
                        {rankings.length > 3 && (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody>
                                {rankings.slice(3).map((entry, index) => (
                                  <tr key={entry.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-500 font-bold w-8">{index + 4}</td>
                                    <td className="py-2 px-3 font-bold text-purple-600">{entry.score}</td>
                                    <td className="py-2 px-3 text-gray-800">{entry.username}</td>
                                    <td className="py-2 px-3 text-gray-700">{entry.completed_count}</td>
                                    <td className={`py-2 px-3 ${entry.mistypes === 0 ? 'text-green-600' : entry.mistypes <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {entry.mistypes}
                                    </td>
                                    <td className="py-2 px-3 text-gray-500 text-xs">
                                      {new Date(entry.created_at).toLocaleDateString('ja-JP', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">ランキングを読み込み中...</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {gameState === 'countdown' && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-2xl text-gray-600 mb-8">
                  まもなく開始します
                </p>
                <div className="text-9xl font-bold text-purple-600 animate-pulse">
                  {countdown}
                </div>
              </div>
            </div>
          )}

          {gameState === 'playing' && currentProblem && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-700">
                  スコア: {correctChars}
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

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Escキー でやり直す
                </p>
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

              <div className="flex justify-center">
                <div className="bg-purple-50 p-8 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-2">スコア</div>
                  <div className="text-5xl font-bold text-purple-600">
                    {correctChars}
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  完了した問題: {problemCount}問
                </p>
                <p className="text-gray-600">
                  ミスタイプ: {totalChars - correctChars}回
                </p>
              </div>

              {/* ランキング登録フォーム */}
              {submitStatus === 'idle' && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                    ランキングに登録
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ユーザー名を入力"
                      maxLength={20}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                    />
                    <button
                      onClick={handleSubmitScore}
                      disabled={!username.trim() || isSubmitting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {isSubmitting ? '送信中...' : '登録する'}
                    </button>
                  </div>
                </div>
              )}

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-300 p-4 rounded-lg text-center">
                  <p className="text-green-700 font-bold">ランキングに登録しました！</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-300 p-4 rounded-lg text-center">
                  <p className="text-red-700">登録に失敗しました。もう一度お試しください。</p>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="mt-2 text-sm text-red-600 underline"
                  >
                    再試行
                  </button>
                </div>
              )}

              {/* ランキング表示 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  ランキング TOP10
                </h3>
                {rankings.length > 0 ? (
                  <div className="space-y-3">
                    {/* TOP3: リッチ表示 */}
                    {rankings.slice(0, 3).map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`relative overflow-hidden rounded-xl p-4 transition-all ${
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400'
                            : index === 1
                            ? 'bg-gradient-to-r from-slate-100 to-gray-200 border-2 border-slate-400'
                            : 'bg-gradient-to-r from-orange-100 to-amber-200 border-2 border-orange-400'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <span className={`text-2xl font-bold w-8 ${
                              index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'
                            }`}>
                              {index + 1}
                            </span>
                            <div className={`text-4xl font-bold ${
                              index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'
                            }`}>
                              {entry.score}
                            </div>
                            <span className="font-bold text-gray-800">{entry.username}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="flex flex-col items-center px-3 py-1 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-500 text-xs">単語数</span>
                              <span className="font-bold text-gray-700">{entry.completed_count}</span>
                            </div>
                            <div className="flex flex-col items-center px-3 py-1 bg-white rounded-lg shadow-sm">
                              <span className="text-gray-500 text-xs">ミス</span>
                              <span className={`font-bold ${entry.mistypes === 0 ? 'text-green-600' : entry.mistypes <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {entry.mistypes}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 4位以下: シンプル表示 */}
                    {rankings.length > 3 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-sm">
                          <tbody>
                            {rankings.slice(3).map((entry, index) => (
                              <tr key={entry.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-500 font-bold w-8">{index + 4}</td>
                                <td className="py-2 px-3 font-bold text-purple-600">{entry.score}</td>
                                <td className="py-2 px-3 text-gray-800">{entry.username}</td>
                                <td className="py-2 px-3 text-gray-700">{entry.completed_count}</td>
                                <td className={`py-2 px-3 ${entry.mistypes === 0 ? 'text-green-600' : entry.mistypes <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {entry.mistypes}
                                </td>
                                <td className="py-2 px-3 text-gray-500 text-xs">
                                  {new Date(entry.created_at).toLocaleDateString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">読み込み中...</p>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Escキー でやり直す
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
