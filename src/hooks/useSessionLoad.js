import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config/env';

const DEFAULT_PENALTY = 5;

// Mensajes de error legibles por código
const ERROR_MESSAGES = {
    NOT_FOUND: 'Esta sesión no existe o ha sido eliminada.',
    ACCESS_DENIED: 'No tienes acceso a esta sesión.',
    INVALID_ID: 'El enlace de sesión no es válido.',
    NO_TOKEN: null, // redirige sin mensaje
    INVALID_TOKEN: null,
    INVALID_USER: null,
};

function resolveErrorMessage(err) {
    const status = err.response?.status;
    const code = err.response?.data?.code;

    // Cualquier 401 redirige al home
    if (status === 401) return { redirect: true };

    // Usar el código si tenemos mensaje para él
    if (code && ERROR_MESSAGES[code] !== undefined) {
        return { message: ERROR_MESSAGES[code] ?? 'Error desconocido.' };
    }

    // Fallback por status HTTP
    if (status === 404) return { message: 'Esta sesión no existe o ha sido eliminada.' };
    if (status === 403) return { message: 'No tienes acceso a esta sesión.' };
    if (status === 400) return { message: 'El enlace de sesión no es válido.' };

    return { message: err.response?.data?.error || 'No se pudo cargar la sesión.' };
}

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
                const resolved = resolveErrorMessage(e);
                if (resolved.redirect) {
                    navigate('/');
                } else {
                    setError(resolved.message);
                }
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [sessionId]); // eslint-disable-line

    return { session, gameId, penalty, packName, alreadyCompleted, loading, error };
}