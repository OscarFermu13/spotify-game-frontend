import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/env';
import Spinner from '../Spinner';

function formatTime(s) {
    if (s == null) return '—';
    return `${s.toFixed(2)}s`;
}

function playlistName(url) {
    if (!url) return null;
    try {
        const id = url.split('playlist/')[1]?.split('?')[0];
        return id ? `Playlist ${id.slice(0, 8)}…` : url;
    } catch { return url; }
}

function calcDailyStreak(history) {
    const dailyDates = history
        .filter((g) => g.source === 'daily')
        .map((g) => new Date(g.playedAt).toDateString());
    if (!dailyDates.length) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (dailyDates.includes(d.toDateString())) streak++;
        else if (i > 0) break;
    }
    return streak;
}

function StatsGrid({ history }) {
    const allStats = (arr) => {
        if (!arr.length) return null;
        const times = arr.map((g) => g.totalTime).filter(Boolean);
        return {
            count: arr.length,
            best: times.length ? Math.min(...times) : null,
            avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
            accuracy: Math.round(arr.reduce((a, g) => a + (g.accuracy || 0), 0) / arr.length),
        };
    };

    const all = allStats(history);
    const daily = allStats(history.filter((g) => g.source === 'daily'));
    const pack = allStats(history.filter((g) => g.source === 'pack'));
    const custom = allStats(history.filter((g) => g.source === 'custom'));
    const streak = calcDailyStreak(history);

    return (
        <div className="mb-8 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Partidas totales', value: all?.count ?? 0 },
                    { label: 'Mejor tiempo', value: formatTime(all?.best) },
                    { label: 'Tiempo medio', value: formatTime(all?.avg) },
                    { label: 'Precisión media', value: `${all?.accuracy ?? 0}%` },
                ].map((s) => (
                    <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3 text-center">
                    <div className="text-lg font-black text-purple-300" style={{ fontFamily: "'Syne', sans-serif" }}>{daily?.count ?? 0}</div>
                    <div className="text-xs text-purple-400/70 mt-0.5">Daily jugadas</div>
                    {daily && <div className="text-xs text-slate-500 mt-1">Media {formatTime(daily.avg)}</div>}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 text-center">
                    <div className="text-lg font-black text-blue-300" style={{ fontFamily: "'Syne', sans-serif" }}>{pack?.count ?? 0}</div>
                    <div className="text-xs text-blue-400/70 mt-0.5">Packs jugados</div>
                    {pack && <div className="text-xs text-slate-500 mt-1">Media {formatTime(pack.avg)}</div>}
                </div>
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-3 text-center">
                    <div className="text-lg font-black text-teal-300" style={{ fontFamily: "'Syne', sans-serif" }}>{custom?.count ?? 0}</div>
                    <div className="text-xs text-teal-400/70 mt-0.5">Custom jugadas</div>
                    {custom && <div className="text-xs text-slate-500 mt-1">Media {formatTime(custom.avg)}</div>}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-center">
                    <div className="text-lg font-black text-amber-300" style={{ fontFamily: "'Syne', sans-serif" }}>{streak} 🔥</div>
                    <div className="text-xs text-amber-400/70 mt-0.5">Racha diaria</div>
                    <div className="text-xs text-slate-500 mt-1">{streak > 0 ? 'días seguidos' : 'sin racha activa'}</div>
                </div>
            </div>
        </div>
    );
}

function GameCard({ g, onClickSession, onClickDaily, onClickPack }) {
    const isDaily = g.source === 'daily';
    const isPack = g.source === 'pack';
    const dateStr = new Date(g.playedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const handleClick = isDaily ? onClickDaily : isPack ? onClickPack : onClickSession;

    const cardStyle = isDaily
        ? 'bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20 hover:border-purple-500/50'
        : isPack
            ? 'bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20 hover:border-blue-500/50'
            : 'bg-teal-800/20 border-teal-700/50 hover:bg-teal-800/40 hover:border-teal-600/50';

    const badgeStyle = isDaily
        ? 'bg-purple-500/20 text-purple-300'
        : isPack
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-teal-500/20 text-teal-300';

    const arrowColor = isDaily ? 'text-purple-400' : isPack ? 'text-blue-400' : 'text-teal-400';
    const arrowLabel = isDaily ? 'Ver ranking →' : 'Ver sesión →';
    const badgeLabel = isDaily ? '🗓️ Daily' : isPack ? '📦 Pack' : '🎧 Custom';

    return (
        <div onClick={handleClick}
            className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] ${cardStyle}`}>
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${badgeStyle}`}>
                    {badgeLabel}
                </span>
                <span className="text-xs text-slate-600">{dateStr}</span>
            </div>
            <div className="flex items-center gap-4 px-4 pb-3">
                <div className={`relative w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black ${g.accuracy === 100 ? 'bg-green-500/20 text-green-400' :
                        g.accuracy >= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                    }`} style={{ fontFamily: "'Syne', sans-serif" }}>
                    {g.accuracy}%
                </div>
                <div className="flex-1 min-w-0">
                    {isDaily ? (
                        <p className="text-sm font-semibold text-purple-300 truncate">
                            {g.dailyDate
                                ? new Date(g.dailyDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                                : 'Reto del día'}
                        </p>
                    ) : isPack ? (
                        <p className="text-sm font-semibold text-blue-300 truncate">{g.packName ?? 'Pack'}</p>
                    ) : g.playlistUrl ? (
                        <span className="block truncate">
                            <a href={g.playlistUrl} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-green-400 hover:text-green-300 underline underline-offset-2 transition inline">
                                🎵 {playlistName(g.playlistUrl)}
                            </a>
                        </span>
                    ) : (
                        <p className="text-sm text-slate-500 truncate">Sesión personalizada</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">{g.guessed}/{g.total} canciones acertadas</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold text-slate-100">{formatTime(g.totalTime)}</p>
                    <p className={`text-xs mt-0.5 transition ${arrowColor} opacity-0 group-hover:opacity-100`}>
                        {arrowLabel}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PersonalTab({ onNavigateToSession, onNavigateToDaily }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        axios.get(`${API_BASE}/api/leaderboard/me`)
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner label="Cargando historial…" />;
    if (!data?.history?.length) return (
        <div className="text-center py-16">
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-slate-500">Todavía no has completado ninguna partida.</p>
        </div>
    );

    const { history } = data;
    const filtered = filter === 'all' ? history
        : filter === 'daily' ? history.filter((g) => g.source === 'daily')
            : filter === 'pack' ? history.filter((g) => g.source === 'pack')
                : history.filter((g) => g.source === 'custom');

    return (
        <div>
            <StatsGrid history={history} />

            <div className="flex gap-2 mb-5">
                {[
                    { key: 'all', label: 'Todas', count: history.length },
                    { key: 'daily', label: '🗓️ Daily', count: history.filter((g) => g.source === 'daily').length },
                    { key: 'pack', label: '📦 Packs', count: history.filter((g) => g.source === 'pack').length },
                    { key: 'custom', label: '🎧 Custom', count: history.filter((g) => g.source === 'custom').length },
                ].map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition ${filter === f.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}>
                        {f.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-600'}`}>
                            {f.count}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No hay partidas en esta categoría.</p>
            ) : (
                <div className="space-y-2">
                    {filtered.map((g) => (
                        <GameCard
                            key={g.gameId}
                            g={g}
                            onClickSession={() => onNavigateToSession(g.sessionId)}
                            onClickDaily={onNavigateToDaily}
                            onClickPack={() => onNavigateToSession(g.sessionId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}