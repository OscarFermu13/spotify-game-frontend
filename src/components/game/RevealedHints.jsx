import { HINTS } from './HintButton';

const BLUR_LEVELS = ['blur-3xl', 'blur-2xl', 'blur-xl', 'blur-lg', 'blur-sm', 'blur-none'];

function getHintValue(type, track) {
  switch (type) {
    case 'title_length':
      return track.name.split(' ').map((w) => Array.from(w).map(() => '_').join(' ')).join('  ·  ');
    case 'release_year':
      return track.album?.release_date?.slice(0, 4) ?? '?';
    case 'artist_initial': {
      const artists = Array.isArray(track.artists)
        ? track.artists.map((a) => a.name ?? a).join(', ')
        : track.artists;
      return artists.split(', ').map((a) => a[0].toUpperCase() + '.').join(', ');
    }
    case 'title_initial':
      return track.name[0].toUpperCase() + '.';
    case 'album_cover':
      return track.album?.images?.[0]?.url ?? null;
    default:
      return null;
  }
}

export default function RevealedHints({ usedHints, current }) {
  if (!usedHints.length) return null;
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {usedHints.map((type, idx) => {
        const hint = HINTS.find((h) => h.type === type);
        const value = getHintValue(type, current);
        const coverBlur = BLUR_LEVELS[Math.max(0, BLUR_LEVELS.length - 1 - idx)];

        if (type === 'album_cover') {
          return value ? (
            <div key={type} className="sm:col-span-2 flex flex-col items-center gap-2">
              <span className="text-xs text-slate-500">{hint.icon} {hint.label}</span>
              <div className="overflow-hidden rounded-2xl w-36 h-36 border border-slate-700">
                <img src={value} alt="portada" className={`w-full h-full object-cover ${coverBlur} transition-all duration-700`} />
              </div>
            </div>
          ) : null;
        }

        const isFullWidth = type === 'title_length';
        return (
          <div key={type} className={`flex items-start gap-2.5 px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm ${isFullWidth ? 'sm:col-span-2' : ''}`}>
            <span className="text-base shrink-0">{hint.icon}</span>
            <span className="text-slate-500 text-xs shrink-0 mt-0.5">{hint.label}:</span>
            <span className="font-mono font-semibold text-amber-300 tracking-widest break-all leading-relaxed">{value}</span>
          </div>
        );
      })}
    </div>
  );
}