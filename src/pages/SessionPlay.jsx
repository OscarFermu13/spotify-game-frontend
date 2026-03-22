import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Game from '../components/Game';

axios.defaults.withCredentials = true;

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';
const DEFAULT_PENALTY = 5;

function EqBars() {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-hidden="true">
      {[1,2,3,4,5,6,7].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-green-400 opacity-80"
          style={{
            height: `${30 + (i * 17) % 70}%`,
            animation: `eq ${0.6 + i * 0.13}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
      <style>{`@keyframes eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
      <div className="relative max-w-3xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-10">
          <a href="/" className="flex items-center gap-3">
            <EqBars />
            <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Spotify<span className="text-green-400">Quiz</span>
            </span>
          </a>
          <a href="/" className="text-sm text-slate-400 hover:text-slate-200 transition">← Inicio</a>
        </header>
        {children}
      </div>
    </div>
  );
}
 
function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-slate-400">{label}</span>
      </div>
    </div>
  );
}

export default function SessionPlay() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [penalty, setPenalty] = useState(DEFAULT_PENALTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finished, setFinished] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    const loadAndJoinSession = async () => {
      try {
        setLoading(true);
        const sessionResp = await axios.get(`${API}/api/session/${sessionId}`);
        setSession(sessionResp.data);

        let gameId, completed;
        if (sessionResp.data.source === 'daily') {
          const dailyResp = await axios.get(`${API}/api/daily`);
          gameId = dailyResp.data.gameId;
          completed = dailyResp.data.alreadyCompleted;
        } else {
          const joinResp = await axios.post(`${API}/api/session/${sessionId}/join`);
          gameId = joinResp.data.gameId || joinResp.data.id || joinResp.data.game?.id;
          completed = false;
        }
 
        setGameId(gameId);
        setPenalty(sessionResp.data.penalty || DEFAULT_PENALTY);
        setAlreadyCompleted(completed);
      } catch (e) {
        console.error('Error cargando sesión:', e);
        if (e.response?.status === 401) {
          // Si da 401, no está autenticado o la cookie expiró
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
 if (loading) return <Layout><Spinner label="Cargando partida…" /></Layout>;
 
  if (error || !session || !gameId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Sesión no encontrada</h2>
          <p className="text-slate-400 mb-8">{error || 'Error al cargar la partida.'}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition">
            Volver al inicio
          </button>
        </div>
      </Layout>
    );
  }
 
  const isDaily = session.source === 'daily';
  const ownerName = session.owner?.displayName || 'Alguien';
  const tracks = (session.tracks ?? []).map((t) => ({
    id: t.trackId, name: t.name, artists: t.artists,
    uri: t.uri, album: t.albumJson, duration_ms: t.durationMs,
  }));
 
  if (isDaily && alreadyCompleted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-5">🏆</div>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Ya jugaste el reto de hoy</h2>
          <p className="text-slate-400 mb-8 max-w-sm">Vuelve mañana para un nuevo reto. Mientras tanto, ¿cómo quedaste en el ranking?</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/leaderboards')} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition">
              🏆 Ver ranking de hoy
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition">
              Volver al inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }
 
  return (
    <Layout>
      <div className="mb-6">
        {isDaily && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest text-green-400 uppercase">Reto del día</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        )}
        <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          {isDaily ? 'Reto de hoy' : `Sesión de ${ownerName}`}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
          {!isDaily && ` · Creada por ${ownerName}`}
        </p>
      </div>
 
      <div className="h-px bg-slate-800 mb-8" />
 
      <Game
        tracks={tracks}
        penalty={DEFAULT_PENALTY}
        token={null}
        apiBase={API}
        gameId={gameId}
        sessionId={sessionId}
        onFinish={handleFinish}
      />
 
      {finished && (
        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(`/leaderboards?session=${sessionId}`)} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition">
            🏆 Ver ranking de esta sesión
          </button>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition">
            Volver al inicio
          </button>
        </div>
      )}
    </Layout>
  );
}