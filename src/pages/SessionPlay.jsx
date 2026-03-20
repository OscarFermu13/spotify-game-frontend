import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Game from '../components/Game';

axios.defaults.withCredentials = true;

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';

const DEFAULT_PENALTY = 5;

export default function SessionPlay() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const loadAndJoinSession = async () => {
      try {
        setLoading(true);

        // Obtener la sesión (La cookie HttpOnly va sola, no hace falta header)
        const sessionResp = await axios.get(`${API}/api/session/${sessionId}`);
        setSession(sessionResp.data);

        // Unirse a la partida (crea el Game para el usuario)
        const joinResp = await axios.post(`${API}/api/session/${sessionId}/join`);

        // Manejamos posibles variantes en la respuesta del backend
        setGameId(joinResp.data.gameId || joinResp.data.id || joinResp.data.game?.id);
      } catch (e) {
        console.error('Error cargando sesión:', e);
        if (e.response?.status === 401) {
          // Si da 401, no está autenticado o la cookie expiró
          alert('Debes iniciar sesión con Spotify para jugar.');
          navigate('/');
        } else {
          setError('No se pudo cargar la sesión. Verifica que el ID sea correcto.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadAndJoinSession();
    }
  }, [sessionId, navigate]);

  const handleFinish = async ({ totalTime, perTrack }) => {
    setFinished(true);

    // Save results to backend
    if (gameId) {
      try {
        await axios.post(`${API}/api/game/save`, {
          gameId,
          totalTime,
          tracks: perTrack,
        });
      } catch (e) {
        console.error('Error guardando partida:', e.response?.data || e.message);
      }
    }
  };

  // Pantalla de carga mientras resuelve las peticiones
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-xl font-semibold text-slate-600 animate-pulse">
          Cargando partida...
        </div>
      </div>
    );
  }

  // Pantalla de error si la sesión no existe
  if (error || !session || !gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
          <p className="text-red-600 font-semibold mb-6 text-lg">
            {error || 'Error al cargar la partida.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Adaptar tracks del formato de SessionTrack (backend) al formato
  // que espera Game.jsx: { id, name, artists, uri, album, duration_ms }
  const tracks = session.tracks?.map((t) => ({
    id: t.trackId,
    name: t.name,
    artists: t.artists,
    uri: t.uri,
    album: t.albumJson,
    duration_ms: t.durationMs,
  })) ?? [];

  // Información de la sesión para mostrar al jugador
  const ownerName = session.owner?.displayName || 'Alguien';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">

        {/* Cabecera con info de la sesión */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-1">
            🎧 Spotify Quiz
          </h1>
        </div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">
            Sesión creada por{' '}
            <span className="font-semibold text-slate-700">{ownerName}</span>
            {' · '}
            {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
          </p>
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← Volver
          </a>
        </div>

        {/* Juego */}
        <Game
          tracks={tracks}
          penalty={DEFAULT_PENALTY}
          token={null}
          apiBase={API}
          gameId={gameId}
          sessionId={sessionId}
          onFinish={handleFinish}
        />

        {/* Show leaderboard button once game is finished */}
        {finished && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() =>
                navigate(`/leaderboards?session=${sessionId}`)
              }
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow transition"
            >
              🏆 Ver ranking de esta sesión
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}