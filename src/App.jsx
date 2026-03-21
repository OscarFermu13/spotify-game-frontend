import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';

axios.defaults.withCredentials = true;

function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true); 

  const [playlistUrl, setPlaylistUrl] = useState('');
  const [count, setCount] = useState(5);
  const [penalty, setPenalty] = useState(5);
  const [joinInput, setJoinInput] = useState('');

  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [meResp, playlistsResp] = await Promise.all([
          axios.get(`${API}/api/me`),
          axios.get(`${API}/api/me/playlists`),
        ]);
        setUser({ name: meResp.data.displayName || meResp.data.spotifyId });
        setPlaylists(playlistsResp.data.playlists || []);
        setIsAuthenticated(true);

        // Load daily challenge info (non-blocking)
        axios.get(`${API}/api/daily`)
          .then((r) => setDaily(r.data))
          .catch(() => {}); // silently ignore if daily is unavailable
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (switchAccount = false) => {
    const url = switchAccount
      ? `${API}/auth/login?switch_account=true`
      : `${API}/auth/login`;
    window.location.href = url;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setPlaylists([]);
    // TODO: POST /auth/logout para limpiar la cookie HttpOnly en el servidor
  };

  // ── Sesiones ──────────────────────────────────────────────────────────────
  const createSession = async () => {
    if (!playlistUrl) {
      alert('Introduce la URL de una playlist.');
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post(`${API}/api/session/create`, {
        playlistUrl,
        isPublic: true,
        count,
        penalty,
      });
      navigate(`/session/${resp.data.sessionId}`);
    } catch (e) {
      console.error(e);
      alert('No se pudo crear la sesión.');
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    const sid = joinInput.trim();
    if (!sid) return;
    navigate(`/session/${sid}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Pantalla de carga mientras se verifica la cookie — evita un flash
  // del botón "Conectar con Spotify" para usuarios ya autenticados
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-xl font-semibold text-slate-600 animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-slate-800">
          🎧 Spotify Quiz
        </h1>

        {/* ── Auth banner ── */}
        {!isAuthenticated ? (
          <div className="text-center mb-6">
            <p className="mb-4 text-slate-600">
              Conéctate con Spotify para poder reproducir canciones con Web Playback SDK.
            </p>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleLogin(false)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-lg shadow"
              >
                Conectar con Spotify
              </button>
              <button
                onClick={() => handleLogin(true)}
                className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition"
              >
                Usar otra cuenta
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-lg border">
            <p className="text-slate-700">
              ✅ Conectado como{' '}
              <span className="font-semibold">{user?.name}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLogin(true)}
                className="px-3 py-1 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition"
              >
                Cambiar cuenta
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1 border rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* ── Reto del día ── */}
        {isAuthenticated && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🗓️</span>
                    <span className="font-extrabold text-lg">Reto de hoy</span>
                  </div>
                  {daily ? (
                    <p className="text-green-100 text-sm">
                      {daily.tracks?.length ?? 5} canciones ·{' '}
                      {daily.playerCount ?? 0} jugadores hoy
                    </p>
                  ) : (
                    <p className="text-green-100 text-sm animate-pulse">Cargando...</p>
                  )}
                  {daily?.alreadyCompleted && (
                    <p className="text-green-200 text-xs mt-1">✅ Ya jugaste el reto de hoy</p>
                  )}
                </div>
                {daily?.alreadyCompleted ? (
                  <button
                    onClick={() => navigate(`/leaderboards`)}
                    className="flex-shrink-0 px-5 py-2 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition shadow"
                  >
                    🏆 Ver ranking
                  </button>
                ) : (
                  <button
                    onClick={() => daily && navigate(`/session/${daily.sessionId}`)}
                    disabled={!daily || dailyLoading}
                    className="flex-shrink-0 px-5 py-2 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition disabled:opacity-60 disabled:cursor-not-allowed shadow"
                  >
                    ▶ Jugar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Configuración de partida ── */}
        <div className="space-y-4">
          <hr className="h-px my-8 bg-gray-200 border-0" />
          <h2 className="text-xl font-bold text-slate-800">Partida rápida</h2>

          {/* Playlists del usuario */}
          {playlists.length > 0 && (
            <div className="mb-6">
              <button
                className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-left font-semibold text-slate-800 flex justify-between items-center shadow-sm transition"
                onClick={() => setShowPlaylists(!showPlaylists)}
              >
                Tus playlists
                <span className="text-sm">{showPlaylists ? '▲' : '▼'}</span>
              </button>

              {showPlaylists && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 max-h-64 overflow-y-auto">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        setPlaylistUrl(pl.external_urls.spotify);
                        setShowPlaylists(false);
                      }}
                      className="flex items-center gap-4 p-3 bg-white rounded-xl shadow hover:shadow-md cursor-pointer transition transform hover:-translate-y-0.5"
                    >
                      {pl.images?.[0] ? (
                        <img
                          src={pl.images[0].url}
                          alt={pl.name}
                          className="w-14 h-14 rounded-lg object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-slate-200 rounded-lg" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 truncate">
                          {pl.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {pl.tracks.total} canciones
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">▶️</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* URL Playlist */}
          <div>
            <label className="block mb-1 font-medium text-slate-700">
              URL de la playlist
            </label>
            <input
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              placeholder="https://open.spotify.com/playlist/..."
            />
          </div>

          {/* Opciones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium text-slate-700">
                Nº canciones
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={loading}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              >
                <option>3</option>
                <option>5</option>
                <option>10</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-slate-700">
                Penalización (segundos)
              </label>
              <input
                type="number"
                min="1"
                value={penalty}
                onChange={(e) => setPenalty(Number(e.target.value))}
                disabled={loading}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={createSession}
                disabled={loading || !isAuthenticated}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creando...
                  </span>
                ) : (
                  'Cargar canciones'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Leaderboards ── */}
      <div className="max-w-3xl mx-auto my-8">
        <a
          href="/leaderboards"
          className="flex items-center justify-between w-full bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition group"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="font-bold text-slate-800 text-lg">Leaderboards</div>
              <div className="text-sm text-slate-500">Rankings globales, por sesión y tu historial</div>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-slate-600 text-xl transition">→</span>
        </a>
      </div>

      {/* ── Únete a una sesión ── */}
      <div className="max-w-3xl mx-auto my-8 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-slate-800">
          Únete a una sesión
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block mb-1 font-medium text-slate-700">
              ID de la sesión
            </label>
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              placeholder="cmabcxyz123..."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={joinSession}
              disabled={loading || !joinInput.trim() || !isAuthenticated}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Jugar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;