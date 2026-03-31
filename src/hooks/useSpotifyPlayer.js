import { useEffect, useState } from 'react';
import axios from 'axios';

let playerInstance = null;
let initPromise  = null;
let mountCount = 0; 

export default function useSpotifyPlayer(apiBase, token) {
  const [deviceId, setDeviceId] = useState(null);
  const [ready, setReady]       = useState(false);
  const [player, setPlayer]     = useState(null);

  useEffect(() => {
    mountCount += 1;

    if (playerInstance) {
      setPlayer(playerInstance);
      setReady(true);
      return () => {
        mountCount -= 1;
      };
    }

    if (initPromise) {
      initPromise.then((p) => { if (p) setPlayer(p); });
      return () => {
        mountCount -= 1;
      };
    }

    const initPlayer = () => {
      initPromise = new Promise((resolve) => {
        const p = new window.Spotify.Player({
          name: 'Spotify Quiz',
          getOAuthToken: async (cb) => {
            try {
              const r = await axios.get(`${apiBase}/api/me/token`);
              cb(r.data.accessToken);
            } catch (e) {
              console.error('[SpotifyPlayer] token renew failed', e);
            }
          },
          volume: 0.5,
        });

        p.addListener('ready', ({ device_id }) => {
          console.log('[SpotifyPlayer] ready, device_id:', device_id);
          playerInstance = p;
          setDeviceId(device_id);
          setReady(true);
          setPlayer(p);
          resolve(p);
        });

        p.addListener('not_ready', ({ device_id }) => {
          console.warn('[SpotifyPlayer] device offline', device_id);
          setReady(false);
          setDeviceId(null);
        });

        p.addListener('initialization_error', ({ message }) => {
          console.error('[SpotifyPlayer] initialization_error:', message);
          resolve(null);
        });
        p.addListener('authentication_error', ({ message }) => {
          console.error('[SpotifyPlayer] authentication_error:', message);
          resolve(null);
        });
        p.addListener('account_error', ({ message }) => {
          console.error('[SpotifyPlayer] account_error (Premium required):', message);
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

    return () => {
      mountCount -= 1;
      if (mountCount <= 0 && playerInstance) {
        console.log('[SpotifyPlayer] all instances unmounted, disconnecting');
        playerInstance.disconnect();
        playerInstance = null;
        initPromise    = null;
        mountCount     = 0;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally empty deps — the singleton should initialise once per tab
  // lifetime. apiBase/token changes don't require a new player instance.

  return { player, deviceId, ready };
}