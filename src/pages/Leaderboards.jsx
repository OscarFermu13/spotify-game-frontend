// src/pages/Leaderboards.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';
axios.defaults.withCredentials = true;

const TABS = [
  { key: 'global', label: '🌍 Global' },
  { key: 'session', label: '🎮 Sesión' },
  { key: 'me', label: '👤 Personal' },
];

function formatTime(seconds) {
  if (seconds == null) return '—';
  return `${seconds.toFixed(2)}s`;
}

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// ── Global tab ───────────────────────────────────────────────────────────────
function GlobalTab({ data }) {
  if (!data?.length) {
    return (
      <p className="text-center text-slate-500 py-8">
        Todavía no hay partidas registradas.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="pb-2 pr-4">Pos.</th>
            <th className="pb-2 pr-4">Jugador</th>
            <th className="pb-2 pr-4 text-right">Mejor tiempo</th>
            <th className="pb-2 pr-4 text-right">Tiempo medio</th>
            <th className="pb-2 text-right">Partidas</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((entry, idx) => (
            <tr key={entry.userId} className="hover:bg-slate-50 transition">
              <td className="py-3 pr-4 font-semibold text-lg w-10">
                {medal(idx + 1)}
              </td>
              <td className="py-3 pr-4 font-medium text-slate-800">
                {entry.displayName}
              </td>
              <td className="py-3 pr-4 text-right text-slate-700">
                {formatTime(entry.bestTime)}
              </td>
              <td className="py-3 pr-4 text-right text-slate-700">
                {formatTime(entry.avgTime)}
              </td>
              <td className="py-3 text-right text-slate-500">
                {entry.gamesPlayed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Session tab ──────────────────────────────────────────────────────────────
function SessionTab({ sessionId: initialId }) {
  const [inputId, setInputId] = useState(initialId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(`${API}/api/leaderboard/session/${id.trim()}`);
      setData(resp.data);
    } catch (e) {
      setError(e.response?.status === 404
        ? 'Sesión no encontrada.'
        : 'Error cargando el ranking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) fetch(initialId);
  }, [initialId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetch(inputId)}
          placeholder="ID de sesión..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
        <button
          onClick={() => fetch(inputId)}
          disabled={loading || !inputId.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-semibold"
        >
          {loading ? 'Buscando...' : 'Ver ranking'}
        </button>
      </div>

      {error && (
        <p className="text-center text-red-500 py-4">{error}</p>
      )}

      {data && !error && (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {data.trackCount} canciones · {data.leaderboard.length} jugadores
          </p>
          {data.leaderboard.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nadie ha completado esta sesión todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2 pr-4">Pos.</th>
                    <th className="pb-2 pr-4">Jugador</th>
                    <th className="pb-2 pr-4 text-right">Tiempo</th>
                    <th className="pb-2 text-right">Aciertos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.leaderboard.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`transition ${
                        entry.isCurrentUser
                          ? 'bg-blue-50 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 pr-4 font-semibold text-lg w-10">
                        {medal(entry.rank)}
                      </td>
                      <td className="py-3 pr-4 text-slate-800">
                        {entry.displayName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-500 font-normal">
                            (tú)
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-700">
                        {formatTime(entry.totalTime)}
                      </td>
                      <td className="py-3 text-right text-slate-500">
                        {entry.guessed}/{entry.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Personal tab ─────────────────────────────────────────────────────────────
function PersonalTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API}/api/leaderboard/me`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-center text-slate-500 py-8 animate-pulse">
        Cargando historial...
      </p>
    );
  }

  if (!data?.history?.length) {
    return (
      <p className="text-center text-slate-500 py-8">
        Todavía no has completado ninguna partida.
      </p>
    );
  }

  const { stats, history } = data;

  return (
    <div>
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Partidas', value: stats.gamesPlayed },
            { label: 'Mejor tiempo', value: formatTime(stats.bestTime) },
            { label: 'Tiempo medio', value: formatTime(stats.avgTime) },
            { label: 'Precisión media', value: `${stats.avgAccuracy}%` },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-slate-50 border rounded-xl p-3 text-center"
            >
              <div className="text-xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* History table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2 pr-4">Fecha</th>
              <th className="pb-2 pr-4 text-right">Tiempo</th>
              <th className="pb-2 pr-4 text-right">Aciertos</th>
              <th className="pb-2 text-right">Precisión</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map((g) => (
              <tr
                key={g.gameId}
                onClick={() => navigate(`/leaderboards?session=${g.sessionId}`)}
                className="hover:bg-slate-50 cursor-pointer transition"
                title="Ver ranking de esta sesión"
              >
                <td className="py-3 pr-4 text-slate-600">
                  {new Date(g.playedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-slate-800">
                  {formatTime(g.totalTime)}
                </td>
                <td className="py-3 pr-4 text-right text-slate-600">
                  {g.guessed}/{g.total}
                </td>
                <td className="py-3 text-right text-slate-600">
                  {g.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Leaderboards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionFromUrl = searchParams.get('session');

  // If a session ID is in the URL, open the session tab directly
  const [activeTab, setActiveTab] = useState(
    sessionFromUrl ? 'session' : 'global'
  );

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key !== 'session') {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">
            🏆 Leaderboards
          </h1>
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← Volver
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'global' && <GlobalTabLoader />}
        {activeTab === 'session' && (
          <SessionTab sessionId={sessionFromUrl} />
        )}
        {activeTab === 'me' && <PersonalTab />}
      </div>
    </div>
  );
}

// Lazy-loads global data only when that tab is active
function GlobalTabLoader() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/api/leaderboard/global`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-center text-slate-500 py-8 animate-pulse">
        Cargando ranking...
      </p>
    );
  }

  return <GlobalTab data={data} />;
}