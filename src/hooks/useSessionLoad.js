import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config/env';

const DEFAULT_PENALTY = 5;

export default function useSessionLoad(sessionId) {
    const navigate = useNavigate();
    const location = useLocation();

    const [session, setSession] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [penalty, setPenalty] = useState(DEFAULT_PENALTY);
    const [packName, setPackName] = useState(null);
    const [alreadyCompleted, setAlreadyCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionId) return;

        const load = async () => {
            try {
                setLoading(true);
                const sessionResp = await axios.get(`${API_BASE}/api/session/${sessionId}`);
                setSession(sessionResp.data);

                let resolvedGameId, completed;

                if (sessionResp.data.source === 'daily') {
                    const dailyResp = await axios.get(`${API_BASE}/api/daily`);
                    resolvedGameId = dailyResp.data.gameId;
                    completed = dailyResp.data.alreadyCompleted;
                } else {
                    const stateGameId = location.state?.gameId;
                    if (sessionResp.data.source === 'pack' && stateGameId) {
                        resolvedGameId = stateGameId;
                        setPackName(location.state?.packName ?? null);
                    } else {
                        const joinResp = await axios.post(`${API_BASE}/api/session/${sessionId}/join`);
                        resolvedGameId = joinResp.data.gameId || joinResp.data.id || joinResp.data.game?.id;
                    }
                    completed = false;
                }

                setGameId(resolvedGameId);
                setPenalty(sessionResp.data.penalty || DEFAULT_PENALTY);
                setAlreadyCompleted(completed);
            } catch (e) {
                console.error('Error cargando sesión:', e);
                if (e.response?.status === 401) navigate('/');
                else setError(e.response?.data?.error || 'No se pudo cargar la sesión.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [sessionId]); // eslint-disable-line

    return { session, gameId, penalty, packName, alreadyCompleted, loading, error };
}