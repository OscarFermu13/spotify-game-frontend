import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/env';

axios.defaults.withCredentials = true;

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

// Tag pill colours cycling through a small palette
const TAG_COLORS = [
  'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'bg-pink-500/15 text-pink-300 border-pink-500/25',
  'bg-teal-500/15 text-teal-300 border-teal-500/25',
];
function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff;
  return TAG_COLORS[h % TAG_COLORS.length];
}

// ── Pack card ─────────────────────────────────────────────────────────────────
function PackCard({ pack, onPlay, playing }) {
  const locked = !pack.unlocked;

  return (
    <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${
      locked
        ? 'border-slate-800 bg-slate-900/40 opacity-80'
        : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70 hover:scale-[1.01]'
    }`}>
      {/* Cover image / placeholder */}
      <div className="relative h-32 bg-slate-800 overflow-hidden">
        {pack.imageUrl ? (
          <img src={pack.imageUrl} alt={pack.name}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">🎵</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Tier badge */}
        {pack.tier === 'premium' && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 bg-amber-500/90 text-black text-xs font-black rounded-full tracking-wide">
              PREMIUM
            </span>
          </div>
        )}

        {/* Lock icon */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-black text-white text-base leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            {pack.name}
          </h3>
          <span className="text-xs text-slate-500 shrink-0 mt-0.5">{pack.trackCount} canciones</span>
        </div>

        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{pack.description}</p>

        {/* Tags */}
        {pack.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pack.tags.map((tag) => (
              <span key={tag} className={`px-2 py-0.5 text-xs rounded-full border ${tagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {locked ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-400 font-semibold">
              {pack.price ? `${pack.price} ${pack.currency}` : 'Próximamente'}
            </span>
            <button
              disabled
              className="px-4 py-2 bg-slate-700 text-slate-500 text-sm font-semibold rounded-xl cursor-not-allowed"
            >
              🔒 Bloqueado
            </button>
          </div>
        ) : (
          <button
            onClick={() => onPlay(pack)}
            disabled={playing === pack.slug}
            className="w-full py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {playing === pack.slug ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Preparando…
              </span>
            ) : '▶ Jugar'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Packs() {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null); // slug of pack being started
  const [filter, setFilter] = useState('all');  // 'all' | 'free' | 'premium'

  useEffect(() => {
    axios.get(`${API_BASE}/api/packs`)
      .then((r) => setPacks(r.data))
      .catch((e) => {
        if (e.response?.status === 401) navigate('/');
        else setError('No se pudieron cargar los packs.');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handlePlay = useCallback(async (pack) => {
    setPlaying(pack.slug);
    try {
      const { data } = await axios.post(`${API_BASE}/api/packs/${pack.slug}/play`);
      // Navigate to session — SessionPlay already handles 'pack' source
      navigate(`/session/${data.sessionId}`, {
        state: { gameId: data.gameId, packName: data.packName, packSlug: data.packSlug },
      });
    } catch (e) {
      console.error('playPack error:', e.response?.data || e.message);
      alert(e.response?.data?.error || 'No se pudo iniciar el pack.');
    } finally {
      setPlaying(null);
    }
  }, [navigate]);

  const filtered = filter === 'all' ? packs
    : packs.filter((p) => p.tier === filter);

  const freePacks    = packs.filter((p) => p.tier === 'free').length;
  const premiumPacks = packs.filter((p) => p.tier === 'premium').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
      `}</style>
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
            {[
              { key: 'all',     label: 'Todos',   count: packs.length },
              { key: 'free',    label: 'Gratis',  count: freePacks },
              { key: 'premium', label: 'Premium', count: premiumPacks },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                  filter === f.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600'}`}>
                  {f.count}
                </span>
              </button>
            ))}
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
              <PackCard key={pack.id} pack={pack} onPlay={handlePlay} playing={playing} />
            ))}
          </div>
        )}

        {/* Premium teaser if no premium packs yet */}
        {!loading && premiumPacks === 0 && (
          <div className="mt-8 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
            <p className="text-amber-300 font-semibold text-sm mb-1">Packs Premium · Próximamente</p>
            <p className="text-slate-500 text-xs">Colecciones exclusivas, géneros especiales y más canciones por sesión.</p>
          </div>
        )}
      </div>
    </div>
  );
}