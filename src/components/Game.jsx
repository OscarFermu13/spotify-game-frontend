// src/components/Game.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';

const HINTS = [
  { type: 'title_length',  label: 'Nº de letras del título', cost: 2, icon: '🔢' },
  { type: 'release_year',  label: 'Año de lanzamiento',       cost: 2, icon: '📅' },
  { type: 'artist_initial',label: 'Inicial del artista',      cost: 2, icon: '🎤' },
  { type: 'title_initial', label: 'Inicial del título',       cost: 2, icon: '🔤' },
  { type: 'album_cover',   label: 'Portada del álbum',        cost: 2, icon: '🖼️' },
];

const BLUR_LEVELS = ['blur-3xl', 'blur-2xl', 'blur-xl', 'blur-lg', 'blur-sm', 'blur-none'];

function getHintValue(type, track) {
  switch (type) {
    case 'title_length':
      return track.name.split(' ').map((w) => Array.from(w).map(() => '_').join(' ')).join('  ·  ');
    case 'release_year':
      return track.album?.release_date?.slice(0, 4) ?? '?';
    case 'artist_initial': {
      const artists = Array.isArray(track.artists)
        ? track.artists.map((a) => a.name ?? a).join(', ')
        : track.artists;
      return artists.split(', ').map((a) => a[0].toUpperCase() + '.').join(', ');
    }
    case 'title_initial':
      return track.name[0].toUpperCase() + '.';
    case 'album_cover':
      return track.album?.images?.[0]?.url ?? null;
    default:
      return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrackCounter({ index, total }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i < index ? 'bg-green-400 w-6' :
              i === index ? 'bg-green-400 w-10' :
              'bg-slate-700 w-6'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-slate-500 tabular-nums">
        {index + 1} <span className="text-slate-700">/</span> {total}
      </span>
    </div>
  );
}

function Timer({ currentTime, totalTime, hintTimeCost, result, penalty }) {
  const frozen = !!result;
  const penaltyCost = frozen && !result.correct ? penalty : 0;

  return (
    <div className="flex items-center justify-between mt-6 px-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${frozen ? 'bg-slate-600' : 'bg-green-400 animate-pulse'}`} />
        <span className="text-sm text-slate-400">
          Canción{' '}
          <span className="text-white font-mono font-semibold">{currentTime.toFixed(2)}s</span>
        </span>
        {hintTimeCost > 0 && (
          <span className="text-xs text-amber-500 font-mono">+{hintTimeCost}s pistas</span>
        )}
        {frozen && penaltyCost > 0 && (
          <span className="text-xs text-red-400 font-mono">
            +{penaltyCost}s {result.skipped ? 'por pasar' : 'penalización'}
          </span>
        )}
      </div>
      <div className="text-sm text-slate-500 shrink-0">
        Total <span className="text-slate-300 font-mono">{totalTime.toFixed(2)}s</span>
      </div>
    </div>
  );
}

function PlayControls({ playing, ready, result, confirmingPass, onPlay, onPause, onGuess, onPass, onCancelPass, guessing }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* Play / Pause */}
      {playing ? (
        <button
          onClick={onPause}
          disabled={!!result}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold rounded-xl transition disabled:opacity-40"
        >
          <span className="flex gap-0.5">
            <span className="w-1 h-4 bg-white rounded-full" />
            <span className="w-1 h-4 bg-white rounded-full" />
          </span>
          Pausar
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={!ready || !!result}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M8 5v14l11-7z" />
          </svg>
          {ready ? 'Reproducir' : 'Cargando…'}
        </button>
      )}

      {/* Pass */}
      {confirmingPass ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">¿Seguro?</span>
          <button
            onClick={onPass}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition"
          >
            Sí, pasar
          </button>
          <button
            onClick={onCancelPass}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm transition"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={onPass}
          disabled={!!result}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl transition disabled:opacity-40"
        >
          Pasar
        </button>
      )}

      {/* Guess */}
      <button
        onClick={onGuess}
        disabled={!!result}
        className={`px-5 py-2.5 font-bold rounded-xl transition disabled:opacity-40 ${
          guessing
            ? 'bg-slate-700 border border-slate-600 text-slate-300'
            : 'bg-white hover:bg-slate-100 text-slate-900'
        }`}
      >
        {guessing ? 'Cancelar' : 'Adivinar'}
      </button>
    </div>
  );
}

function SearchBox({ searchTerm, onChange, results, onSelect }) {
  return (
    <div className="mt-5">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el nombre de la canción…"
          autoFocus
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>
      {results.length > 0 && (
        <ul className="mt-2 bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700/60 shadow-xl overflow-hidden">
          {results.map((track) => (
            <li
              key={track.id}
              onClick={() => onSelect(track)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 cursor-pointer transition"
            >
              {track.album?.images?.[2] && (
                <img src={track.album.images[2].url} alt="" className="w-9 h-9 rounded-md flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm text-slate-100 truncate">{track.name}</div>
                <div className="text-xs text-slate-500 truncate">{track.artists.map((a) => a.name).join(', ')}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HintButton({ usedHints, result, onUseHint }) {
  if (usedHints.length >= HINTS.length) {
    return <p className="text-center text-xs text-slate-600 mt-5">Sin más pistas disponibles</p>;
  }
  const next = HINTS[usedHints.length];
  return (
    <div className="flex justify-center mt-5">
      <button
        onClick={() => onUseHint(next.type)}
        disabled={!!result}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl transition disabled:opacity-40"
      >
        💡 Pista
        <span className="text-amber-500/70 text-xs">{next.icon} {next.label} · +{next.cost}s</span>
      </button>
    </div>
  );
}

function RevealedHints({ usedHints, current }) {
  if (!usedHints.length) return null;
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {usedHints.map((type, idx) => {
        const hint = HINTS.find((h) => h.type === type);
        const value = getHintValue(type, current);
        const coverBlur = BLUR_LEVELS[Math.max(0, BLUR_LEVELS.length - 1 - idx)];

        if (type === 'album_cover') {
          return value ? (
            <div key={type} className="sm:col-span-2 flex flex-col items-center gap-2">
              <span className="text-xs text-slate-500">{hint.icon} {hint.label}</span>
              <div className="overflow-hidden rounded-2xl w-36 h-36 border border-slate-700">
                <img src={value} alt="portada" className={`w-full h-full object-cover ${coverBlur} transition-all duration-700`} />
              </div>
            </div>
          ) : null;
        }

        const isFullWidth = type === 'title_length';
        return (
          <div key={type} className={`flex items-start gap-2.5 px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm ${isFullWidth ? 'sm:col-span-2' : ''}`}>
            <span className="text-base shrink-0">{hint.icon}</span>
            <span className="text-slate-500 text-xs shrink-0 mt-0.5">{hint.label}:</span>
            <span className="font-mono font-semibold text-amber-300 tracking-widest break-all leading-relaxed">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ResultBanner({ result, onNext }) {
  const { correct, skipped, correctTrack } = result;
  const artistStr = Array.isArray(correctTrack.artists)
    ? correctTrack.artists.map((a) => a.name).join(', ')
    : correctTrack.artists;

  return (
    <div className={`mt-8 rounded-2xl border p-6 text-center ${
      correct
        ? 'bg-green-500/20 border-green-500/50'
        : 'bg-red-500/20 border-red-500/50'
    }`}>
      <div className="text-4xl mb-3">{correct ? '✅' : skipped ? '⏭️' : '❌'}</div>
      <p className={`text-lg font-black mb-1 ${correct ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
        {correct ? '¡Correcto!' : skipped ? 'Pasada' : 'Incorrecto'}
      </p>
      <p className="text-sm text-slate-400 mb-4">
        Era: <span className="text-slate-100 font-semibold">{correctTrack.name}</span>
        <span className="text-slate-500"> — {artistStr}</span>
      </p>
      {correctTrack.album?.images?.[0] && (
        <img
          src={correctTrack.album.images[0].url}
          alt={correctTrack.name}
          className="mx-auto mb-5 w-32 h-32 rounded-2xl shadow-xl border border-slate-700"
        />
      )}
      <button
        onClick={onNext}
        className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition"
      >
        Continuar →
      </button>
    </div>
  );
}

function SummaryCard({ t, penalty, i }) {
  const correctArtists = Array.isArray(t.artist) ? t.artist.map((a) => a.name).join(', ') : t.artist;
  const userGuessArtists = t.userGuess?.artists ? t.userGuess.artists.map((a) => a.name).join(', ') : null;
  const coverUrl = t.guessed
    ? t.album?.images?.[0]?.url
    : (t.userGuess?.album?.images?.[0]?.url ?? null);

  return (
    <div className={`rounded-2xl border overflow-hidden ${t.guessed ? 'border-green-500/60 bg-green-500/15' : 'border-red-500/60 bg-red-500/15'}`}>
      {/* Cover strip */}
      <div className="flex items-center gap-4 p-4">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-16 h-16 rounded-xl flex-shrink-0 shadow" />
        ) : (
          <div className="w-16 h-16 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
            {t.guessed ? '✅' : t.skipped ? '⏭️' : '❌'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-600">#{i + 1}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              t.guessed ? 'bg-green-500/20 text-green-400' :
              t.skipped ? 'bg-slate-600/40 text-slate-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {t.guessed ? 'Correcto' : t.skipped ? 'Pasada' : 'Fallo'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">{t.name}</p>
          <p className="text-xs text-slate-500 truncate">{correctArtists}</p>
        </div>
      </div>

      {/* Wrong guess */}
      {!t.guessed && t.userGuess && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-700/40 bg-slate-800/40">
          {t.userGuess.album?.images?.[2] && (
            <img src={t.userGuess.album.images[2].url} alt="" className="w-9 h-9 rounded-lg flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Tu respuesta</p>
            <p className="text-sm text-slate-300 truncate">{t.userGuess.name} — {userGuessArtists}</p>
          </div>
        </div>
      )}

      {/* Time row */}
      <div className="px-4 py-2.5 border-t border-slate-700/40 flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="text-xs text-slate-400 font-mono">{t.baseTime.toFixed(2)}s</span>
        {!t.guessed && (
          <span className="text-xs text-red-400 font-mono">+{penalty}s {t.skipped ? 'por pasar' : 'penalización'}</span>
        )}
        {t.hintCost > 0 && (
          <span className="text-xs text-amber-500 font-mono">+{t.hintCost}s pistas</span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Game({ tracks, penalty, token, apiBase, onFinish, postGameSlot }) {
  const { player, deviceId, ready } = useSpotifyPlayer(apiBase, token);

  const [index, setIndex] = useState(0);
  const [perTrackTime, setPerTrackTime] = useState([]);
  const [playing, setPlaying] = useState(false);

  const playStartRef = useRef(null);
  const maxElapsedRef = useRef(0);
  const rafRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [summaryShown, setSummaryShown] = useState(false);

  const [guessing, setGuessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);
  const [resultElapsed, setResultElapsed] = useState(0);
  const [playError, setPlayError] = useState(null);
  const [confirmingPass, setConfirmingPass] = useState(false);
  const [usedHints, setUsedHints] = useState([]);

  const current = tracks[index];

  const authHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // ── Cronómetro ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      const tick = () => {
        if (playStartRef.current) {
          const elapsed = (Date.now() - playStartRef.current) / 1000;
          setCurrentTime(Math.max(maxElapsedRef.current, elapsed));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    }
    return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  }, [playing]);

  const totalTime = useMemo(
    () => perTrackTime.reduce((acc, t) => acc + t.timeTaken + (t.skipped ? penalty : 0), 0),
    [perTrackTime, penalty]
  );

  const hintTimeCost = usedHints.length * 2;

  // ── Reproducción ──────────────────────────────────────────────────────────
  const startPlay = async () => {
    if (!ready || !deviceId) { alert('El reproductor no está listo. ¿Tienes cuenta Premium?'); return; }
    if (!playing) { playStartRef.current = Date.now(); setPlaying(true); setPlayError(null); }
    try {
      await axios.put(`${apiBase}/api/spotify/play`, { device_id: deviceId, uris: [current.uri] }, { headers: authHeaders() });
    } catch (e) {
      setPlaying(false); playStartRef.current = null;
      setPlayError('No se pudo reproducir. Inténtalo de nuevo.');
    }
  };

  const pausePlay = async () => {
    if (!playing) return;
    if (playStartRef.current) {
      maxElapsedRef.current = Math.max(maxElapsedRef.current, (Date.now() - playStartRef.current) / 1000);
      playStartRef.current = null;
    }
    setPlaying(false);
    try { await player.pause(); } catch (_) {}
  };

  const freezeTimer = () => {
    if (playStartRef.current) {
      maxElapsedRef.current = Math.max(maxElapsedRef.current, (Date.now() - playStartRef.current) / 1000);
      playStartRef.current = null;
    }
    return maxElapsedRef.current;
  };

  const stopTimerAndRecord = (guessedCorrect, skipped = false, userGuess = null) => {
    const elapsed = freezeTimer();
    setResultElapsed(elapsed);
    const timeTaken = guessedCorrect || skipped
      ? elapsed + hintTimeCost
      : elapsed + penalty + hintTimeCost;

    setPerTrackTime((prev) => {
      const arr = [...prev];
      arr[index] = {
        trackId: current.id, name: current.name, artist: current.artists,
        album: current.album, timeTaken, baseTime: elapsed, hintCost: hintTimeCost,
        skipped, guessed: guessedCorrect,
        ...(userGuess ? { userGuess } : {}),
      };
      return arr;
    });
    maxElapsedRef.current = 0;
  };

  const handlePass = async () => {
    if (!confirmingPass) { setConfirmingPass(true); return; }
    setConfirmingPass(false);
    if (playing) await pausePlay();
    stopTimerAndRecord(false, true);
    setResult({ correct: false, skipped: true, correctTrack: current });
  };

  const handleGuessClick = async () => {
    if (guessing) { setGuessing(false); return; }
    if (playing) await pausePlay();
    setGuessing(true);
  };

  const handleSelectGuess = (guess) => {
    const guessedCorrect = guess.name === current.name;
    stopTimerAndRecord(guessedCorrect, false, guessedCorrect ? null : guess);
    setResult({ correct: guessedCorrect, skipped: false, correctTrack: current });
    setGuessing(false); setSearchTerm(''); setSearchResults([]);
  };

  const next = async () => {
    if (player) { try { await player.pause(); } catch (_) {} }
    setConfirmingPass(false); 
    setUsedHints([]); 
    setResult(null); 
    setGuessing(false); 
    setSearchTerm('');
    setCurrentTime(0);
    if (index + 1 < tracks.length) { setIndex((i) => i + 1); }
    else { setSummaryShown(true); }
  };

  const useHint = (type) => {
    if (usedHints.includes(type)) return;
    setUsedHints((prev) => [...prev, type]);
  };

  // Auto-play on result reveal
  useEffect(() => {
    if (!result || !ready || !deviceId) return;
    const track = result.correctTrack;
    const positionMs = Math.floor((track.duration_ms || 0) * 0.45);
    axios.put(`${apiBase}/api/spotify/play`, { device_id: deviceId, uris: [track.uri], position_ms: positionMs }, { headers: authHeaders() })
      .catch((e) => console.error('Auto-play failed', e.response?.data || e.message));
  }, [result]);

  // Search debounce
  useEffect(() => {
    if (searchTerm.length <= 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/spotify/search`, { headers: authHeaders(), params: { q: searchTerm, type: 'track', limit: 5 } });
        setSearchResults(res.data.tracks.items);
      } catch (_) {}
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm, apiBase, authHeaders]);

  // onFinish
  useEffect(() => {
    if (!summaryShown || typeof onFinish !== 'function') return;
    const perTrack = perTrackTime.map((t) => ({ trackId: t.trackId, guessed: !!t.guessed, timeTaken: Number(t.timeTaken || 0) }));
    onFinish({ totalTime, perTrack });
  }, [summaryShown]);

  // ── Summary ───────────────────────────────────────────────────────────────
  if (summaryShown) {
    const guessedCount = perTrackTime.filter((t) => t.guessed).length;
    return (
      <div>
        {/* Stats row */}
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

        <h3 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
          Resumen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perTrackTime.map((t, i) => (
            <SummaryCard key={i} t={t} penalty={penalty} i={i} />
          ))}
        </div>

        {postGameSlot && <div className="mt-2">{postGameSlot}</div>}
      </div>
    );
  }

  // ── Game UI ───────────────────────────────────────────────────────────────
  return (
    <div>
      <TrackCounter index={index} total={tracks.length} />

      {playError && (
        <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm text-center">
          {playError}
        </div>
      )}

      {/* Vinyl / disc visual */}
      <div className="flex justify-center mb-7">
        <div className={`relative w-36 h-36 rounded-full border-4 ${playing ? 'border-green-400/60' : 'border-slate-700'} bg-slate-900 shadow-2xl transition-all duration-500`}
          style={{ animation: playing ? 'spin 4s linear infinite' : 'none' }}>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          {/* Grooves */}
          {[44, 36, 28, 20].map((s) => (
            <div key={s} className="absolute inset-0 rounded-full border border-slate-800" style={{ margin: `${(144-s*2)/8}%` }} />
          ))}
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors duration-300 ${playing ? 'bg-green-500' : 'bg-slate-700'}`}>
              {playing ? '♪' : '?'}
            </div>
          </div>
        </div>
      </div>

      <PlayControls
        playing={playing}
        ready={ready}
        result={result}
        confirmingPass={confirmingPass}
        onPlay={startPlay}
        onPause={pausePlay}
        onGuess={handleGuessClick}
        onPass={handlePass}
        onCancelPass={() => setConfirmingPass(false)}
        guessing={guessing}
      />

      {guessing && (
        <SearchBox
          searchTerm={searchTerm}
          onChange={setSearchTerm}
          results={searchResults}
          onSelect={handleSelectGuess}
        />
      )}

      <HintButton usedHints={usedHints} result={result} onUseHint={useHint} />
      <RevealedHints usedHints={usedHints} current={current} />
      <Timer currentTime={currentTime} totalTime={totalTime} hintTimeCost={hintTimeCost} result={result} penalty={penalty} />

      {result && (
        <ResultBanner result={result} onNext={next} />
      )}
    </div>
  );
}