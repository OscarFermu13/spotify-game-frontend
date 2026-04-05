import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env.js';
import TrackResultCard from './TrackResultCard';

export default function GameDetailDrawer({ gameId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!gameId) return;
        setLoading(true); setError(null); setData(null);
        axios.get(`${API_BASE}/api/leaderboard/game/${gameId}`)
            .then((r) => setData(r.data))
            .catch((e) => setError(e.response?.data?.error || 'Error cargando la partida.'))
            .finally(() => setLoading(false));
    }, [gameId]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40" onClick={onClose} />
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
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
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
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {[
                                    { label: 'Tiempo total', value: `${data.totalTime.toFixed(2)}s` },
                                    { label: 'Aciertos', value: `${data.guessed}/${data.total}` },
                                    { label: 'Precisión', value: `${data.accuracy}%` },
                                ].map((s) => (
                                    <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 text-center">
                                        <div className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                                    </div>
                                ))}
                            </div>
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