export default function SearchBox({ searchTerm, onChange, results, onSelect }) {
  return (
    <div className="mt-5">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input type="text" value={searchTerm} onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el nombre de la canción…" autoFocus
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
      </div>
      {results.length > 0 && (
        <ul className="mt-2 bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700/60 shadow-xl overflow-hidden">
          {results.map((track) => (
            <li key={track.id} onClick={() => onSelect(track)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 cursor-pointer transition">
              {track.album?.images?.[2] && (
                <img src={track.album.images[2].url} alt="" className="w-9 h-9 rounded-md flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm text-slate-100 truncate">{track.name}</div>
                <div className="text-xs text-slate-500 truncate">{track.artists.map((a) => a.name).join(', ')}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}