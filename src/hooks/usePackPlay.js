import { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/env';

export default function usePackPlay() {
    const navigate = useNavigate();
    const [playing, setPlaying] = useState(null); // slug del pack en curso

    const playPack = useCallback(async (pack) => {
        setPlaying(pack.slug);
        try {
            const { data } = await axios.post(`${API_BASE}/api/packs/${pack.slug}/play`);
            navigate(`/session/${data.sessionId}`, {
                state: {
                    gameId: data.gameId,
                    packName: data.packName,
                    packSlug: data.packSlug,
                },
            });
        } catch (e) {
            alert(e.response?.data?.error || 'No se pudo iniciar el pack.');
        } finally {
            setPlaying(null);
        }
    }, [navigate]);

    return { playing, playPack };
}