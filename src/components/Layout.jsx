import EqBars from './EqBars';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
      `}</style>
            <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
            />
            <div className="relative max-w-3xl mx-auto px-6 py-8">
                <header className="flex items-center justify-between mb-10">
                    <a href="/" className="flex items-center gap-3">
                        <EqBars />
                        <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Spotify<span className="text-green-400">Quiz</span>
                        </span>
                    </a>
                    <a href="/" className="text-sm text-slate-400 hover:text-slate-200 transition">← Inicio</a>
                </header>
                {children}
            </div>
        </div>
    );
}