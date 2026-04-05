export default function ResultBanner({ result, onNext }) {
  const { correct, skipped, correctTrack } = result;
  const artistStr = Array.isArray(correctTrack.artists)
    ? correctTrack.artists.map((a) => a.name).join(', ')
    : correctTrack.artists;

  return (
    <div className={`mt-8 rounded-2xl border p-6 text-center ${correct ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'
      }`}>
      <div className="text-4xl mb-3">{correct ? '✅' : skipped ? '⏭️' : '❌'}</div>
      <p className={`text-lg font-black mb-1 ${correct ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
        {correct ? '¡Correcto!' : skipped ? 'Pasada' : 'Incorrecto'}
      </p>
      <p className="text-sm text-slate-400 mb-4">
        Era: <span className="text-slate-100 font-semibold">{correctTrack.name}</span>
        <span className="text-slate-500"> — {artistStr}</span>
      </p>
      {correctTrack.album?.images?.[0] && (
        <img src={correctTrack.album.images[0].url} alt={correctTrack.name}
          className="mx-auto mb-5 w-32 h-32 rounded-2xl shadow-xl border border-slate-700" />
      )}
      <button onClick={onNext} className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition">
        Continuar →
      </button>
    </div>
  );
}