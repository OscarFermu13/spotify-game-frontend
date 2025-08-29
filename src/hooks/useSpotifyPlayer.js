import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useSpotifyPlayer(apiBase, token) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      // pedir access_token real al backend
      const resp = await axios.get(`${apiBase}/api/me/token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const accessToken = resp.data.accessToken;

      window.onSpotifyWebPlaybackSDKReady = () => {
        const p = new window.Spotify.Player({
          name: 'Spotify Quiz Player',
          getOAuthToken: async cb => {
            try {
              const r = await axios.get(`${apiBase}/api/me/token`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              cb(r.data.accessToken);
            } catch (e) {
              console.error('Token renew failed', e);
            }
          },
          volume: 0.5
        });

        // listeners
        p.addListener('ready', ({ device_id }) => {
          console.log('Player listo con device_id', device_id);
          setDeviceId(device_id);
          setReady(true);
        });
        p.addListener('not_ready', ({ device_id }) => {
          console.log('Device offline', device_id);
        });
        p.addListener('initialization_error', e => console.error(e));
        p.addListener('authentication_error', e => console.error(e));
        p.addListener('account_error', e => console.error(e));

        p.connect();
        setPlayer(p);
      };

      // si el script ya está cargado
      if (window.Spotify) {
        window.onSpotifyWebPlaybackSDKReady();
      }
    };

    load();
  }, [token, apiBase]);

  return { player, deviceId, ready };
}
