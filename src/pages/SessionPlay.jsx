import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/env';

import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import PostGameActions from '../components/sessionPlay/PostGameActions';
import Game from '../components/Game';
import useSessionLoad from '../hooks/useSessionLoad';

axios.defaults.withCredentials = true;

export default function SessionPlay() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const { session, gameId, penalty, packName, alreadyCompleted, loading, error } = useSessionLoad(sessionId);

  const [finished, setFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const handleFinish = async ({ totalTime, perTrack }) => {
    setFinished(true);
    setGameResult({ totalTime, perTrack });
    if (gameId) {
      try {
        await axios.post(`${API_BASE}/api/game/save`, { gameId, totalTime, tracks: perTrack });
      } catch (e) {
        console.error('Error guardando partida:', e.response?.data || e.message);
      }
    }
  };

  // ── Estados de carga y error ───────────────────────────────────────────────

  if (loading) return <Layout><Spinner label="Cargando partida…" /></Layout>;

  if (error || !session || !gameId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sesión no encontrada
          </h2>
          <p className="text-slate-400 mb-8">{error || 'Error al cargar la partida.'}</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition">
            Volver al inicio
          </button>
        </div>
      </Layout>
    );
  }

  const isDaily = session.source === 'daily';
  const isPack = session.source === 'pack';
  const ownerName = session.owner?.displayName || 'Alguien';

  const tracks = (session.tracks ?? []).map((t) => ({
    id: t.trackId,
    name: t.name,
    artists: t.artists,
    uri: t.uri,
    album: t.albumJson,
    duration_ms: t.durationMs,
  }));

  // ── Ya completado (solo daily) ─────────────────────────────────────────────

  if (isDaily && alreadyCompleted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-5">🏆</div>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Ya jugaste el reto de hoy
          </h2>
          <p className="text-slate-400 mb-8 max-w-sm">
            Vuelve mañana para un nuevo reto. Mientras tanto, ¿cómo quedaste en el ranking?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/leaderboards')}
              className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition">
              🏆 Ver ranking de hoy
            </button>
            <button onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition">
              Volver al inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Partida ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="mb-6">
        {isDaily && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest text-green-400 uppercase">Reto del día</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        )}
        {isPack && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">🎮 Pack</span>
          </div>
        )}
        <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          {isDaily ? 'Reto de hoy' : isPack ? (packName ?? 'Pack') : `Sesión de ${ownerName}`}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
          {!isDaily && ` · Creada por ${ownerName}`}
        </p>
      </div>

      <div className="h-px bg-slate-800 mb-8" />

      <Game
        tracks={tracks}
        penalty={penalty}
        apiBase={API_BASE}
        gameId={gameId}
        sessionId={sessionId}
        onFinish={handleFinish}
        postGameSlot={finished && gameResult ? (
          <PostGameActions
            isDaily={isDaily}
            isPack={isPack}
            packName={packName}
            sessionId={sessionId}
            gameResult={gameResult}
            onLeaderboard={() => {
              if (isDaily) navigate('/leaderboards?tab=daily');
              else if (isPack) navigate('/packs');
              else navigate(`/leaderboards?tab=session&session=${sessionId}`);
            }}
            onHome={() => navigate('/')}
          />
        ) : null}
      />
    </Layout>
  );
}