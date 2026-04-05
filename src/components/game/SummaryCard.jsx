export default function SummaryCard({ t, penalty, i }) {
  const correctArtists = Array.isArray(t.artist) ? t.artist.map((a) => a.name).join(', ') : t.artist;
  const userGuessArtists = t.userGuess?.artists ? t.userGuess.artists.map((a) => a.name).join(', ') : null;
  const coverUrl = t.guessed
    ? t.album?.images?.[0]?.url
    : (t.userGuess?.album?.images?.[0]?.url ?? null);

  return (
    <div className={`rounded-2xl border overflow-hidden ${t.guessed ? 'border-green-500/60 bg-green-500/15' : 'border-red-500/60 bg-red-500/15'}`}>
      <div className="flex items-center gap-4 p-4">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-16 h-16 rounded-xl flex-shrink-0 shadow" />
        ) : (
          <div className="w-16 h-16 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
            {t.guessed ? '✅' : t.skipped ? '⏭️' : '❌'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-600">#{i + 1}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.guessed ? 'bg-green-500/20 text-green-400' :
                t.skipped ? 'bg-slate-600/40 text-slate-400' :
                  'bg-red-500/20 text-red-400'
              }`}>
              {t.guessed ? 'Correcto' : t.skipped ? 'Pasada' : 'Fallo'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">{t.name}</p>
          <p className="text-xs text-slate-500 truncate">{correctArtists}</p>
        </div>
      </div>

      {!t.guessed && t.userGuess && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-700/40 bg-slate-800/40">
          {t.userGuess.album?.images?.[2] && (
            <img src={t.userGuess.album.images[2].url} alt="" className="w-9 h-9 rounded-lg flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Tu respuesta</p>
            <p className="text-sm text-slate-300 truncate">{t.userGuess.name} — {userGuessArtists}</p>
          </div>
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-slate-700/40 flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="text-xs text-slate-400 font-mono">{t.baseTime.toFixed(2)}s</span>
        {!t.guessed && (
          <span className="text-xs text-red-400 font-mono">+{penalty}s {t.skipped ? 'por pasar' : 'penalización'}</span>
        )}
        {t.hintCost > 0 && (
          <span className="text-xs text-amber-500 font-mono">+{t.hintCost}s pistas</span>
        )}
      </div>
    </div>
  );
}