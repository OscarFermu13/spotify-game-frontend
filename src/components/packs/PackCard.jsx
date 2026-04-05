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

export default function PackCard({ pack, onPlay, playing }) {
    const locked = !pack.unlocked;

    return (
        <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 ${locked
                ? 'border-slate-800 bg-slate-900/40 opacity-80'
                : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70 hover:scale-[1.01]'
            }`}>

            {/* Cover */}
            <div className="relative h-32 bg-slate-800 overflow-hidden">
                {pack.imageUrl ? (
                    <img src={pack.imageUrl} alt={pack.name}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl opacity-30">🎵</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

                {pack.tier === 'premium' && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 bg-amber-500/90 text-black text-xs font-black rounded-full tracking-wide">
                            PREMIUM
                        </span>
                    </div>
                )}

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

                {pack.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {pack.tags.map((tag) => (
                            <span key={tag} className={`px-2 py-0.5 text-xs rounded-full border ${tagColor(tag)}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {locked ? (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-400 font-semibold">
                            {pack.price ? `${pack.price} ${pack.currency}` : 'Próximamente'}
                        </span>
                        <button disabled
                            className="px-4 py-2 bg-slate-700 text-slate-500 text-sm font-semibold rounded-xl cursor-not-allowed">
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
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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