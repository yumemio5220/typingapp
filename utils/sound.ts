/**
 * Web Audio APIを使用してエラー音を再生する
 */
export const playErrorSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // エラー音の設定: 高めの周波数で短く鋭い音
    oscillator.frequency.value = 800; // Hz（高い音）
    oscillator.type = 'sine'; // 正弦波

    // 音量の設定とフェードアウト
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // 音量を大きめに
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    // 再生
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1); // 100ms後に停止
  } catch (error) {
    // エラーが発生してもアプリケーションを止めない
    console.warn('Error playing sound:', error);
  }
};
