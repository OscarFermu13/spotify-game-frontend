export default function PlayControls({ playing, ready, result, confirmingPass, onPlay, onPause, onGuess, onPass, onCancelPass, guessing }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {playing ? (
        <button onClick={onPause} disabled={!!result}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold rounded-xl transition disabled:opacity-40">
          <span className="flex gap-0.5">
            <span className="w-1 h-4 bg-white rounded-full" />
            <span className="w-1 h-4 bg-white rounded-full" />
          </span>
          Pausar
        </button>
      ) : (
        <button onClick={onPlay} disabled={!ready || !!result}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition disabled:opacity-40">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M8 5v14l11-7z" /></svg>
          {ready ? 'Reproducir' : 'Cargando…'}
        </button>
      )}

      {confirmingPass ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">¿Seguro?</span>
          <button onClick={onPass}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition">
            Sí, pasar
          </button>
          <button onClick={onCancelPass}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm transition">
            Cancelar
          </button>
        </div>
      ) : (
        <button onClick={onPass} disabled={!!result}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl transition disabled:opacity-40">
          Pasar
        </button>
      )}

      <button onClick={onGuess} disabled={!!result}
        className={`px-5 py-2.5 font-bold rounded-xl transition disabled:opacity-40 ${guessing ? 'bg-slate-700 border border-slate-600 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-900'
          }`}>
        {guessing ? 'Cancelar' : 'Adivinar'}
      </button>
    </div>
  );
}