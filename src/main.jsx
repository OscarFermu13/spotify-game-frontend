import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import App from './App'
import SessionPlay from './pages/SessionPlay'
import Leaderboards from './pages/Leaderboards'
import Packs from './pages/Packs'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/session/:id" element={<SessionPlay />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/packs" element={<Packs />} />
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
              <h1 className="text-3xl font-extrabold mb-6 text-center text-slate-800">
                404 - Not found
              </h1>
            </div>
          </div>
        }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
