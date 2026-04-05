export default function PlaylistCard({ pl, onClick, selected }) {
  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
        selected
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
      }`}
    >
      {pl.images?.[0] ? (
        <img src={pl.images[0].url} alt={pl.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-11 h-11 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-500 text-lg">♪</div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${selected ? 'text-green-300' : 'text-slate-100'}`}>{pl.name}</p>
        <p className="text-xs text-slate-500">{pl.tracks.total} canciones</p>
      </div>
      {selected && <span className="text-green-400 flex-shrink-0 text-sm">✓</span>}
    </div>
  );
}