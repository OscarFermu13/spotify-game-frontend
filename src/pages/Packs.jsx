// src/pages/Packs.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/env';

import Layout    from '../components/Layout';
import Spinner   from '../components/Spinner';
import PackCard  from '../components/packs/PackCard';
import usePackPlay from '../hooks/usePackPlay';

axios.defaults.withCredentials = true;

const FILTERS = [
  { key: 'all',     label: 'Todos' },
  { key: 'free',    label: 'Gratis' },
  { key: 'premium', label: 'Premium' },
];

export default function Packs() {
  const navigate = useNavigate();
  const { playing, playPack } = usePackPlay();

  const [packs, setPacks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get(`${API_BASE}/api/packs`)
      .then((r) => setPacks(r.data))
      .catch((e) => {
        if (e.response?.status === 401) navigate('/');
        else setError('No se pudieron cargar los packs.');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered     = filter === 'all' ? packs : packs.filter((p) => p.tier === filter);
  const freePacks    = packs.filter((p) => p.tier === 'free').length;
  const premiumPacks = packs.filter((p) => p.tier === 'premium').length;

  return (
    <Layout>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          🎮 Packs
        </h1>
        <p className="text-slate-400 text-sm">
          Colecciones temáticas curadas. Cada partida es diferente.
        </p>
      </div>

      {/* Filter pills */}
      {!loading && packs.length > 0 && (
        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? packs.length : f.key === 'free' ? freePacks : premiumPacks;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                  filter === f.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f.key ? 'bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Spinner label="Cargando packs…" />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition text-sm font-semibold">
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16">No hay packs en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((pack) => (
            <PackCard key={pack.id} pack={pack} onPlay={playPack} playing={playing} />
          ))}
        </div>
      )}

      {/* Premium teaser */}
      {!loading && premiumPacks === 0 && (
        <div className="mt-8 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
          <p className="text-amber-300 font-semibold text-sm mb-1">Packs Premium · Próximamente</p>
          <p className="text-slate-500 text-xs">
            Colecciones exclusivas, géneros especiales y más canciones por sesión.
          </p>
        </div>
      )}
    </Layout>
  );
}