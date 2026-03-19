import { useEffect, useState } from 'react';
import axios from 'axios';

let playerInstance = null;
let initPromise = null;

export default function useSpotifyPlayer(apiBase, token) {
  const [deviceId, setDeviceId] = useState(null);
  const [ready, setReady] = useState(false);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (playerInstance) {
      setPlayer(playerInstance);
      return;
    }

    if (initPromise) {
      initPromise.then((p) => {
        if (p) setPlayer(p);
      });
      return;
    }

    const getTokenHeaders = () =>
      token ? { Authorization: `Bearer ${token}` } : {};

    const initPlayer = () => {
      initPromise = new Promise((resolve) => {
        const p = new window.Spotify.Player({
          name: 'Spotify Quiz',
          getOAuthToken: async (cb) => {
            try {
              const r = await axios.get(`${apiBase}/api/me/token`, {
                headers: getTokenHeaders(),
              });
              cb(r.data.accessToken);
            } catch (e) {
              console.error('Token renew failed', e);
            }
          },
          volume: 0.5,
        });

        p.addListener('ready', ({ device_id }) => {
          console.log('Player listo, device_id:', device_id);
          playerInstance = p;
          setDeviceId(device_id);
          setReady(true);
          setPlayer(p);
          resolve(p);
        });

        p.addListener('not_ready', ({ device_id }) => {
          console.warn('Device offline', device_id);
          setReady(false);
          setDeviceId(null);
        });

        p.addListener('initialization_error', ({ message }) => {
          console.error('initialization_error:', message);
          resolve(null);
        });
        p.addListener('authentication_error', ({ message }) => {
          console.error('authentication_error:', message);
          resolve(null);
        });
        p.addListener('account_error', ({ message }) => {
          console.error('account_error — cuenta Premium requerida:', message);
          resolve(null);
        });

        p.connect();
      });

      return initPromise;
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }
  }, [apiBase, token]);

  return { player, deviceId, ready };
}