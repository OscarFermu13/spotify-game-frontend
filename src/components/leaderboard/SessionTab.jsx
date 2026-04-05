import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';
import LeaderTable from './LeaderTable';
import GameDetailDrawer from './GameDetailDrawer';

function medal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

function formatTime(s) {
    if (s == null) return '—';
    return `${s.toFixed(2)}s`;
}

export default function SessionTab({ sessionId: initialId }) {
    const [inputId, setInputId] = useState(initialId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedGameId, setSelectedGameId] = useState(null);

    const fetchSession = async (id) => {
        if (!id?.trim()) return;
        setLoading(true); setError(null);
        try {
            const resp = await axios.get(`${API_BASE}/api/leaderboard/session/${id.trim()}`);
            setData(resp.data);
        } catch (e) {
            setError(e.response?.status === 404
                ? 'Sesión no encontrada.'
                : 'Error cargando el ranking.');
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

                    {!data.leaderboard.length ? (
                        <p className="text-center text-slate-500 py-10">Nadie ha completado esta sesión todavía.</p>
                    ) : (
                        <LeaderTable
                            headers={[
                                { label: 'Pos.' },
                                { label: 'Jugador' },
                                { label: 'Tiempo', right: true },
                                { label: 'Aciertos', right: true },
                            ]}
                            empty=""
                        >
                            {data.leaderboard.map((entry) => (
                                <tr key={entry.userId}
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
                    )}
                    {data.leaderboard.length > 0 && (
                        <p className="text-xs text-slate-600 mt-3 text-center">
                            Haz click en una fila para ver el detalle de esa partida
                        </p>
                    )}
                </>
            )}

            {selectedGameId && (
                <GameDetailDrawer gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
            )}
        </div>
    );
}