import { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/env';

export default function useCreateSession() {
  const [creating, setCreating] = useState(false);

  const createSession = async ({ playlistUrl, selectedPlaylist, count, penalty, onSuccess, onError }) => {
    const url = selectedPlaylist?.external_urls?.spotify || playlistUrl;
    if (!url) { onError?.('Selecciona o introduce una playlist.'); return; }
    setCreating(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/session/create`, {
        playlistUrl: url,
        isPublic: true,
        count,
        penalty,
      });
      onSuccess?.(resp.data.sessionId);
    } catch {
      onError?.('No se pudo crear la sesión.');
    } finally {
      setCreating(false);
    }
  };

  return { creating, createSession };
}