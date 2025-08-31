import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Game from './components/Game';

const API = 'http://localhost:4000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [count, setCount] = useState(5);
  const [tracks, setTracks] = useState(null);
  const [penalty, setPenalty] = useState(5);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // read token from query if present (after auth redirect)
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      localStorage.setItem('token', t);
      setToken(t);
      // clear from URL
      const url = new URL(window.location);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    // optionally get user info from backend or decode JWT. For POC skip.
    setUser({ name: 'Usuario' });
  }, [token]);

  const handleLogin = () => {
    window.location.href = `${API}/auth/login`;
  };

  const fetchPlaylist = async () => {
    try {
      const resp = await axios.get(`${API}/api/playlist`, {
        params: { url: playlistUrl, count },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTracks(resp.data.tracks);
      setPlaying(true);
    } catch (e) {
      alert('Error obteniendo playlist. Asegúrate de estar autenticado y que la URL es correcta.');
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-slate-800">
          🎧 Spotify Quiz
        </h1>

        {!token ? (
          <div className="text-center mb-6">
            <p className="mb-4 text-slate-600">
              Conéctate con Spotify para poder reproducir canciones con Web Playback SDK.
            </p>
            <button
              onClick={handleLogin}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-lg shadow"
            >
              Conectar con Spotify
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-lg border">
            <p className="text-slate-700">✅ Conectado como <span className="font-semibold">{user?.name}</span></p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setToken(null);
                setTracks(null);
              }}
              className="px-3 py-1 border rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              Cerrar sesión
            </button>
          </div>
        )}

        {!playing && (
          <div className="space-y-4">
            {/* URL Playlist */}
            <div>
              <label className="block mb-1 font-medium text-slate-700">
                URL de la playlist
              </label>
              <input
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchPlaylist}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg shadow"
                >
                  Cargar canciones
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Juego */}
        {tracks && (
          <div className="mt-8">
            <Game tracks={tracks} penalty={penalty} token={token} apiBase={API} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
