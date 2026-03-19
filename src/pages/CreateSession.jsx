import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';

export default function CreateSession() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [count, setCount] = useState(5);
  const [isPublic, setIsPublic] = useState(true);
  const [shareUrl, setShareUrl] = useState(null);
  const token = localStorage.getItem('token');

  const create = async () => {
    try {
      const resp = await axios.post(`${API}/api/session/create`, {
        playlistUrl, isPublic, count
      }, { headers: { Authorization: `Bearer ${token}` }});
      setShareUrl(resp.data.shareUrl);
      window.location.href = resp.data.shareUrl;
    } catch (e) {
      console.error(e);
      alert('No se pudo crear la sesión');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4">Crear sesión</h1>
      <label className="block mb-1 font-medium">URL de playlist</label>
      <input
        value={playlistUrl}
        onChange={e=>setPlaylistUrl(e.target.value)}
        className="w-full p-3 border rounded-lg mb-3"
        placeholder="https://open.spotify.com/playlist/..."
      />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block mb-1 font-medium">Nº canciones</label>
          <select
            className="w-full p-2 border rounded-lg"
            value={count}
            onChange={(e)=>setCount(Number(e.target.value))}
          >
            <option>3</option>
            <option>5</option>
            <option>10</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} />
            Pública
          </label>
        </div>
      </div>

      <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Crear sesión
      </button>

      {shareUrl && (
        <div className="mt-4 p-3 bg-slate-50 border rounded-lg">
          <div className="font-medium mb-2">Comparte este link:</div>
          <div className="flex gap-2">
            <input className="flex-1 p-2 border rounded" value={shareUrl} readOnly />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="px-3 py-2 bg-slate-800 text-white rounded-lg"
            >
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
