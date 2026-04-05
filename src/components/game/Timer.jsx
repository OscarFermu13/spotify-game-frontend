export default function Timer({ currentTime, totalTime, hintTimeCost, result, penalty }) {
  const frozen = !!result;
  const penaltyCost = frozen && !result.correct ? penalty : 0;

  return (
    <div className="flex items-center justify-between mt-6 px-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${frozen ? 'bg-slate-600' : 'bg-green-400 animate-pulse'}`} />
        <span className="text-sm text-slate-400">
          Canción{' '}
          <span className="text-white font-mono font-semibold">{currentTime.toFixed(2)}s</span>
        </span>
        {hintTimeCost > 0 && (
          <span className="text-xs text-amber-500 font-mono">+{hintTimeCost}s pistas</span>
        )}
        {frozen && penaltyCost > 0 && (
          <span className="text-xs text-red-400 font-mono">
            +{penaltyCost}s {result.skipped ? 'por pasar' : 'penalización'}
          </span>
        )}
      </div>
      <div className="text-sm text-slate-500 shrink-0">
        Total <span className="text-slate-300 font-mono">{totalTime.toFixed(2)}s</span>
      </div>
    </div>
  );
}