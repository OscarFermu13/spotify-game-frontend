import { useState } from 'react';
import { buildDailyShareText, buildPackShareText, buildCustomShareText } from '../../utils/share.js';

function ShareButton({ text, isDaily, isPack }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
            try { await navigator.share({ text }); return; } catch (_) { }
        }
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (_) { }
    };

    return (
        <button onClick={handleShare}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all duration-200 ${copied
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : isDaily
                        ? 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300'
                        : isPack
                            ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300'
                            : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200'
                }`}>
            {copied ? (
                <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    ¡Copiado!
                </>
            ) : (
                <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
                    </svg>
                    {isDaily || isPack ? 'Compartir resultado' : 'Compartir sesión'}
                </>
            )}
        </button>
    );
}

export default function PostGameActions({ isDaily, isPack, packName, sessionId, gameResult, onLeaderboard, onHome }) {
    const shareText = isDaily
        ? buildDailyShareText(gameResult)
        : isPack
            ? buildPackShareText(gameResult, packName)
            : buildCustomShareText(gameResult, sessionId);

    const previewStyle = isDaily
        ? 'bg-purple-500/5 border-purple-500/20 text-purple-200'
        : isPack
            ? 'bg-blue-500/5 border-blue-500/20 text-blue-200'
            : 'bg-teal-800/20 border-teal-700 text-teal-300';

    const leaderboardLabel = isDaily
        ? '🏆 Ver ranking de hoy'
        : isPack
            ? '📦 Más packs'
            : '🏆 Ver ranking de esta sesión';

    return (
        <div className="mt-10 pt-8 border-t border-slate-800">
            <div className={`mb-6 p-4 rounded-2xl border font-mono text-sm whitespace-pre-wrap leading-relaxed ${previewStyle}`}>
                {shareText}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <ShareButton text={shareText} isDaily={isDaily} isPack={isPack} />
                <button onClick={onLeaderboard}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition">
                    {leaderboardLabel}
                </button>
                <button onClick={onHome}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition">
                    Inicio
                </button>
            </div>
        </div>
    );
}