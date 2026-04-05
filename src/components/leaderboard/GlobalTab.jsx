import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';
import Spinner from '../Spinner';
import LeaderTable from './LeaderTable';

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

export default function GlobalTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE}/api/leaderboard/global`)
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner label="Cargando ranking…" />;
    if (!data?.length) return <p className="text-center text-slate-500 py-10">Todavía no hay partidas registradas.</p>;

    return (
        <LeaderTable
            headers={[
                { label: 'Pos.' },
                { label: 'Jugador' },
                { label: 'Mejor tiempo', right: true },
                { label: 'Tiempo medio', right: true },
                { label: 'Partidas', right: true },
            ]}
            empty=""
        >
            {data.map((entry, idx) => (
                <tr key={entry.userId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pr-4 font-semibold text-lg w-10">{medal(idx + 1)}</td>
                    <td className="py-3 pr-4 text-slate-100">{entry.displayName}</td>
                    <td className="py-3 pr-4 text-right text-slate-300">{formatTime(entry.bestTime)}</td>
                    <td className="py-3 pr-4 text-right text-slate-300">{formatTime(entry.avgTime)}</td>
                    <td className="py-3 text-right text-slate-500">{entry.gamesPlayed}</td>
                </tr>
            ))}
        </LeaderTable>
    );
}