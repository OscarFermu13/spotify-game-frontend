export default function PackPreviewCard({ pack, onClick, loading }) {
  const isLocked = !pack.unlocked;
  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`group relative rounded-xl border overflow-hidden transition-all duration-200 ${
        isLocked
          ? 'border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed'
          : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70 cursor-pointer hover:scale-[1.02]'
      }`}
    >
      <div className="h-24 bg-slate-800 relative overflow-hidden">
        {pack.imageUrl ? (
          <img src={pack.imageUrl} alt={pack.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎵</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        {pack.tier === 'premium' && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-amber-500/90 text-black text-xs font-black rounded-full">PRO</span>
        )}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl opacity-50">🔒</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-black text-slate-100 truncate leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          {pack.name}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{pack.trackCount} canciones</p>
      </div>
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-green-500/90 flex items-center justify-center shadow-lg">
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="black" className="w-4 h-4 ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}