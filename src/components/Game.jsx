import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';

export default function Game({ tracks, penalty, token, apiBase }) {
  const { player, deviceId, ready } = useSpotifyPlayer(apiBase, token);

  const [index, setIndex] = useState(0);
  const [perTrackTime, setPerTrackTime] = useState([]);
  const [playing, setPlaying] = useState(false);

  const playStartRef = useRef(null);   // cuando empieza el play
  const elapsedRef = useRef(0);        // acumulador por canción
  const [currentTime, setCurrentTime] = useState(0); // estado que pintamos en pantalla
  const [summaryShown, setSummaryShown] = useState(false);

  const [guessing, setGuessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);

  const current = tracks[index];

  // Intervalo para actualizar el contador visible
  useEffect(() => {
    let interval = null;
    if (playing) {
      interval = setInterval(() => {
        if (playStartRef.current) {
          const elapsed = elapsedRef.current + (Date.now() - playStartRef.current) / 1000;
          setCurrentTime(elapsed);
        }
      }, 1); // refresco cada 1ms
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [playing]);

  const startPlay = async () => {
    if (!ready || !deviceId) {
      alert('El reproductor no está listo. ¿Eres Premium?');
      return;
    }
    if (!playing) {
      playStartRef.current = Date.now();
      setPlaying(true);
      elapsedRef.current = 0;
    }

    // reproducir canción completa con SDK
    await axios.put(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      { uris: [current.uri] },
      {
        headers: {
          Authorization: `Bearer ${(await axios.get(`${apiBase}/api/me/token`, {
            headers: { Authorization: `Bearer ${token}` }
          })).data.accessToken
            }`
        }
      }
    );
  };

  const pausePlay = async () => {
    if (!playing) return;
    setPlaying(false);

    // acumula el tiempo hasta ahora
    if (playStartRef.current) {
      elapsedRef.current += (Date.now() - playStartRef.current) / 1000;
      playStartRef.current = null;
    }

    await player.pause();
  };

  const stopTimerAndRecord = (guessedCorrect, skipped = false) => {
    if (playStartRef.current) {
      elapsedRef.current += (Date.now() - playStartRef.current) / 1000;
      playStartRef.current = null;
    }

    const arr = [...perTrackTime];
    arr[index] = {
      trackId: current.id,
      name: current.name,
      artist: current.artists,
      timeTaken: elapsedRef.current,
      skipped,
      guessed: guessedCorrect
    };
    setPerTrackTime(arr);

    elapsedRef.current = 0;
    setCurrentTime(0);
  };

  const handlePass = async () => {
    if (playing) await pausePlay();
    stopTimerAndRecord(false, true);
    next();
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.length > 2) {
        const accessToken = (await axios.get(`${apiBase}/api/me/token`, {
          headers: { Authorization: `Bearer ${token}` }
        })).data.accessToken;

        const res = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=5`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setSearchResults(res.data.tracks.items);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, apiBase, token]);

  const handleGuessClick = async () => {
    if (playing) await pausePlay();
    setGuessing(true);
  };

  const handleSelectGuess = (guess) => {
    let guessedCorrect = guess.name === current.name;
    stopTimerAndRecord(guessedCorrect, false);

    // penalización si falla
    if (!guessedCorrect) {
      setPerTrackTime((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          timeTaken: (updated[index]?.timeTaken || 0) + penalty
        };
        return updated;
      });
    }

    setResult({
      correct: guessedCorrect,
      correctTrack: current
    });

    setGuessing(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const next = () => {
    if (index + 1 < tracks.length) {
      setIndex(index + 1);
    } else {
      setSummaryShown(true);
    }
  };

  const totalTime = perTrackTime.reduce(
    (acc, t) => acc + t.timeTaken + (t.skipped ? penalty : 0),
    0
  );

  return (
    <div className="p-6 bg-slate-50 rounded-xl shadow-lg">
      {!summaryShown ? (
        <>
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-slate-800">Canción {index + 1} / {tracks.length}</h2>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-4">
            {playing ? (
              <button onClick={pausePlay} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Pausar</button>
            ) : (
              <button onClick={startPlay} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Reproducir</button>
            )}
            <button onClick={handlePass} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Pasar</button>
            <button onClick={handleGuessClick} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">Adivinar</button>
          </div>

          {guessing && (
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escribe el nombre de la canción..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
            <div>Tiempo actual: <span className="font-medium">{currentTime.toFixed(3)} s</span></div>
            <div>Tiempo total: <span className="font-medium">{totalTime.toFixed(3)} s</span></div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-3 text-slate-800">Resumen</h3>
          <div className="mb-3 text-slate-700 font-medium">Tiempo total: {totalTime.toFixed(3)} s</div>
          <ul className="text-left max-w-2xl mx-auto mb-4 bg-white p-4 rounded-lg shadow divide-y">
            {perTrackTime.map((t, i) => (
              <li key={i} className="py-1">
                {t.name} — {t.artist} →{' '}
                {t.skipped
                  ? `${t.timeTaken.toFixed(3)}s (+${penalty}s) ⏭️ ❌`
                  : t.guessed
                    ? `${t.timeTaken.toFixed(3)}s ✅`
                    : `${(t.timeTaken - penalty).toFixed(3)}s (+${penalty}s) ❌`}
              </li>
            ))}
          </ul>
          <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Volver a jugar</a>
        </div>
      )}

      {result && (
        <div className="text-center mb-4">
          {result.correct ? (
            <div className="text-green-600 font-semibold text-lg">
              ✅ ¡Correcto!
            </div>
          ) : (
            <div className="text-red-600 font-semibold text-lg">
              ❌ Incorrecto. La canción era:
              <span className="ml-2">{result.correctTrack.name} — {result.correctTrack.artists}</span>
            </div>
          )}
          <button
            onClick={() => { setResult(null); next(); }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
