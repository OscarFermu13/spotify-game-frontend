export default function TrackResultCard({ t, penalty }) {
    const artistStr = Array.isArray(t.artists)
        ? t.artists.map((a) => a.name ?? a).join(', ')
        : (t.artists ?? '');
    const coverUrl = t.albumJson?.images?.[0]?.url ?? null;

    return (
        <div className={`rounded-2xl border overflow-hidden ${t.guessed
                ? 'border-green-500/60 bg-green-500/15'
                : 'border-red-500/60 bg-red-500/15'
            }`}>
            <div className="flex items-center gap-4 p-4">
                {coverUrl ? (
                    <img src={coverUrl} alt="" className="w-14 h-14 rounded-xl flex-shrink-0 shadow" />
                ) : (
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center text-xl">
                        {t.guessed ? '✅' : t.skipped ? '⏭️' : '❌'}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.guessed ? 'bg-green-500/20 text-green-400' :
                                t.skipped ? 'bg-slate-600/40 text-slate-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {t.guessed ? 'Correcto' : t.skipped ? 'Pasada' : 'Fallo'}
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 truncate">{t.name}</p>
                    <p className="text-xs text-slate-500 truncate">{artistStr}</p>
                </div>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-700/40 flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-xs text-slate-400 font-mono">{t.baseTime.toFixed(2)}s</span>
                {t.hintCost > 0 && (
                    <span className="text-xs text-amber-500 font-mono">+{t.hintCost.toFixed(2)}s pistas</span>
                )}
                {!t.guessed && t.penaltyCost > 0 && (
                    <span className="text-xs text-red-400 font-mono">
                        +{t.penaltyCost}s {t.skipped ? 'por pasar' : 'penalización'}
                    </span>
                )}
            </div>
        </div>
    );
}