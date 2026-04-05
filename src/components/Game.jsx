import { useEffect, useState, useMemo } from 'react';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';
import useGameTimer from '../hooks/useGameTimer';
import useGamePlayback from '../hooks/useGamePlayback';
import useGuess from '../hooks/useGuess';

import TrackCounter from './game/TrackCounter';
import Timer from './game/Timer';
import PlayControls from './game/PlayControls';
import SearchBox from './game/SearchBox';
import HintButton from './game/HintButton';
import RevealedHints from './game/RevealedHints';
import ResultBanner from './game/ResultBanner';
import SummaryCard from './game/SummaryCard';

export default function Game({ tracks, penalty, apiBase, onFinish, postGameSlot }) {
  const { player, deviceId, ready } = useSpotifyPlayer(apiBase);

  const timer = useGameTimer();
  const playback = useGamePlayback({ apiBase, deviceId, ready, player });
  const guess = useGuess({ apiBase });

  const [index, setIndex] = useState(0);
  const [perTrackTime, setPerTrackTime] = useState([]);
  const [result, setResult] = useState(null);
  const [summaryShown, setSummaryShown] = useState(false);
  const [confirmingPass, setConfirmingPass] = useState(false);
  const [usedHints, setUsedHints] = useState([]);

  const current = tracks[index];
  const hintTimeCost = usedHints.length * 2;

  const totalTime = useMemo(
    () => perTrackTime.reduce((acc, t) => acc + t.timeTaken + (t.skipped ? penalty : 0), 0),
    [perTrackTime, penalty]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePlay = () => {
    playback.play(current.uri, timer.start);
  };

  const handlePause = () => {
    playback.pause(timer.pause);
  };

  const stopTimerAndRecord = (guessedCorrect, skipped = false, userGuess = null) => {
    const elapsed = timer.freeze();
    const timeTaken = guessedCorrect || skipped
      ? elapsed + hintTimeCost
      : elapsed + penalty + hintTimeCost;

    setPerTrackTime((prev) => {
      const arr = [...prev];
      arr[index] = {
        trackId: current.id,
        name: current.name,
        artist: current.artists,
        album: current.album,
        timeTaken,
        baseTime: elapsed,
        hintCost: hintTimeCost,
        skipped,
        guessed: guessedCorrect,
        ...(userGuess ? { userGuess } : {}),
      };
      return arr;
    });
  };

  const handlePass = async () => {
    if (!confirmingPass) { setConfirmingPass(true); return; }
    setConfirmingPass(false);
    await playback.pause(timer.pause);
    stopTimerAndRecord(false, true);
    setResult({ correct: false, skipped: true, correctTrack: current });
  };

  const handleGuessClick = () => {
    guess.openGuess(handlePause);
  };

  const handleSelectGuess = (selected) => {
    const guessedCorrect = selected.name === current.name;
    stopTimerAndRecord(guessedCorrect, false, guessedCorrect ? null : selected);
    setResult({ correct: guessedCorrect, skipped: false, correctTrack: current });
    guess.closeGuess();
  };

  const handleNext = async () => {
    await playback.stop();
    setConfirmingPass(false);
    setUsedHints([]);
    setResult(null);
    guess.closeGuess();
    timer.reset();
    if (index + 1 < tracks.length) setIndex((i) => i + 1);
    else setSummaryShown(true);
  };

  const handleUseHint = (type) => {
    if (!usedHints.includes(type)) setUsedHints((prev) => [...prev, type]);
  };

  // ── Auto-play canción correcta al revelar resultado ─────────────────────
  useEffect(() => {
    if (!result || !ready || !deviceId) return;
    const positionMs = Math.floor((result.correctTrack.duration_ms || 0) * 0.45);
    playback.playFromPosition(result.correctTrack.uri, positionMs);
  }, [result]);

  // ── onFinish ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!summaryShown || typeof onFinish !== 'function') return;
    const perTrack = perTrackTime.map((t) => ({
      trackId: t.trackId,
      guessed: !!t.guessed,
      skipped: !!t.skipped,
      timeTaken: Number(t.timeTaken || 0),
      baseTime: Number(t.baseTime || 0),
      hintCost: Number(t.hintCost || 0),
    }));
    onFinish({ totalTime, perTrack });
  }, [summaryShown]);

  // ── Summary ────────────────────────────────────────────────────────────────
  if (summaryShown) {
    const guessedCount = perTrackTime.filter((t) => t.guessed).length;
    return (
      <div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Tiempo total', value: `${totalTime.toFixed(2)}s` },
            { label: 'Acertadas', value: `${guessedCount}/${tracks.length}` },
            { label: 'Precisión', value: `${Math.round((guessedCount / tracks.length) * 100)}%` },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perTrackTime.map((t, i) => (
            <SummaryCard key={i} t={t} penalty={penalty} i={i} />
          ))}
        </div>
        {postGameSlot && <div className="mt-2">{postGameSlot}</div>}
      </div>
    );
  }

  // ── Game UI ────────────────────────────────────────────────────────────────
  return (
    <div>
      <TrackCounter index={index} total={tracks.length} />

      {playback.playError && (
        <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm text-center">
          {playback.playError}
        </div>
      )}

      {/* Vinyl visual */}
      <div className="flex justify-center mb-7">
        <div className={`relative w-36 h-36 rounded-full border-4 ${playback.playing ? 'border-green-400/60' : 'border-slate-700'} bg-slate-900 shadow-2xl transition-all duration-500`}
          style={{ animation: playback.playing ? 'spin 4s linear infinite' : 'none' }}>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          {[44, 36, 28, 20].map((s) => (
            <div key={s} className="absolute inset-0 rounded-full border border-slate-800" style={{ margin: `${(144 - s * 2) / 8}%` }} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors duration-300 ${playback.playing ? 'bg-green-500' : 'bg-slate-700'}`}>
              {playback.playing ? '♪' : '?'}
            </div>
          </div>
        </div>
      </div>

      <PlayControls
        playing={playback.playing}
        ready={ready}
        result={result}
        confirmingPass={confirmingPass}
        onPlay={handlePlay}
        onPause={handlePause}
        onGuess={handleGuessClick}
        onPass={handlePass}
        onCancelPass={() => setConfirmingPass(false)}
        guessing={guess.guessing}
      />

      {guess.guessing && (
        <SearchBox
          searchTerm={guess.searchTerm}
          onChange={guess.setSearchTerm}
          results={guess.searchResults}
          onSelect={handleSelectGuess}
        />
      )}

      <HintButton usedHints={usedHints} result={result} onUseHint={handleUseHint} />
      <RevealedHints usedHints={usedHints} current={current} />

      <Timer
        currentTime={timer.currentTime}
        totalTime={totalTime}
        hintTimeCost={hintTimeCost}
        result={result}
        penalty={penalty}
      />

      {result && <ResultBanner result={result} onNext={handleNext} />}
    </div>
  );
}