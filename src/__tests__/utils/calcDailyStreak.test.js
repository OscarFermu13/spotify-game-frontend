import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calcDailyStreak } from '../../utils/calcDailyStreak';

// Helper para construir entradas de historial
function makeEntry(daysAgo, source = 'daily') {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return { source, playedAt: date.toISOString() };
}

describe('calcDailyStreak', () => {
    describe('sin historial', () => {
        it('devuelve 0 con historial vacío', () => {
            expect(calcDailyStreak([])).toBe(0);
        });

        it('devuelve 0 si no hay entradas de tipo daily', () => {
            const history = [
                makeEntry(0, 'pack'),
                makeEntry(1, 'custom'),
            ];
            expect(calcDailyStreak(history)).toBe(0);
        });
    });

    describe('racha activa', () => {
        it('devuelve 1 si solo jugó hoy', () => {
            expect(calcDailyStreak([makeEntry(0)])).toBe(1);
        });

        it('devuelve 2 si jugó hoy y ayer', () => {
            expect(calcDailyStreak([makeEntry(0), makeEntry(1)])).toBe(2);
        });

        it('devuelve N para una racha de N días consecutivos', () => {
            const history = [0, 1, 2, 3, 4].map((d) => makeEntry(d));
            expect(calcDailyStreak(history)).toBe(5);
        });

        it('ignora entradas no-daily en el cálculo', () => {
            const history = [
                makeEntry(0, 'daily'),
                makeEntry(1, 'pack'),    // no cuenta
                makeEntry(1, 'daily'),   // este sí
                makeEntry(2, 'daily'),
            ];
            expect(calcDailyStreak(history)).toBe(3);
        });
    });

    describe('racha rota', () => {
        it('devuelve 1 si jugó hoy pero no ayer', () => {
            const history = [makeEntry(0), makeEntry(2)]; // gap en día 1
            expect(calcDailyStreak(history)).toBe(1);
        });

        it('devuelve 0 si la última entrada fue hace más de un día', () => {
            const history = [makeEntry(2), makeEntry(3), makeEntry(4)];
            expect(calcDailyStreak(history)).toBe(0);
        });

        it('no cuenta días posteriores al gap', () => {
            // Jugó días 0,1,2 — gap — días 5,6,7
            const history = [
                makeEntry(0), makeEntry(1), makeEntry(2),
                makeEntry(5), makeEntry(6), makeEntry(7),
            ];
            expect(calcDailyStreak(history)).toBe(3);
        });
    });

    describe('entradas duplicadas', () => {
        it('no cuenta el mismo día dos veces', () => {
            // Dos entradas del mismo día (mañana y tarde)
            const history = [makeEntry(0), makeEntry(0), makeEntry(1)];
            expect(calcDailyStreak(history)).toBe(2); // no 3
        });
    });

    describe('orden del historial', () => {
        it('funciona con historial en orden inverso (más antiguo primero)', () => {
            const history = [makeEntry(2), makeEntry(1), makeEntry(0)];
            expect(calcDailyStreak(history)).toBe(3);
        });

        it('funciona con historial desordenado', () => {
            const history = [makeEntry(1), makeEntry(0), makeEntry(2)];
            expect(calcDailyStreak(history)).toBe(3);
        });
    });
});