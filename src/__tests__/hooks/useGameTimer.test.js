import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useGameTimer from '../../hooks/useGameTimer';

let rafCallback = null;
let rafId = 0;
let nowValue = 1000;

function flushRaf() {
    if (rafCallback) {
        const cb = rafCallback;
        rafCallback = null;
        act(() => { cb(); });
    }
}

beforeEach(() => {
    nowValue = 1000;
    rafId = 0;
    rafCallback = null;

    vi.spyOn(Date, 'now').mockImplementation(() => nowValue);

    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return ++rafId;
    });

    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {
        rafCallback = null;
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

function advanceMs(ms) {
    nowValue += ms;
}

describe('useGameTimer', () => {
    describe('start()', () => {
        it('activa el timer — isRunning pasa a true', () => {
            const { result } = renderHook(() => useGameTimer());

            expect(result.current.isRunning).toBe(false);

            act(() => { result.current.start(); });

            expect(result.current.isRunning).toBe(true);
        });

        it('currentTime aumenta después de start()', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(2000);
            flushRaf();

            expect(result.current.currentTime).toBeGreaterThan(0);
        });

        it('llamar start() varias veces no reinicia el tiempo acumulado', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(1000);
            flushRaf();

            const timeBefore = result.current.currentTime;
            expect(timeBefore).toBeGreaterThanOrEqual(1);

            act(() => { result.current.start(); });
            advanceMs(1000);
            flushRaf();

            expect(result.current.currentTime).toBeGreaterThanOrEqual(timeBefore);
        });
    });

    describe('pause()', () => {
        it('congela el timer — isRunning pasa a false', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            act(() => { result.current.pause(); });

            expect(result.current.isRunning).toBe(false);
        });

        it('el tiempo no sigue aumentando después de pause()', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(1000);
            flushRaf();

            act(() => { result.current.pause(); });
            const timeAtPause = result.current.currentTime;

            advanceMs(2000);
            flushRaf();

            expect(result.current.currentTime).toBe(timeAtPause);
        });
    });

    describe('freeze()', () => {
        it('devuelve el tiempo acumulado en el momento de llamarlo', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(3000);

            let frozen;
            act(() => { frozen = result.current.freeze(); });

            expect(frozen).toBeGreaterThanOrEqual(3);
        });

        it('detiene el timer — isRunning pasa a false', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            act(() => { result.current.freeze(); });

            expect(result.current.isRunning).toBe(false);
        });

        it('el tiempo no sigue aumentando después de freeze()', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(1000);
            flushRaf();

            let frozen;
            act(() => { frozen = result.current.freeze(); });

            advanceMs(2000);
            flushRaf();

            expect(result.current.currentTime).toBe(frozen);
        });
    });

    describe('reset()', () => {
        it('vuelve currentTime a 0', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(2000);
            flushRaf();
            act(() => { result.current.reset(); });

            expect(result.current.currentTime).toBe(0);
        });

        it('vuelve isRunning a false', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            act(() => { result.current.reset(); });

            expect(result.current.isRunning).toBe(false);
        });

        it('después de reset() start() arranca desde cero', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(5000);
            flushRaf();
            act(() => { result.current.reset(); });

            nowValue = 1000;

            act(() => { result.current.start(); });
            advanceMs(1000);
            flushRaf();

            expect(result.current.currentTime).toBeLessThan(2);
        });
    });

    describe('max-elapsed tracking', () => {
        it('reproducir, pausar y reproducir de nuevo no resetea el tiempo acumulado', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(2000);
            flushRaf();

            act(() => { result.current.pause(); });
            const timeAfterFirstPlay = result.current.currentTime;
            expect(timeAfterFirstPlay).toBeGreaterThanOrEqual(2);

            act(() => { result.current.start(); });
            advanceMs(1000);
            flushRaf();

            expect(result.current.currentTime).toBeGreaterThanOrEqual(timeAfterFirstPlay);
        });

        it('freeze() después de pausar y reanudar devuelve el tiempo total acumulado', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(3000);
            act(() => { result.current.pause(); });

            act(() => { result.current.start(); });
            advanceMs(2000);

            let frozen;
            act(() => { frozen = result.current.freeze(); });

            expect(frozen).toBeGreaterThanOrEqual(3);
        });

        it('rebobinar y escuchar de nuevo no añade tiempo si no supera el máximo anterior', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => { result.current.start(); });
            advanceMs(4000);
            flushRaf();

            act(() => { result.current.pause(); });
            const maxReached = result.current.currentTime;
            expect(maxReached).toBeGreaterThanOrEqual(4);

            act(() => { result.current.start(); });
            advanceMs(2000);

            let frozen;
            act(() => { frozen = result.current.freeze(); });

            expect(frozen).toBeGreaterThanOrEqual(maxReached);
        });
    });
});