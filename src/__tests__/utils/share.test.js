import { describe, it, expect } from 'vitest';
import {
    buildDailyShareText,
    buildPackShareText,
    buildCustomShareText,
} from '../../utils/share';

const baseResult = {
    totalTime: 42.5,
    perTrack: [
        { guessed: true, skipped: false },
        { guessed: false, skipped: true },
        { guessed: false, skipped: false },
    ],
};

describe('buildDailyShareText', () => {
    it('contiene la cabecera correcta', () => {
        const text = buildDailyShareText(baseResult);
        expect(text).toContain('SpotifyQuiz · Reto del día');
    });

    it('contiene el tiempo total formateado', () => {
        const text = buildDailyShareText(baseResult);
        expect(text).toContain('42.50s');
    });

    it('contiene la fila de emojis correcta', () => {
        const text = buildDailyShareText(baseResult);
        expect(text).toContain('✅⏭️❌');
    });

    it('contiene el conteo de canciones acertadas', () => {
        const text = buildDailyShareText(baseResult);
        expect(text).toContain('1/3 canciones');
    });

    it('contiene la URL del frontend', () => {
        const text = buildDailyShareText(baseResult);
        expect(text).toContain('http://localhost:5173');
    });

    it('con todas correctas muestra tres ✅', () => {
        const result = {
            totalTime: 10,
            perTrack: [
                { guessed: true, skipped: false },
                { guessed: true, skipped: false },
                { guessed: true, skipped: false },
            ],
        };
        expect(buildDailyShareText(result)).toContain('✅✅✅');
    });

    it('con todas pasadas muestra tres ⏭️', () => {
        const result = {
            totalTime: 30,
            perTrack: [
                { guessed: false, skipped: true },
                { guessed: false, skipped: true },
                { guessed: false, skipped: true },
            ],
        };
        expect(buildDailyShareText(result)).toContain('⏭️⏭️⏭️');
    });

    it('con todas falladas muestra tres ❌', () => {
        const result = {
            totalTime: 30,
            perTrack: [
                { guessed: false, skipped: false },
                { guessed: false, skipped: false },
                { guessed: false, skipped: false },
            ],
        };
        expect(buildDailyShareText(result)).toContain('❌❌❌');
    });
});

describe('buildPackShareText', () => {
    it('contiene el nombre del pack', () => {
        const text = buildPackShareText(baseResult, '90s Rock');
        expect(text).toContain('90s Rock');
    });

    it('usa "Pack" como fallback si no hay nombre', () => {
        const text = buildPackShareText(baseResult, null);
        expect(text).toContain('Pack');
    });

    it('contiene el tiempo total formateado', () => {
        const text = buildPackShareText(baseResult, '90s Rock');
        expect(text).toContain('42.50s');
    });

    it('contiene la fila de emojis correcta', () => {
        const text = buildPackShareText(baseResult, '90s Rock');
        expect(text).toContain('✅⏭️❌');
    });

    it('contiene la URL del frontend', () => {
        const text = buildPackShareText(baseResult, '90s Rock');
        expect(text).toContain('http://localhost:5173');
    });
});

describe('buildCustomShareText', () => {
    const sessionId = 'clsession12345678abcdef';

    it('contiene la URL de la sesión', () => {
        const text = buildCustomShareText(baseResult, sessionId);
        expect(text).toContain(`http://localhost:5173/session/${sessionId}`);
    });

    it('contiene el tiempo total formateado', () => {
        const text = buildCustomShareText(baseResult, sessionId);
        expect(text).toContain('42.50s');
    });

    it('contiene la fila de emojis correcta', () => {
        const text = buildCustomShareText(baseResult, sessionId);
        expect(text).toContain('✅⏭️❌');
    });

    it('contiene el conteo de aciertos', () => {
        const text = buildCustomShareText(baseResult, sessionId);
        expect(text).toContain('1/3');
    });
});