import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify('https://spotify-game-backend.onrender.com'),
    'import.meta.env.VITE_FRONTEND_URL': JSON.stringify('https://spotify-game-frontend-kappa.vercel.app'),
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
  },
});