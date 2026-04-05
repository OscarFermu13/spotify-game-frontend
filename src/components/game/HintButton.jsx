const HINTS = [
  { type: 'title_length', label: 'Nº de letras del título', cost: 2, icon: '🔢' },
  { type: 'release_year', label: 'Año de lanzamiento', cost: 2, icon: '📅' },
  { type: 'artist_initial', label: 'Inicial del artista', cost: 2, icon: '🎤' },
  { type: 'title_initial', label: 'Inicial del título', cost: 2, icon: '🔤' },
  { type: 'album_cover', label: 'Portada del álbum', cost: 2, icon: '🖼️' },
];

export { HINTS };

export default function HintButton({ usedHints, result, onUseHint }) {
  if (usedHints.length >= HINTS.length) {
    return <p className="text-center text-xs text-slate-600 mt-5">Sin más pistas disponibles</p>;
  }
  const next = HINTS[usedHints.length];
  return (
    <div className="flex justify-center mt-5">
      <button onClick={() => onUseHint(next.type)} disabled={!!result}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl transition disabled:opacity-40">
        💡 Pista
        <span className="text-amber-500/70 text-xs">{next.icon} {next.label} · +{next.cost}s</span>
      </button>
    </div>
  );
}