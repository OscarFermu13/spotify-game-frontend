import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useSessionLoad from '../../hooks/useSessionLoad';

// Mockear axios antes de importar el hook
vi.mock('axios');
// Mockear react-router-dom para controlar navigate y location
vi.mock('react-router-dom');

import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// IDs en formato cuid válido para que no fallen validaciones internas
const SESSION_ID = 'clsession12345678abcdef';
const GAME_ID = 'clgame1234567890abcdefg';
const DAILY_GAME_ID = 'clgameda1ly567890abcdef';

// Respuesta base que devuelve GET /api/session/:id
function makeSessionResponse(source = 'custom', overrides = {}) {
    return {
        id: SESSION_ID,
        playlistUrl: 'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF',
        isPublic: true,
        penalty: 5,
        source,
        owner: { id: 'cluser123456789abcdefgh', displayName: 'Test User' },
        tracks: [],
        ...overrides,
    };
}

// navigate mock — lo mismo en todos los tests
const mockNavigate = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    // Por defecto location.state está vacío (sin gameId de pack)
    useLocation.mockReturnValue({ state: null });
});

describe('useSessionLoad', () => {
    describe('sesión custom', () => {
        it('carga la sesión y llama a join para obtener el gameId', async () => {
            axios.get.mockResolvedValueOnce({ data: makeSessionResponse('custom') });
            axios.post.mockResolvedValueOnce({ data: { gameId: GAME_ID } });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.session).toBeDefined();
            expect(result.current.session.source).toBe('custom');
            expect(result.current.gameId).toBe(GAME_ID);
            expect(result.current.error).toBeNull();

            // Debe haber llamado a join
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining(`/session/${SESSION_ID}/join`)
            );
        });

        it('expone la penalización de la sesión', async () => {
            axios.get.mockResolvedValueOnce({ data: makeSessionResponse('custom', { penalty: 10 }) });
            axios.post.mockResolvedValueOnce({ data: { gameId: GAME_ID } });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.penalty).toBe(10);
        });
    });

    describe('sesión daily', () => {
        it('llama a /api/daily en lugar de join', async () => {
            axios.get
                .mockResolvedValueOnce({ data: makeSessionResponse('daily') })
                .mockResolvedValueOnce({ data: { gameId: DAILY_GAME_ID, alreadyCompleted: false } });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.gameId).toBe(DAILY_GAME_ID);

            // No debe haber llamado a join
            expect(axios.post).not.toHaveBeenCalled();

            // Sí debe haber llamado a /api/daily
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/daily')
            );
        });

        it('expone alreadyCompleted correctamente para sesión daily', async () => {
            axios.get
                .mockResolvedValueOnce({ data: makeSessionResponse('daily') })
                .mockResolvedValueOnce({ data: { gameId: DAILY_GAME_ID, alreadyCompleted: true } });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.alreadyCompleted).toBe(true);
        });
    });

    describe('sesión pack', () => {
        it('usa el gameId de location.state y no llama a join', async () => {
            useLocation.mockReturnValue({
                state: { gameId: GAME_ID, packName: '90s Rock', packSlug: '90s-rock' },
            });
            axios.get.mockResolvedValueOnce({ data: makeSessionResponse('pack') });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.gameId).toBe(GAME_ID);
            expect(result.current.packName).toBe('90s Rock');

            // No debe haber llamado a join
            expect(axios.post).not.toHaveBeenCalled();
        });

        it('expone el packName desde location.state', async () => {
            useLocation.mockReturnValue({
                state: { gameId: GAME_ID, packName: 'Reggaeton Hits', packSlug: 'reggaeton-hits' },
            });
            axios.get.mockResolvedValueOnce({ data: makeSessionResponse('pack') });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.packName).toBe('Reggaeton Hits');
        });
    });

    describe('manejo de errores', () => {
        it('redirige a / si la respuesta es 401', async () => {
            axios.get.mockRejectedValueOnce({
                response: { status: 401, data: { code: 'NO_TOKEN' } },
            });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(mockNavigate).toHaveBeenCalledWith('/');
            expect(result.current.error).toBeNull();
        });

        it('setea el mensaje de error correcto para 403', async () => {
            axios.get.mockRejectedValueOnce({
                response: { status: 403, data: { code: 'ACCESS_DENIED' } },
            });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('No tienes acceso a esta sesión.');
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('setea el mensaje de error correcto para 404', async () => {
            axios.get.mockRejectedValueOnce({
                response: { status: 404, data: { code: 'NOT_FOUND' } },
            });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('Esta sesión no existe o ha sido eliminada.');
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('setea el mensaje de error correcto para 400', async () => {
            axios.get.mockRejectedValueOnce({
                response: { status: 400, data: { code: 'INVALID_ID' } },
            });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('El enlace de sesión no es válido.');
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('estado de carga', () => {
        it('empieza con loading: true y termina con loading: false', async () => {
            axios.get.mockResolvedValueOnce({ data: makeSessionResponse('custom') });
            axios.post.mockResolvedValueOnce({ data: { gameId: GAME_ID } });

            const { result } = renderHook(() => useSessionLoad(SESSION_ID));

            expect(result.current.loading).toBe(true);

            await waitFor(() => expect(result.current.loading).toBe(false));
        });

        it('no hace nada si sessionId es undefined', () => {
            const { result } = renderHook(() => useSessionLoad(undefined));

            // loading permanece true porque el useEffect hace early return
            // y no hay llamadas axios
            expect(axios.get).not.toHaveBeenCalled();
        });
    });
});