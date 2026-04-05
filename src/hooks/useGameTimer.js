import { useRef, useState, useEffect } from 'react';

export default function useGameTimer() {
  const playStartRef = useRef(null);
  const maxElapsedRef = useRef(0);
  const rafRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isRunning) {
      const tick = () => {
        if (playStartRef.current) {
          const elapsed = (Date.now() - playStartRef.current) / 1000;
          setCurrentTime(Math.max(maxElapsedRef.current, elapsed));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning]);

  const start = () => {
    if (!isRunning) {
      playStartRef.current = Date.now();
      setIsRunning(true);
    }
  };

  // Pausa el reloj y acumula el tiempo transcurrido hasta ahora
  const pause = () => {
    if (playStartRef.current) {
      maxElapsedRef.current = Math.max(
        maxElapsedRef.current,
        (Date.now() - playStartRef.current) / 1000
      );
      playStartRef.current = null;
    }
    setIsRunning(false);
  };

  // Congela el reloj y devuelve el tiempo acumulado (para registrar resultado)
  const freeze = () => {
    if (playStartRef.current) {
      maxElapsedRef.current = Math.max(
        maxElapsedRef.current,
        (Date.now() - playStartRef.current) / 1000
      );
      playStartRef.current = null;
    }
    setIsRunning(false);
    return maxElapsedRef.current;
  };

  // Resetea todo para la siguiente canción
  const reset = () => {
    maxElapsedRef.current = 0;
    playStartRef.current = null;
    setCurrentTime(0);
    setIsRunning(false);
  };

  return { currentTime, isRunning, start, pause, freeze, reset };
}