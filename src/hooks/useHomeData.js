import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/env';

export default function useHomeData() {
  const [user, setUser] = useState(null);
  const [daily, setDaily] = useState(null);
  const [packs, setPacks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const [meResp, playlistsResp] = await Promise.all([
          axios.get(`${API_BASE}/api/me`),
          axios.get(`${API_BASE}/api/me/playlists`),
        ]);
        setUser({ name: meResp.data.displayName || meResp.data.spotifyId });
        setPlaylists(playlistsResp.data.playlists || []);
        setIsAuthenticated(true);
        axios.get(`${API_BASE}/api/daily`).then((r) => setDaily(r.data)).catch(() => { });
        axios.get(`${API_BASE}/api/packs`).then((r) => setPacks(r.data)).catch(() => { });
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };
    check();
  }, []);

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (_) { }
    setIsAuthenticated(false);
    setUser(null);
    setPlaylists([]);
    setDaily(null);
    setPacks([]);
  };

  return { user, daily, packs, playlists, isAuthenticated, authChecking, logout, setDaily, setPacks };
}