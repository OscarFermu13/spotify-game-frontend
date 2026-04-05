export default function EqBars() {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="w-[3px] rounded-full bg-green-400 opacity-80"
          style={{
            height: `${30 + (i * 17) % 70}%`,
            animation: `eq ${0.6 + i * 0.13}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}