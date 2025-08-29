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
    } catch (e) {
      alert('Error obteniendo playlist. Asegúrate de estar autenticado y que la URL es correcta.');
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">🎧 Spotify Quiz (POC)</h1>

        {!token ? (
          <div>
            <p className="mb-4">Conéctate con Spotify para permitir reproducción con Web Playback SDK (opcional).</p>
            <button onClick={handleLogin} className="px-4 py-2 bg-green-500 text-white rounded">Conectar con Spotify</button>
          </div>
        ) : (
          <div className="mb-4">
            <p className="mb-2">Conectado.</p>
            <button onClick={() => { localStorage.removeItem('token'); setToken(null); setTracks(null); }} className="px-3 py-1 border rounded">Cerrar sesión</button>
          </div>
        )}

        <div className="mt-6">
          <label className="block mb-1">URL de la playlist:</label>
          <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="https://open.spotify.com/playlist/..." />
          <div className="flex items-center gap-2">
            <label>Numero canciones:</label>
            <select value={count} onChange={e => setCount(Number(e.target.value))} className="p-2 border rounded">
              <option>3</option>
              <option>5</option>
              <option>10</option>
            </select>
            <button onClick={fetchPlaylist} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded">Cargar canciones</button>
          </div>
        </div>

        {tracks && (
          <div className="mt-6">
            <Game tracks={tracks} token={token} apiBase={API} />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
