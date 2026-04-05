import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useGuess({ apiBase }) {
  const [guessing, setGuessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchTerm.length <= 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/spotify/search`, {
          params: { q: searchTerm, type: 'track', limit: 5 },
        });
        setSearchResults(res.data.tracks.items);
      } catch (_) { }
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm, apiBase]);

  const openGuess = useCallback((onPause) => {
    if (guessing) { setGuessing(false); return; }
    onPause?.();
    setGuessing(true);
  }, [guessing]);

  const closeGuess = useCallback(() => {
    setGuessing(false);
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  return {
    guessing, setGuessing,
    searchTerm, setSearchTerm,
    searchResults,
    openGuess, closeGuess,
  };
}