import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config/env';

axios.defaults.withCredentials = true;

// ── Global 401 interceptor — redirect to home on session expiry ───────────────
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear any cached state and bounce to home so the user can re-login.
      // We can't call navigate() here (no React context), so we use location.
      const isAuthRoute = ['/auth/login', '/auth/callback'].some((p) =>
        window.location.pathname.startsWith(p)
      );
      if (!isAuthRoute && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

// ── Shared sub-components ─────────────────────────────────────────────────────

function EqBars() {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-hidden="true">
      {[1,2,3,4,5,6,7].map((i) => (
        <div key={i} className="w-[3px] rounded-full bg-green-400 opacity-80"
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

function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold tracking-widest text-slate-500 uppercase shrink-0">{children}</span>
      <div className="flex-1 h-px bg-slate-800" />
      {action && action}
    </div>
  );
}

// ── Daily card ────────────────────────────────────────────────────────────────

function DailyCard({ daily, onPlay, onLeaderboard }) {
  const dateStr = daily?.dailyDate
    ? new Date(daily.dailyDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Hoy';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/40 via-emerald-500/20 to-slate-900 p-[1px]">
      <div className="relative rounded-2xl bg-slate-900/80 p-6 overflow-hidden">
        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-green-400/5 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest text-green-400 uppercase">Reto del día</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p className="text-white font-black text-lg leading-tight capitalize mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              {dateStr}
            </p>
            {daily ? (
              <p className="text-slate-400 text-sm">
                {daily.tracks?.length ?? 5} canciones ·{' '}
                <span className="text-slate-300">{daily.playerCount ?? 0} jugadores hoy</span>
              </p>
            ) : (
              <p className="text-slate-600 text-sm animate-pulse">Cargando…</p>
            )}
            {daily?.alreadyCompleted && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                ✓ Ya completado hoy
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {daily?.alreadyCompleted ? (
              <button onClick={onLeaderboard}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition hover:scale-105 active:scale-95">
                🏆 Ranking
              </button>
            ) : (
              <button onClick={onPlay} disabled={!daily}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                ▶ Jugar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pack preview card (compact, for home grid) ────────────────────────────────

function PackPreviewCard({ pack, onClick, loading }) {
  const isLocked = !pack.unlocked;
  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`group relative rounded-xl border overflow-hidden transition-all duration-200 ${
        isLocked
          ? 'border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed'
          : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70 cursor-pointer hover:scale-[1.02]'
      }`}
    >
      {/* Cover */}
      <div className="h-24 bg-slate-800 relative overflow-hidden">
        {pack.imageUrl ? (
          <img src={pack.imageUrl} alt={pack.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎵</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        {pack.tier === 'premium' && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-amber-500/90 text-black text-xs font-black rounded-full">PRO</span>
        )}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl opacity-50">🔒</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-black text-slate-100 truncate leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          {pack.name}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{pack.trackCount} canciones</p>
      </div>
      {/* Play overlay on hover */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-green-500/90 flex items-center justify-center shadow-lg">
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="black" className="w-4 h-4 ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Playlist card ─────────────────────────────────────────────────────────────

function PlaylistCard({ pl, onClick, selected }) {
  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
        selected
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
      }`}
    >
      {pl.images?.[0] ? (
        <img src={pl.images[0].url} alt={pl.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-11 h-11 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-500 text-lg">♪</div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${selected ? 'text-green-300' : 'text-slate-100'}`}>{pl.name}</p>
        <p className="text-xs text-slate-500">{pl.tracks.total} canciones</p>
      </div>
      {selected && <span className="text-green-400 flex-shrink-0 text-sm">✓</span>}
    </div>
  );
}

const inputCls  = "w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition disabled:opacity-50";
const selectCls = "w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition disabled:opacity-50";

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]         = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [daily, setDaily]       = useState(null);
  const [packs, setPacks]       = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlistUrl, setPlaylistUrl]     = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [count, setCount]       = useState(5);
  const [penalty, setPenalty]   = useState(5);
  const [creating, setCreating] = useState(false);

  const [playingPack, setPlayingPack] = useState(null); // slug
  const [joinInput, setJoinInput]     = useState('');

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const [meResp, playlistsResp] = await Promise.all([
          axios.get(`${API_BASE}/api/me`),
          axios.get(`${API_BASE}/api/me/playlists`),
        ]);
        setUser({ name: meResp.data.displayName || meResp.data.spotifyId });
        setPlaylists(playlistsResp.data.playlists || []);
        setIsAuthenticated(true);
        // Fire-and-forget secondary fetches
        axios.get(`${API_BASE}/api/daily`).then((r) => setDaily(r.data)).catch(() => {});
        axios.get(`${API_BASE}/api/packs`).then((r) => setPacks(r.data)).catch(() => {});
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };
    check();
  }, []);

  const handleLogin  = (sw = false) => { window.location.href = sw ? `${API_BASE}/auth/login?switch_account=true` : `${API_BASE}/auth/login`; };
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (_) {
    }
    setIsAuthenticated(false);
    setUser(null);
    setPlaylists([]);
    setDaily(null);
    setPacks([]);
  };

  // ── Pack play ─────────────────────────────────────────────────────────────
  const handlePlayPack = useCallback(async (pack) => {
    setPlayingPack(pack.slug);
    try {
      const { data } = await axios.post(`${API_BASE}/api/packs/${pack.slug}/play`);
      navigate(`/session/${data.sessionId}`, {
        state: { gameId: data.gameId, packName: data.packName, packSlug: data.packSlug },
      });
    } catch (e) {
      alert(e.response?.data?.error || 'No se pudo iniciar el pack.');
    } finally {
      setPlayingPack(null);
    }
  }, [navigate]);

  // ── Custom session ────────────────────────────────────────────────────────
  const createSession = async () => {
    const url = selectedPlaylist?.external_urls?.spotify || playlistUrl;
    if (!url) { alert('Selecciona o introduce una playlist.'); return; }
    setCreating(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/session/create`, { playlistUrl: url, isPublic: true, count, penalty });
      navigate(`/session/${resp.data.sessionId}`);
    } catch (e) {
      alert('No se pudo crear la sesión.');
    } finally {
      setCreating(false);
    }
  };

  const joinSession = () => { const s = joinInput.trim(); if (s) navigate(`/session/${s}`); };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap'); @keyframes eq{from{transform:scaleY(.3)}to{transform:scaleY(1)}}`}</style>
        <div className="flex items-center gap-3"><EqBars /><span className="text-slate-400 text-sm">Cargando…</span></div>
      </div>
    );
  }

  const freePacks     = packs.filter((p) => p.unlocked);
  const displayPacks  = freePacks.slice(0, 4); // show up to 4 on home

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap'); @keyframes eq{from{transform:scaleY(.3)}to{transform:scaleY(1)}}`}</style>
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />

      <div className="relative max-w-3xl mx-auto px-6 py-8 pb-16">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <EqBars />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
                Spotify<span className="text-green-400">Quiz</span>
              </h1>
              <p className="text-slate-600 text-xs mt-0.5">Adivina canciones. Reta a tus amigos.</p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-slate-200 font-medium">{user?.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleLogin(true)} className="text-xs text-slate-600 hover:text-slate-400 transition">Cambiar cuenta</button>
                <span className="text-slate-800">·</span>
                <button onClick={handleLogout} className="text-xs text-slate-600 hover:text-slate-400 transition">Salir</button>
              </div>
            </div>
          ) : (
            <button onClick={() => handleLogin(false)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition hover:scale-105 active:scale-95">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Conectar con Spotify
            </button>
          )}
        </header>

        {/* ── 1. DAILY — máxima prioridad visual ── */}
        {isAuthenticated && (
          <section className="mb-10">
            <SectionLabel>Reto del día</SectionLabel>
            <DailyCard
              daily={daily}
              onPlay={() => navigate(`/session/${daily.sessionId}`)}
              onLeaderboard={() => navigate('/leaderboards?tab=daily')}
            />
          </section>
        )}

        {/* ── 2. PACKS — segundo atractivo ── */}
        {isAuthenticated && displayPacks.length > 0 && (
          <section className="mb-10">
            <SectionLabel action={
              <a href="/packs" className="text-xs text-slate-500 hover:text-slate-300 transition shrink-0">
                Ver todos →
              </a>
            }>
              Packs
            </SectionLabel>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {displayPacks.map((pack) => (
                <PackPreviewCard
                  key={pack.id}
                  pack={pack}
                  loading={playingPack === pack.slug}
                  onClick={() => handlePlayPack(pack)}
                />
              ))}
            </div>

            {/* CTA if more packs exist */}
            {packs.length > 4 && (
              <button
                onClick={() => navigate('/packs')}
                className="mt-3 w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 text-sm transition"
              >
                Ver los {packs.length} packs disponibles
              </button>
            )}
          </section>
        )}

        {/* Packs CTA when loading/empty */}
        {isAuthenticated && packs.length === 0 && !authChecking && (
          <section className="mb-10">
            <SectionLabel>Packs</SectionLabel>
            <a href="/packs"
              className="flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50 transition group">
              <div>
                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition">🎮 Explorar packs</p>
                <p className="text-xs text-slate-500 mt-0.5">Colecciones temáticas curadas — cada partida es diferente</p>
              </div>
              <span className="text-slate-600 group-hover:text-slate-400 transition text-lg">→</span>
            </a>
          </section>
        )}

        {/* ── 3. MODO LIBRE — para fidelización ── */}
        {isAuthenticated && (
          <section className="mb-10">
            <SectionLabel>Modo libre</SectionLabel>

            <div className="space-y-3">
              {playlists.length > 0 && (
                <div>
                  <button onClick={() => setShowPlaylists((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800 bg-slate-800/50 hover:border-slate-700 transition text-sm">
                    <span className={selectedPlaylist ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                      {selectedPlaylist ? (
                        <span className="flex items-center gap-2">
                          {selectedPlaylist.images?.[0] && <img src={selectedPlaylist.images[0].url} className="w-5 h-5 rounded" alt="" />}
                          {selectedPlaylist.name}
                        </span>
                      ) : 'Elige una de tus playlists…'}
                    </span>
                    <span className="text-slate-600 text-xs ml-2">{showPlaylists ? '▲' : '▼'}</span>
                  </button>
                  {showPlaylists && (
                    <div className="mt-2 max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
                      {playlists.map((pl) => (
                        <PlaylistCard key={pl.id} pl={pl} selected={selectedPlaylist?.id === pl.id}
                          onClick={() => { setSelectedPlaylist(pl); setPlaylistUrl(''); setShowPlaylists(false); }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input value={playlistUrl}
                onChange={(e) => { setPlaylistUrl(e.target.value); setSelectedPlaylist(null); }}
                disabled={creating} className={inputCls} placeholder="O pega una URL de Spotify…" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 ml-1">Canciones</label>
                  <select value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={creating} className={selectCls}>
                    <option value={3}>3 canciones</option>
                    <option value={5}>5 canciones</option>
                    <option value={10}>10 canciones</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 ml-1">Penalización</label>
                  <div className="relative">
                    <input type="number" min="1" value={penalty}
                      onChange={(e) => setPenalty(Number(e.target.value))}
                      disabled={creating} className={inputCls} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 pointer-events-none">seg</span>
                  </div>
                </div>
              </div>

              <button onClick={createSession}
                disabled={creating || (!selectedPlaylist && !playlistUrl.trim())}
                className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold rounded-xl transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:hover:scale-100 text-sm">
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Creando sesión…
                  </span>
                ) : 'Crear sesión →'}
              </button>
            </div>
          </section>
        )}

        {/* ── Unirse a sesión ── */}
        <section className="mb-10">
          <SectionLabel>Unirse a sesión</SectionLabel>
          <div className="flex gap-2">
            <input value={joinInput} onChange={(e) => setJoinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinSession()}
              placeholder="ID de sesión…" className={inputCls} />
            <button onClick={joinSession} disabled={!joinInput.trim() || !isAuthenticated}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-sm font-semibold rounded-xl transition">
              Jugar
            </button>
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-slate-600 mt-2 ml-1">
              Necesitas conectar Spotify →{' '}
              <button onClick={() => handleLogin(false)} className="text-green-500 hover:text-green-400 underline underline-offset-2 transition">
                Conectar
              </button>
            </p>
          )}
        </section>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-6 pt-5 border-t border-slate-900">
          <a href="/leaderboards" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition">
            <span>🏆</span> Leaderboards
          </a>
          <span className="w-px h-4 bg-slate-800" />
          <span className="text-sm text-slate-700">SpotifyQuiz</span>
        </div>

      </div>
    </div>
  );
}