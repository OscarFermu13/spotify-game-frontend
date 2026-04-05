import { useState, useCallback } from 'react';
import axios from 'axios';

export default function useGamePlayback({ apiBase, deviceId, ready, player }) {
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState(null);

  const play = useCallback(async (uri, onTimerStart) => {
    if (!ready || !deviceId) {
      alert('El reproductor no está listo. ¿Tienes cuenta Premium?');
      return;
    }
    if (!playing) {
      onTimerStart?.();
      setPlaying(true);
      setPlayError(null);
    }
    try {
      await axios.put(`${apiBase}/api/spotify/play`, { device_id: deviceId, uris: [uri] });
    } catch {
      setPlaying(false);
      setPlayError('No se pudo reproducir. Inténtalo de nuevo.');
    }
  }, [ready, deviceId, playing, apiBase]);

  const pause = useCallback(async (onTimerPause) => {
    if (!playing) return;
    onTimerPause?.();
    setPlaying(false);
    try { await player.pause(); } catch (_) { }
  }, [playing, player]);

  const stop = useCallback(async () => {
    setPlaying(false);
    try { await player?.pause(); } catch (_) { }
  }, [player]);

  const playFromPosition = useCallback(async (uri, positionMs) => {
    try {
      await axios.put(`${apiBase}/api/spotify/play`, {
        device_id: deviceId,
        uris: [uri],
        position_ms: positionMs,
      });
    } catch (e) {
      console.error('Auto-play failed', e.response?.data || e.message);
    }
  }, [apiBase, deviceId]);

  return { playing, playError, play, pause, stop, playFromPosition, setPlaying };
}