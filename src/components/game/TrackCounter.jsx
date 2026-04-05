export default function TrackCounter({ index, total }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i}
            className={`h-1 rounded-full transition-all duration-500 ${i < index ? 'bg-green-400 w-6' :
                i === index ? 'bg-green-400 w-10' :
                  'bg-slate-700 w-6'
              }`}
          />
        ))}
      </div>
      <span className="text-sm text-slate-500 tabular-nums">
        {index + 1} <span className="text-slate-700">/</span> {total}
      </span>
    </div>
  );
}