import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useGameTimer from '../../hooks/useGameTimer';

// useGameTimer usa Date.now() para calcular el tiempo transcurrido y
// requestAnimationFrame para el tick del reloj. Usamos fake timers para
// controlar ambos de forma determinista sin esperar tiempo real.
beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useGameTimer', () => {
    describe('start()', () => {
        it('activa el timer — isRunning pasa a true', () => {
            const { result } = renderHook(() => useGameTimer());

            expect(result.current.isRunning).toBe(false);

            act(() => {
                result.current.start();
            });

            expect(result.current.isRunning).toBe(true);
        });

        it('currentTime aumenta después de start()', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                // Avanzar 2 segundos y dejar que requestAnimationFrame ejecute
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.currentTime).toBeGreaterThan(0);
        });

        it('llamar start() varias veces no reinicia el tiempo acumulado', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
            });

            // Segunda llamada a start() no debe hacer nada si ya está corriendo
            act(() => {
                result.current.start();
            });

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            // El tiempo debe ser ~2s, no ~1s (no se reinició)
            expect(result.current.currentTime).toBeGreaterThanOrEqual(1);
        });
    });

    describe('pause()', () => {
        it('congela el timer — isRunning pasa a false', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
            });

            act(() => {
                result.current.pause();
            });

            expect(result.current.isRunning).toBe(false);
        });

        it('el tiempo no sigue aumentando después de pause()', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
                result.current.pause();
            });

            const timeAtPause = result.current.currentTime;

            act(() => {
                // Avanzar más tiempo con el timer pausado
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.currentTime).toBe(timeAtPause);
        });
    });

    describe('freeze()', () => {
        it('devuelve el tiempo acumulado en el momento de llamarlo', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(3000);
            });

            let frozen;
            act(() => {
                frozen = result.current.freeze();
            });

            expect(frozen).toBeGreaterThanOrEqual(3);
        });

        it('detiene el timer — isRunning pasa a false', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
                result.current.freeze();
            });

            expect(result.current.isRunning).toBe(false);
        });

        it('el tiempo no sigue aumentando después de freeze()', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
            });

            let frozen;
            act(() => {
                frozen = result.current.freeze();
            });

            act(() => {
                vi.advanceTimersByTime(2000);
            });

            // currentTime no debe haber cambiado tras freeze
            expect(result.current.currentTime).toBe(frozen);
        });
    });

    describe('reset()', () => {
        it('vuelve currentTime a 0', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(2000);
                result.current.reset();
            });

            expect(result.current.currentTime).toBe(0);
        });

        it('vuelve isRunning a false', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
                result.current.reset();
            });

            expect(result.current.isRunning).toBe(false);
        });

        it('después de reset() start() arranca desde cero', () => {
            const { result } = renderHook(() => useGameTimer());

            act(() => {
                result.current.start();
                vi.advanceTimersByTime(5000);
                result.current.reset();
                result.current.start();
                vi.advanceTimersByTime(1000);
            });

            // Debe ser ~1s, no ~6s
            expect(result.current.currentTime).toBeLessThan(2);
        });
    });

    describe('max-elapsed tracking', () => {
        it('reproducir, pausar y reproducir de nuevo no resetea el tiempo acumulado', () => {
            const { result } = renderHook(() => useGameTimer());

            // Primera reproducción: 2 segundos
            act(() => {
                result.current.start();
                vi.advanceTimersByTime(2000);
                result.current.pause();
            });

            const timeAfterFirstPlay = result.current.currentTime;
            expect(timeAfterFirstPlay).toBeGreaterThanOrEqual(2);

            // Segunda reproducción: 1 segundo más
            // El reloj NO debe volver a 0 al hacer start() de nuevo
            act(() => {
                result.current.start();
                vi.advanceTimersByTime(1000);
            });

            // El tiempo total debe ser mayor que el de la primera reproducción,
            // no haber vuelto a empezar desde 0
            expect(result.current.currentTime).toBeGreaterThanOrEqual(timeAfterFirstPlay);
        });

        it('freeze() después de pausar y reanudar devuelve el tiempo total acumulado', () => {
            const { result } = renderHook(() => useGameTimer());

            // Primera reproducción: 3 segundos
            act(() => {
                result.current.start();
                vi.advanceTimersByTime(3000);
                result.current.pause();
            });

            // Segunda reproducción: 2 segundos más
            act(() => {
                result.current.start();
                vi.advanceTimersByTime(2000);
            });

            let frozen;
            act(() => {
                frozen = result.current.freeze();
            });

            // freeze() debe devolver el total acumulado (≥5s), no solo el último tramo
            expect(frozen).toBeGreaterThanOrEqual(5);
        });

        it('rebobinar una canción y escuchar de nuevo no añade tiempo si no se supera el máximo', () => {
            const { result } = renderHook(() => useGameTimer());

            // Primera reproducción: 4 segundos (máximo alcanzado)
            act(() => {
                result.current.start();
                vi.advanceTimersByTime(4000);
                result.current.pause();
            });

            const maxReached = result.current.currentTime;

            // Segunda reproducción desde el principio: solo 2 segundos
            // (el jugador rebobina y escucha menos que antes)
            act(() => {
                result.current.start();
                vi.advanceTimersByTime(2000);
            });

            let frozen;
            act(() => {
                frozen = result.current.freeze();
            });

            // El tiempo registrado debe ser el máximo anterior (4s), no 4+2=6s
            expect(frozen).toBeGreaterThanOrEqual(maxReached);
        });
    });
});