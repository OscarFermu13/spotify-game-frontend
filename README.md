# SpotifyQuiz - Frontend 🎵

> This repository contains the **React frontend** for SpotifyQuiz, a daily music guessing game. It integrates the Spotify Web Playback SDK for in-browser audio and communicates with a Node.js backend that proxies all Spotify API calls. The backend lives in a separate repository.

## 🎮 Project Overview

Players hear clips of songs and race to identify them as fast as possible. The faster the guess, the lower the score. Wrong guesses and skips add a time penalty. An optional hint system reveals progressively more information — each hint costs additional seconds.

Three play modes are supported:
- **Daily challenge** — the same 5 songs for every player worldwide, reshuffled each midnight UTC using a seeded PRNG. Results are shareable (Wordle-style emoji grid).
- **Packs** — curated thematic collections (90s Rock, Reggaeton, etc.) with a fresh random shuffle on each play.
- **Free mode** — any Spotify playlist, with a shareable session link for multiplayer.

## ⚡ Key Engineering Features

### 1. Spotify Web Playback SDK Integration

The browser plays audio directly through Spotify's SDK without any media files touching our servers.

- **Singleton player:** `useSpotifyPlayer` maintains a module-level player instance that survives React re-renders and page navigation. A mount counter ensures `player.disconnect()` is only called when every consumer has unmounted — this correctly handles React StrictMode's double-mount in development without creating two SDK instances.
- **Proxy token delivery:** The SDK's `getOAuthToken` callback fetches a fresh token from `GET /api/me/token` rather than reading from state or localStorage, keeping credentials off the client entirely.

### 2. Precise Game Timer

The timer uses `requestAnimationFrame` instead of `setInterval` for sub-millisecond accuracy and to avoid timer drift.

- **Max-elapsed tracking:** Pausing and replaying a song does not reset the clock. `maxElapsedRef` tracks the furthest point reached — only time spent listening beyond the previous maximum counts.
- **Freeze on result:** When the player guesses or skips, the timer freezes at the current value. It is reset only when `next()` advances to the following track.

### 3. Cookie-Based Authentication

The JWT lives in an HttpOnly cookie set by the server. The frontend never reads or stores it. A global Axios interceptor catches any 401 response and redirects to the home screen so the user can re-authenticate — this covers token expiry anywhere in the app without per-component error handling.

### 4. Leaderboards with Game Detail Drawer

- **Four tabs:** Daily, Global, Session, Personal.
- **Personal tab:** History segmented by source (daily / pack / custom), per-category stats, and a daily streak counter.
- **Game detail drawer:** Clicking any leaderboard row slides in a panel with the full track-by-track breakdown — name, cover, result, and time decomposed into base time, penalty, and hint cost.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | React 19 |
| Build tool | Vite 7 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3 |
| HTTP | Axios (global 401 interceptor) |
| Audio | Spotify Web Playback SDK |

## 🗄️ Session Types

`SessionPlay` handles three sources transparently:

| Source | Load strategy | Replay |
| :--- | :--- | :--- |
| `daily` | `GET /api/daily` — returns today's session and the user's game | Blocked server-side (`alreadyCompleted`) |
| `pack` | `gameId` passed via `location.state` (created by `/api/packs/:slug/play`) | New shuffle each play |
| `custom` | `GET /api/session/:id` + `POST /api/session/:id/join` (idempotent) | Allowed |

## 🚀 How to Run

### Prerequisites
- Node.js v18+
- The backend server running (see backend README)
- A Spotify account with **Premium** (required by the Web Playback SDK)

### Installation
```bash
git clone <repo>
cd spotify-quiz-client
npm install
```

### Configuration

Create a `.env` file in the root:
```env
VITE_API_BASE=http://localhost:4000
VITE_FRONTEND_URL=http://localhost:5173
```

### Start the app
```bash
# Development (with HMR)
npm run dev

# Production build
npm run build
```

The app will be available at `http://localhost:5173`.