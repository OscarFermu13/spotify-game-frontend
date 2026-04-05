import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../config/env';
import Spinner from '../Spinner';
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

export default function DailyTab() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGameId, setSelectedGameId] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE}/api/daily`)
            .then(async ({ data: daily }) => {
                const lb = await axios.get(`${API_BASE}/api/leaderboard/session/${daily.sessionId}`);
                setData({
                    ...lb.data,
                    dailyDate: daily.dailyDate,
                    playerCount: daily.playerCount,
                    sessionId: daily.sessionId,
                });
            })
            .catch((e) => {
                setError(e.response?.status === 401
                    ? 'Inicia sesión para ver el reto de hoy.'
                    : 'Error cargando el reto diario.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner label="Cargando reto de hoy…" />;
    if (error) return <p className="text-center text-red-400 py-8">{error}</p>;

    const dateStr = data?.dailyDate
        ? new Date(data.dailyDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        : 'Hoy';

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <p className="font-bold text-slate-100 capitalize">{dateStr}</p>
                    <p className="text-sm text-slate-500">
                        {data?.trackCount} canciones · {data?.playerCount} jugadores hoy
                    </p>
                </div>
                <button
                    onClick={() => navigate(`/session/${data?.sessionId}`)}
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition text-sm"
                >
                    ▶ Jugar el reto
                </button>
            </div>

            {!data?.leaderboard?.length ? (
                <p className="text-center text-slate-500 py-10">Sé el primero en completar el reto de hoy.</p>
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

            {selectedGameId && (
                <GameDetailDrawer gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
            )}
        </div>
    );
}