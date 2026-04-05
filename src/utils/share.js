import { FRONTEND_URL } from '../config/env.js';

export function buildDailyShareText(gameResult) {
  const { totalTime, perTrack } = gameResult;
  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  const emojiRow = perTrack.map((t) => {
    if (t.guessed) return '✅';
    if (t.skipped) return '⏭️';
    return '❌';
  }).join('');

  const guessed = perTrack.filter((t) => t.guessed).length;
  return [
    `🎵 SpotifyQuiz · Reto del día`,
    `📅 ${today}`,
    ``,
    emojiRow,
    ``,
    `🎯 ${guessed}/${perTrack.length} canciones · ⏱️ ${totalTime.toFixed(2)}s`,
    ``,
    `¿Puedes superarme? → ${FRONTEND_URL}`,
  ].join('\n');
}

export function buildPackShareText(gameResult, packName) {
  const { totalTime, perTrack } = gameResult;
  const emojiRow = perTrack.map((t) => t.guessed ? '✅' : t.skipped ? '⏭️' : '❌').join('');
  const guessed  = perTrack.filter((t) => t.guessed).length;
  return [
    `🎵 SpotifyQuiz · ${packName ?? 'Pack'}`,
    ``,
    emojiRow,
    ``,
    `🎯 ${guessed}/${perTrack.length} canciones · ⏱️ ${totalTime.toFixed(2)}s`,
    ``,
    `¿Puedes superarme? → ${FRONTEND_URL}`,
  ].join('\n');
}

export function buildCustomShareText(gameResult, sessionId) {
  const { totalTime, perTrack } = gameResult;
  const emojiRow = perTrack.map((t) => t.guessed ? '✅' : t.skipped ? '⏭️' : '❌').join('');
  const guessed  = perTrack.filter((t) => t.guessed).length;
  return [
    `🎵 SpotifyQuiz`,
    ``,
    emojiRow,
    ``,
    `🎯 ${guessed}/${perTrack.length} · ⏱️ ${totalTime.toFixed(2)}s`,
    ``,
    `¿Te atreves? → ${FRONTEND_URL}/session/${sessionId}`,
  ].join('\n');
}