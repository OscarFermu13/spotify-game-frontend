// src/components/Game.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://127.0.0.1:5173';

export default function Game({ tracks, penalty, token, apiBase, onFinish, sessionId }) {
  const { player, deviceId, ready } = useSpotifyPlayer(apiBase, token);

  const [index, setIndex] = useState(0);
  const [perTrackTime, setPerTrackTime] = useState([]);
  const [playing, setPlaying] = useState(false);

  const playStartRef = useRef(null);
  const maxElapsedRef = useRef(0);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [summaryShown, setSummaryShown] = useState(false);

  const [guessing, setGuessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);
  const [playError, setPlayError] = useState(null);
  const [confirmingPass, setConfirmingPass] = useState(false);

  const current = tracks[index];

  const authHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // ── Cronómetro ────────────────────────────────────────────────────────────
  const rafRef = useRef(null);

  useEffect(() => {
    if (playing) {
      const tick = () => {
        if (playStartRef.current) {
          const intervalSoFar = (Date.now() - playStartRef.current) / 1000;
          setCurrentTime(Math.max(maxElapsedRef.current, intervalSoFar));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing]);

  // ── Tiempo total ──────────────────────────────────────────────────────────
  const totalTime = useMemo(
    () => perTrackTime.reduce((acc, t) => acc + t.timeTaken + (t.skipped ? penalty : 0), 0),
    [perTrackTime, penalty]
  );

  // ── Reproducción ──────────────────────────────────────────────────────────
  const startPlay = async () => {
    if (!ready || !deviceId) {
      alert('El reproductor no está listo. ¿Tienes cuenta Premium?');
      return;
    }

    if (!playing) {
      playStartRef.current = Date.now();
      setPlaying(true);
      setPlayError(null);
    }

    try {
      await axios.put(
        `${apiBase}/api/spotify/play`,
        { device_id: deviceId, uris: [current.uri] },
        { headers: authHeaders() }
      );
    } catch (e) {
      console.error('Error reproduciendo', e.response?.data || e.message);
      setPlaying(false);
      playStartRef.current = null;
      setPlayError('No se pudo reproducir la canción. Inténtalo de nuevo.');
    }
  };

  const pausePlay = async () => {
    if (!playing) return;

    if (playStartRef.current) {
      const intervalElapsed = (Date.now() - playStartRef.current) / 1000;
      maxElapsedRef.current = Math.max(maxElapsedRef.current, intervalElapsed);
      playStartRef.current = null;
    }
    setPlaying(false);

    try {
      await player.pause();
    } catch (e) {
      console.error('Error pausando', e);
    }
  };

  // ── Registro de resultado ─────────────────────────────────────────────────
  const freezeTimer = () => {
    if (playStartRef.current) {
      const intervalElapsed = (Date.now() - playStartRef.current) / 1000;
      maxElapsedRef.current = Math.max(maxElapsedRef.current, intervalElapsed);
      playStartRef.current = null;
    }
    return maxElapsedRef.current;
  };

  const stopTimerAndRecord = (guessedCorrect, skipped = false, userGuess = null) => {
    const elapsed = freezeTimer();
    const timeTaken = guessedCorrect || skipped
      ? elapsed                  // acierto o skip: tiempo puro
      : elapsed + penalty;       // fallo: tiempo + penalización

    setPerTrackTime((prev) => {
      const arr = [...prev];
      arr[index] = {
        trackId: current.id,
        name: current.name,
        artist: current.artists,
        album: current.album,
        timeTaken,
        skipped,
        guessed: guessedCorrect,
        ...(userGuess ? { userGuess } : {}),
      };
      return arr;
    });

    maxElapsedRef.current = 0;
    setCurrentTime(0);
  };

  const handlePass = async () => {
    if (!confirmingPass) {
      setConfirmingPass(true);
      return;
    }
    setConfirmingPass(false);
    if (playing) await pausePlay();
    stopTimerAndRecord(false, true);
    setResult({ correct: false, correctTrack: current });
  };

  const cancelPass = () => setConfirmingPass(false);

  const handleGuessClick = async () => {
    if (playing) await pausePlay();
    setGuessing(true);
  };

  const handleSelectGuess = (guess) => {
    const guessedCorrect = guess.name === current.name;
    stopTimerAndRecord(guessedCorrect, false, guessedCorrect ? null : guess);
    setResult({ correct: guessedCorrect, correctTrack: current });
    setGuessing(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const next = async () => {
    if (player) {
      try { await player.pause(); } catch (_) {}
    }
    setConfirmingPass(false);
    setResult(null);
    if (index + 1 < tracks.length) {
      setIndex((i) => i + 1);
    } else {
      setSummaryShown(true);
    }
  };

  // ── Auto-reproducir al mostrar resultado ─────────────────────────────────
  useEffect(() => {
    if (!result || !ready || !deviceId) return;

    const track = result.correctTrack;
    const positionMs = Math.floor((track.duration_ms || 0) * 0.45); // empezar a escuchar desde el 45% de la canción

    axios.put(
      `${apiBase}/api/spotify/play`,
      { device_id: deviceId, uris: [track.uri], position_ms: positionMs },
      { headers: authHeaders() }
    ).catch((e) => console.error('Auto-play on result failed', e.response?.data || e.message));
  }, [result]); 

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTerm.length <= 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/spotify/search`, {
          headers: authHeaders(),
          params: { q: searchTerm, type: 'track', limit: 5 },
        });
        setSearchResults(res.data.tracks.items);
      } catch (e) {
        console.error('Error buscando', e);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm, apiBase, authHeaders]);

  // ── onFinish ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!summaryShown) return;
    if (typeof onFinish !== 'function') return;
    const perTrack = perTrackTime.map((t) => ({
      trackId: t.trackId,
      guessed: !!t.guessed,
      timeTaken: Number(t.timeTaken || 0),
    }));
    onFinish({ totalTime, perTrack });
  }, [summaryShown]); 

  // ── Render ────────────────────────────────────────────────────────────────
    return (
      <div className="p-6 bg-slate-50 rounded-xl shadow-lg">
        {!summaryShown ? (
          <>
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-slate-800">
                Canción {index + 1} / {tracks.length}
              </h2>
            </div>

            {playError && (
              <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                {playError}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {playing ? (
                <button
                  onClick={pausePlay}
                  disabled={!!result}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pausar
                </button>
              ) : (
                <button
                  onClick={startPlay}
                  disabled={!ready || !!result}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ready ? 'Reproducir' : 'Cargando...'}
                </button>
              )}
              {confirmingPass ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">¿Seguro?</span>
                  <button
                    onClick={handlePass}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                  >
                    Sí, pasar
                  </button>
                  <button
                    onClick={cancelPass}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePass}
                  disabled={!!result}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pasar
                </button>
              )}
              <button
                onClick={handleGuessClick}
                disabled={!!result}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adivinar
              </button>
            </div>

            {guessing && (
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escribe el nombre de la canción..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <ul className="mt-2 border rounded divide-y bg-white shadow">
                  {searchResults.map((track) => (
                    <li
                      key={track.id}
                      className="p-2 hover:bg-slate-100 cursor-pointer rounded transition"
                      onClick={() => handleSelectGuess(track)}
                    >
                      {track.name} — {track.artists.map((a) => a.name).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between mt-4 text-slate-700">
              <div>
                Tiempo actual:{' '}
                <span className="font-medium">{currentTime.toFixed(3)} s</span>
              </div>
              <div>
                Tiempo total:{' '}
                <span className="font-medium">{totalTime.toFixed(3)} s</span>
              </div>
            </div>
          </>
        ) : (
          // ── Pantalla de resumen ──────────────────────────────────────────────
          <div className="text-center">
            <h3 className="text-xl font-bold mb-3 text-slate-800">Resumen</h3>
            <div className="mb-3 text-slate-700 font-medium">
              Tiempo total: {totalTime.toFixed(3)} s
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {perTrackTime.map((t, i) => {
                const correctArtists = Array.isArray(t.artist)
                  ? t.artist.map((a) => a.name).join(', ')
                  : t.artist;
                const userGuessArtists = t.userGuess?.artists
                  ? t.userGuess.artists.map((a) => a.name).join(', ')
                  : null;

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl shadow-lg border ${t.guessed
                      ? 'border-green-400 bg-green-50'
                      : 'border-red-400 bg-red-50'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      {t.userGuess?.album?.images?.[0] ? (
                        <img
                          src={t.userGuess.album.images[0].url}
                          alt={t.userGuess.name}
                          className="w-20 h-20 rounded-lg shadow"
                        />
                      ) : t.guessed ? (
                        <img
                          src={t.album?.images?.[0]?.url}
                          alt={t.name}
                          className="w-20 h-20 rounded-lg shadow"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-200 rounded-lg flex-shrink-0" />
                      )}

                      <div className="flex-1 text-left">
                        <div className="text-sm text-slate-600">Tu respuesta:</div>
                        {t.userGuess ? (
                          <div className="font-medium">
                            {t.userGuess.name} — {userGuessArtists}
                          </div>
                        ) : t.guessed ? (
                          <div className="font-medium">
                            {t.name} — {correctArtists}
                          </div>
                        ) : (
                          <div className="italic text-slate-500">No respondiste</div>
                        )}
                      </div>
                    </div>

                    {!t.guessed && (
                      <div className="mt-3 flex items-center gap-4">
                        {t.album?.images?.[0] && (
                          <img
                            src={t.album.images[0].url}
                            alt={t.name}
                            className="w-20 h-20 rounded-lg shadow flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 text-left">
                          <div className="text-sm text-slate-600">Correcta era:</div>
                          <div className="font-medium">
                            {t.name} — {correctArtists}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-slate-700 text-sm">
                      {t.skipped
                        ? `Tiempo: ${t.timeTaken.toFixed(3)}s (+${penalty}s por saltar) ⏭️`
                        : t.guessed
                          ? `Tiempo: ${t.timeTaken.toFixed(3)}s ✅`
                          : `Tiempo: ${(t.timeTaken - penalty).toFixed(3)}s (+${penalty}s penalización) ❌`}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center mt-6">
              <a
                href="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Volver a jugar
              </a>
              {sessionId && (
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(`${FRONTEND_URL}/session/${sessionId}`)
                  }
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                >
                  🎯 Reta a tus amigos
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Feedback tras adivinar o pasar ──────────────────────────────────── */}
        {result && (
          <div className="text-center mb-6 mt-4">
            {result.correct ? (
              <>
                <div className="text-green-600 font-semibold text-lg">
                  ✅ ¡Correcto!
                  <div className="mt-2 text-slate-800">
                    La canción era:{' '}
                    <span className="font-medium">
                      {result.correctTrack.name} —{' '}
                      {Array.isArray(result.correctTrack.artists)
                        ? result.correctTrack.artists.map((a) => a.name).join(', ')
                        : result.correctTrack.artists}
                    </span>
                  </div>
                </div>
                {result.correctTrack.album?.images?.[0] && (
                  <img
                    src={result.correctTrack.album.images[0].url}
                    alt={result.correctTrack.name}
                    className="mx-auto mt-3 w-40 h-40 rounded-lg shadow-lg"
                  />
                )}
              </>
            ) : (
              <div className="text-red-600 font-semibold text-lg">
                ❌ Incorrecto.
                <div className="mt-2 text-slate-800">
                  La canción era:{' '}
                  <span className="font-medium">
                    {result.correctTrack.name} —{' '}
                    {Array.isArray(result.correctTrack.artists)
                      ? result.correctTrack.artists.map((a) => a.name).join(', ')
                      : result.correctTrack.artists}
                  </span>
                </div>
                {result.correctTrack.album?.images?.[0] && (
                  <img
                    src={result.correctTrack.album.images[0].url}
                    alt={result.correctTrack.name}
                    className="mx-auto mt-3 w-40 h-40 rounded-lg shadow-lg"
                  />
                )}
              </div>
            )}

            <button
              onClick={next}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    );
  }