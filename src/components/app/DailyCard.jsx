export default function DailyCard({ daily, onPlay, onLeaderboard }) {
  const dateStr = daily?.dailyDate
    ? new Date(daily.dailyDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Hoy';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/40 via-emerald-500/20 to-slate-900 p-[1px]">
      <div className="relative rounded-2xl bg-slate-900/80 p-6 overflow-hidden">
        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-green-400/5 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest text-green-400 uppercase">Reto del día</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p className="text-white font-black text-lg leading-tight capitalize mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              {dateStr}
            </p>
            {daily ? (
              <p className="text-slate-400 text-sm">
                {daily.tracks?.length ?? 5} canciones ·{' '}
                <span className="text-slate-300">{daily.playerCount ?? 0} jugadores hoy</span>
              </p>
            ) : (
              <p className="text-slate-600 text-sm animate-pulse">Cargando…</p>
            )}
            {daily?.alreadyCompleted && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                ✓ Ya completado hoy
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {daily?.alreadyCompleted ? (
              <button onClick={onLeaderboard}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition hover:scale-105 active:scale-95">
                🏆 Ranking
              </button>
            ) : (
              <button onClick={onPlay} disabled={!daily}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                ▶ Jugar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}