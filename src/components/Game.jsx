import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';

export default function Game({ tracks, token, apiBase }) {
  const { player, deviceId, ready } = useSpotifyPlayer(apiBase, token);

  const [index, setIndex] = useState(0);
  const [perTrackTime, setPerTrackTime] = useState([]);
  const [playing, setPlaying] = useState(false);

  const playStartRef = useRef(null);   // cuando empieza el play
  const elapsedRef = useRef(0);        // acumulador por canción
  const [summaryShown, setSummaryShown] = useState(false);

  const current = tracks[index];

  const startPlay = async () => {
    if (!ready || !deviceId) {
      alert('El reproductor no está listo. ¿Eres Premium?');
      return;
    }
    if (!playing) {
      playStartRef.current = Date.now();
      setPlaying(true);
    }

    // reproducir canción completa con SDK
    await axios.put(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      { uris: [current.uri] },
      {
        headers: {
          Authorization: `Bearer ${
            (await axios.get(`${apiBase}/api/me/token`, {
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

  const stopTimerAndRecord = (skipped = false) => {
    // si estaba en play, sumamos lo que quede
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
      guessed: !skipped
    };
    setPerTrackTime(arr);

    // reset acumulador
    elapsedRef.current = 0;
  };

  const handlePass = async () => {
    if (playing) await pausePlay();
    stopTimerAndRecord(true);
    next();
  };

  const handleGuessed = async () => {
    if (playing) await pausePlay();
    stopTimerAndRecord(false);
    next();
  };

  const next = () => {
    if (index + 1 < tracks.length) {
      setIndex(index + 1);
    } else {
      setSummaryShown(true);
    }
  };

  const totalTime = perTrackTime.reduce(
    (acc, t) => acc + t.timeTaken + (t.skipped ? 5 : 0),
    0
  );

  return (
    <div className="p-4 border rounded">
      {!summaryShown ? (
        <>
          <div className="mb-2">
            <div className="font-semibold">
              Canción {index + 1} / {tracks.length}
            </div>
          </div>

          <div className="flex gap-2 items-center mb-4">
            <button onClick={startPlay} className="px-3 py-1 border rounded">
              Reproducir
            </button>
            <button onClick={pausePlay} className="px-3 py-1 border rounded">
              Pausar
            </button>
            <button onClick={handlePass} className="px-3 py-1 bg-red-500 text-white rounded">
              Pasar
            </button>
            <button onClick={handleGuessed} className="px-3 py-1 bg-green-500 text-white rounded">
              Adivinado
            </button>
          </div>

          <div className="mt-4">
            <div className="text-sm">Tiempo acumulado: {totalTime} s</div>
          </div>
        </>
      ) : (
        <div>
          <h3 className="text-lg font-bold mb-2">Resumen</h3>
          <div>Tiempo total: {totalTime}  s</div>
          <ul className="mt-2 text-sm">
            {perTrackTime.map((t, i) => (
              <li key={i}>
                {t.name} — {t.artist} → {t.skipped ? 'Pasada (+5s)' : `${t.timeTaken.toFixed(1)}s`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
