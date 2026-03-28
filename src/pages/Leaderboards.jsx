// src/pages/Leaderboards.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';
axios.defaults.withCredentials = true;

const TABS = [
  { key: 'daily',   label: '🗓️ Hoy' },
  { key: 'global',  label: '🌍 Global' },
  { key: 'session', label: '🎮 Sesión' },
  { key: 'me',      label: '👤 Personal' },
];

function formatTime(s) {
  if (s == null) return '—';
  return `${s.toFixed(2)}s`;
}

function playlistName(url) {
  if (!url) return null;
  try {
    const id = url.split('playlist/')[1]?.split('?')[0];
    return id ? `Playlist ${id.slice(0, 8)}…` : url;
  } catch { return url; }
}

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

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
    </div>
  );
}

// Shared table wrapper
function LeaderTable({ headers, children, empty }) {
  if (!children || (Array.isArray(children) && !children.filter(Boolean).length)) {
    return <p className="text-center text-slate-500 py-10">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            {headers.map((h) => (
              <th key={h.label} className={`pb-3 pr-4 font-medium ${h.right ? 'text-right' : ''}`}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">{children}</tbody>
      </table>
    </div>
  );
}

// Spinner
function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-slate-500 animate-pulse">{label}</span>
      </div>
    </div>
  );
}

// ── Global tab ────────────────────────────────────────────────────────────────
function GlobalTabLoader() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/leaderboard/global`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Cargando ranking…" />;
  if (!data?.length) return <p className="text-center text-slate-500 py-10">Todavía no hay partidas registradas.</p>;

  return (
    <LeaderTable
      headers={[
        { label: 'Pos.' }, { label: 'Jugador' },
        { label: 'Mejor tiempo', right: true },
        { label: 'Tiempo medio', right: true },
        { label: 'Partidas', right: true },
      ]}
      empty=""
    >
      {data.map((entry, idx) => (
        <tr key={entry.userId} className="hover:bg-slate-800/40 transition">
          <td className="py-3 pr-4 font-semibold text-lg w-10">{medal(idx + 1)}</td>
          <td className="py-3 pr-4 text-slate-100">{entry.displayName}</td>
          <td className="py-3 pr-4 text-right text-slate-300">{formatTime(entry.bestTime)}</td>
          <td className="py-3 pr-4 text-right text-slate-300">{formatTime(entry.avgTime)}</td>
          <td className="py-3 text-right text-slate-500">{entry.gamesPlayed}</td>
        </tr>
      ))}
    </LeaderTable>
  );
}

// ── Session tab ───────────────────────────────────────────────────────────────

// ── Game detail drawer ────────────────────────────────────────────────────────

function TrackResultCard({ t, penalty }) {
  const artistStr = Array.isArray(t.artists)
    ? t.artists.map((a) => a.name ?? a).join(', ')
    : (t.artists ?? '');
  const coverUrl = t.albumJson?.images?.[0]?.url ?? null;

  const baseTime = t.guessed
    ? t.timeTaken
    : t.timeTaken - t.penaltyCost;

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      t.guessed
        ? 'border-green-500/60 bg-green-500/15'
        : 'border-red-500/60 bg-red-500/15'
    }`}>
      <div className="flex items-center gap-4 p-4">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-14 h-14 rounded-xl flex-shrink-0 shadow" />
        ) : (
          <div className="w-14 h-14 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center text-xl">
            {t.guessed ? '✅' : t.skipped ? '⏭️' : '❌'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              t.guessed   ? 'bg-green-500/20 text-green-400' :
              t.skipped   ? 'bg-slate-600/40 text-slate-400' :
                            'bg-red-500/20 text-red-400'
            }`}>
              {t.guessed ? 'Correcto' : t.skipped ? 'Pasada' : 'Fallo'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">{t.name}</p>
          <p className="text-xs text-slate-500 truncate">{artistStr}</p>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-700/40 flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="text-xs text-slate-400 font-mono">{baseTime.toFixed(2)}s</span>
        {!t.guessed && t.penaltyCost > 0 && (
          <span className="text-xs text-red-400 font-mono">
            +{t.penaltyCost}s {t.skipped ? 'por pasar' : 'penalización'}
          </span>
        )}
      </div>
    </div>
  );
}

function GameDetailDrawer({ gameId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true); setError(null); setData(null);
    axios.get(`${API}/api/leaderboard/game/${gameId}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Error cargando la partida.'))
      .finally(() => setLoading(false));
  }, [gameId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[640px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Detalle de partida
            </h2>
            {data && (
              <p className="text-sm text-slate-400 mt-0.5">
                {data.displayName}
                {data.isCurrentUser && <span className="ml-1.5 text-green-400 text-xs">(tú)</span>}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {error && <p className="text-center text-red-400 py-8">{error}</p>}

          {data && !loading && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Tiempo total', value: `${data.totalTime.toFixed(2)}s` },
                  { label: 'Aciertos',     value: `${data.guessed}/${data.total}` },
                  { label: 'Precisión',    value: `${data.accuracy}%` },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 text-center">
                    <div className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Track cards */}
              <div className="space-y-3">
                {data.tracks.map((t, i) => (
                  <TrackResultCard key={t.trackId + i} t={t} penalty={data.penalty} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SessionTab({ sessionId: initialId }) {
  const [inputId, setInputId] = useState(initialId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);

  const fetchSession = async (id) => {
    if (!id?.trim()) return;
    setLoading(true); setError(null);
    try {
      const resp = await axios.get(`${API}/api/leaderboard/session/${id.trim()}`);
      setData(resp.data);
    } catch (e) {
      setError(e.response?.status === 404 ? 'Sesión no encontrada.' : 'Error cargando el ranking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (initialId) fetchSession(initialId); }, [initialId]); // eslint-disable-line

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchSession(inputId)}
          placeholder="ID de sesión..."
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
        <button
          onClick={() => fetchSession(inputId)}
          disabled={loading || !inputId.trim()}
          className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition disabled:opacity-40 text-sm"
        >
          {loading ? '…' : 'Ver'}
        </button>
      </div>

      {error && <p className="text-center text-red-400 py-4">{error}</p>}

      {data && !error && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <p className="text-sm text-slate-500">
              {data.trackCount} canciones · {data.leaderboard.length} jugadores
            </p>
            {data.playlistUrl && (
              <a href={data.playlistUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-green-400 hover:text-green-300 underline underline-offset-2 transition">
                🎵 Ver en Spotify
              </a>
            )}
          </div>

          {!data.leaderboard.length
            ? <p className="text-center text-slate-500 py-10">Nadie ha completado esta sesión todavía.</p>
            : (
              <LeaderTable
                headers={[{ label: 'Pos.' }, { label: 'Jugador' }, { label: 'Tiempo', right: true }, { label: 'Aciertos', right: true }]}
                empty=""
              >
                {data.leaderboard.map((entry) => (
                  <tr
                    key={entry.userId}
                    onClick={() => entry.gameId && setSelectedGameId(entry.gameId)}
                    className={`transition ${entry.gameId ? 'cursor-pointer' : ''} ${entry.isCurrentUser ? 'bg-green-500/10' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className="py-3 pr-4 font-semibold text-lg w-10">{medal(entry.rank)}</td>
                    <td className="py-3 pr-4 text-slate-100">
                      {entry.displayName}
                      {entry.isCurrentUser && <span className="ml-2 text-xs text-green-400 font-normal">(tú)</span>}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-300">{formatTime(entry.totalTime)}</td>
                    <td className="py-3 text-right text-slate-500">
                      <span className="mr-2">{entry.guessed}/{entry.total}</span>
                      {entry.gameId && <span className="text-slate-600 text-xs">→</span>}
                    </td>
                  </tr>
                ))}
              </LeaderTable>
            )
          }
        </>
      )}
      {data?.leaderboard?.length > 0 && (
        <p className="text-xs text-slate-600 mt-3 text-center">Haz click en una fila para ver el detalle de esa partida</p>
      )}

      {selectedGameId && (
        <GameDetailDrawer
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
        />
      )}
    </div>
  );
}

// ── Personal tab ──────────────────────────────────────────────────────────────
// ── Helpers for PersonalTab ───────────────────────────────────────────────────
 
function calcDailyStreak(history) {
  // history assumed sorted newest-first; streak = consecutive days with a daily entry
  const dailyDates = history
    .filter((g) => g.source === 'daily')
    .map((g) => new Date(g.playedAt).toDateString());
  if (!dailyDates.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dailyDates.includes(d.toDateString())) streak++;
    else if (i > 0) break; // gap found
  }
  return streak;
}
 
function StatsGrid({ history }) {
  const allStats = (arr) => {
    if (!arr.length) return null;
    const times = arr.map((g) => g.totalTime).filter(Boolean);
    return {
      count: arr.length,
      best: times.length ? Math.min(...times) : null,
      avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
      accuracy: Math.round(arr.reduce((a, g) => a + (g.accuracy || 0), 0) / arr.length),
    };
  };
 
  const all    = allStats(history);
  const daily  = allStats(history.filter((g) => g.source === 'daily'));
  const pack   = allStats(history.filter((g) => g.source === 'pack'));
  const custom = allStats(history.filter((g) => g.source === 'custom'));
  const streak = calcDailyStreak(history);
 
  return (
    <div className="mb-8 space-y-3">
      {/* Top row — global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Partidas totales', value: all?.count ?? 0 },
          { label: 'Mejor tiempo',     value: formatTime(all?.best) },
          { label: 'Tiempo medio',     value: formatTime(all?.avg) },
          { label: 'Precisión media',  value: `${all?.accuracy ?? 0}%` },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
 
      {/* Second row — daily / pack / custom + streak */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-purple-300" style={{ fontFamily: "'Syne', sans-serif" }}>{daily?.count ?? 0}</div>
          <div className="text-xs text-purple-400/70 mt-0.5">Daily jugadas</div>
          {daily && <div className="text-xs text-slate-500 mt-1">Media {formatTime(daily.avg)}</div>}
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-blue-300" style={{ fontFamily: "'Syne', sans-serif" }}>{pack?.count ?? 0}</div>
          <div className="text-xs text-blue-400/70 mt-0.5">Packs jugados</div>
          {pack && <div className="text-xs text-slate-500 mt-1">Media {formatTime(pack.avg)}</div>}
        </div>
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-teal-300" style={{ fontFamily: "'Syne', sans-serif" }}>{custom?.count ?? 0}</div>
          <div className="text-xs text-teal-400/70 mt-0.5">Custom jugadas</div>
          {custom && <div className="text-xs text-slate-500 mt-1">Media {formatTime(custom.avg)}</div>}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-amber-300" style={{ fontFamily: "'Syne', sans-serif" }}>{streak} 🔥</div>
          <div className="text-xs text-amber-400/70 mt-0.5">Racha diaria</div>
          <div className="text-xs text-slate-500 mt-1">{streak > 0 ? 'días seguidos' : 'sin racha activa'}</div>
        </div>
      </div>
    </div>
  );
}
 
function GameCard({ g, onClickSession, onClickDaily, onClickPack }) {
  const isDaily  = g.source === 'daily';
  const isPack   = g.source === 'pack';
  const dateStr  = new Date(g.playedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
 
  const handleClick = isDaily ? onClickDaily : isPack ? onClickPack : onClickSession;
 
  const cardStyle = isDaily
    ? 'bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20 hover:border-purple-500/50'
    : isPack
      ? 'bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20 hover:border-blue-500/50'
      : 'bg-teal-800/20 border-teal-700/50 hover:bg-teal-800/40 hover:border-teal-600/50';
 
  const badgeStyle = isDaily
    ? 'bg-purple-500/20 text-purple-300'
    : isPack
      ? 'bg-blue-500/20 text-blue-300'
      : 'bg-teal-500/20 text-teal-300';
 
  const arrowColor = isDaily ? 'text-purple-400' : isPack ? 'text-blue-400' : 'text-teal-400';
  const arrowLabel = isDaily ? 'Ver ranking →' : isPack ? 'Ver sesión →' : 'Ver sesión →';
 
  const badgeLabel = isDaily ? '🗓️ Daily' : isPack ? '📦 Pack' : '🎧 Custom';
 
  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] ${cardStyle}`}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${badgeStyle}`}>
          {badgeLabel}
        </span>
        <span className="text-xs text-slate-600">{dateStr}</span>
      </div>
 
      {/* Main stats row */}
      <div className="flex items-center gap-4 px-4 pb-3">
        <div className={`relative w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black ${
          g.accuracy === 100 ? 'bg-green-500/20 text-green-400' :
          g.accuracy >= 60  ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
        }`} style={{ fontFamily: "'Syne', sans-serif" }}>
          {g.accuracy}%
        </div>
 
        <div className="flex-1 min-w-0">
          {isDaily ? (
            <p className="text-sm font-semibold text-purple-300 truncate">
              {g.dailyDate
                ? new Date(g.dailyDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Reto del día'}
            </p>
          ) : isPack ? (
            <p className="text-sm font-semibold text-blue-300 truncate">
              {g.packName ?? 'Pack'}
            </p>
          ) : g.playlistUrl ? (
            <span className="block truncate">
              <a
                href={g.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-green-400 hover:text-green-300 underline underline-offset-2 transition inline"
              >
                🎵 {playlistName(g.playlistUrl)}
              </a>
            </span>
          ) : (
            <p className="text-sm text-slate-500 truncate">Sesión personalizada</p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">{g.guessed}/{g.total} canciones acertadas</p>
        </div>
 
        <div className="text-right shrink-0">
          <p className="text-sm font-mono font-semibold text-slate-100">{formatTime(g.totalTime)}</p>
          <p className={`text-xs mt-0.5 transition ${arrowColor} opacity-0 group-hover:opacity-100`}>
            {arrowLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
 
function PersonalTab({ onNavigateToSession, onNavigateToDaily }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
 
  useEffect(() => {
    axios.get(`${API}/api/leaderboard/me`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) return <Spinner label="Cargando historial…" />;
  if (!data?.history?.length) return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">🎵</div>
      <p className="text-slate-500">Todavía no has completado ninguna partida.</p>
    </div>
  );
 
  const { history } = data;
  const filtered = filter === 'all'    ? history
    : filter === 'daily'  ? history.filter((g) => g.source === 'daily')
    : filter === 'pack'   ? history.filter((g) => g.source === 'pack')
    : history.filter((g) => g.source === 'custom');
 
  return (
    <div>
      <StatsGrid history={history} />
 
      {/* Filter pills */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'all',    label: 'Todas',   count: history.length },
          { key: 'daily',  label: '🗓️ Daily', count: history.filter((g) => g.source === 'daily').length },
          { key: 'pack',   label: '📦 Packs',  count: history.filter((g) => g.source === 'pack').length },
          { key: 'custom', label: '🎧 Custom', count: history.filter((g) => g.source === 'custom').length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
              filter === f.key
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>
 
      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No hay partidas en esta categoría.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <GameCard
              key={g.gameId}
              g={g}
              onClickSession={() => onNavigateToSession(g.sessionId)}
              onClickDaily={onNavigateToDaily}
              onClickPack={() => onNavigateToSession(g.sessionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Daily tab ─────────────────────────────────────────────────────────────────
function DailyTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/daily`)
      .then(async ({ data: daily }) => {
        const lb = await axios.get(`${API}/api/leaderboard/session/${daily.sessionId}`);
        setData({ ...lb.data, dailyDate: daily.dailyDate, playerCount: daily.playerCount, sessionId: daily.sessionId });
      })
      .catch((e) => {
        setError(e.response?.status === 401 ? 'Inicia sesión para ver el reto de hoy.' : 'Error cargando el reto diario.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Cargando reto de hoy…" />;
  if (error)   return <p className="text-center text-red-400 py-8">{error}</p>;

  const dateStr = data?.dailyDate
    ? new Date(data.dailyDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Hoy';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="font-bold text-slate-100 capitalize">{dateStr}</p>
          <p className="text-sm text-slate-500">{data?.trackCount} canciones · {data?.playerCount} jugadores hoy</p>
        </div>
        <button
          onClick={() => navigate(`/session/${data?.sessionId}`)}
          className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition text-sm"
        >
          ▶ Jugar el reto
        </button>
      </div>

      {!data?.leaderboard?.length
        ? <p className="text-center text-slate-500 py-10">Sé el primero en completar el reto de hoy.</p>
        : (
          <LeaderTable
            headers={[{ label: 'Pos.' }, { label: 'Jugador' }, { label: 'Tiempo', right: true }, { label: 'Aciertos', right: true }]}
            empty=""
          >
            {data.leaderboard.map((entry) => (
              <tr
                key={entry.userId}
                onClick={() => entry.gameId && setSelectedGameId(entry.gameId)}
                className={`transition ${entry.gameId ? 'cursor-pointer' : ''} ${entry.isCurrentUser ? 'bg-green-500/10' : 'hover:bg-slate-800/40'}`}
              >
                <td className="py-3 pr-4 font-semibold text-lg w-10">{medal(entry.rank)}</td>
                <td className="py-3 pr-4 text-slate-100">
                  {entry.displayName}
                  {entry.isCurrentUser && <span className="ml-2 text-xs text-green-400 font-normal">(tú)</span>}
                </td>
                <td className="py-3 pr-4 text-right text-slate-300">{formatTime(entry.totalTime)}</td>
                <td className="py-3 text-right text-slate-500">
                  <span className="mr-2">{entry.guessed}/{entry.total}</span>
                  {entry.gameId && <span className="text-slate-600 text-xs">→</span>}
                </td>
              </tr>
            ))}
          </LeaderTable>
        )
      }

      {selectedGameId && (
        <GameDetailDrawer
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Leaderboards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionFromUrl = searchParams.get('session');
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl || (sessionFromUrl ? 'session' : 'daily');

  const handleTab = (key) => {
    if (key === 'session') {
      setSearchParams((prev) => { prev.set('tab', key); return prev; });
    } else {
      setSearchParams({ tab: key });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
      `}</style>

      {/* Noise texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />

      <div className="relative max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <a href="/" className="flex items-center gap-3">
            <EqBars />
            <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Spotify<span className="text-green-400">Quiz</span>
            </span>
          </a>
          <a href="/" className="text-sm text-slate-400 hover:text-slate-200 transition">← Inicio</a>
        </header>

        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Syne', sans-serif" }}>
          🏆 Leaderboards
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-800/60 border border-slate-700/50 p-1 rounded-2xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
                activeTab === t.key
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'daily'   && <DailyTab />}
          {activeTab === 'global'  && <GlobalTabLoader />}
          {activeTab === 'session' && <SessionTab sessionId={sessionFromUrl} />}
          {activeTab === 'me'      && (
            <PersonalTab
              onNavigateToSession={(sid) => setSearchParams({ tab: 'session', session: sid })}
              onNavigateToDaily={() => setSearchParams({ tab: 'daily' })}
            />
          )}
        </div>
      </div>
    </div>
  );
}