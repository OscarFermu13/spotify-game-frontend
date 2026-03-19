import { useEffect, useState } from "react";
import axios from "axios";

const API = 'http://127.0.0.1:4000';

export default function Leaderboards() {
  const [global, setGlobal] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [session, setSession] = useState([]);
  const [tab, setTab] = useState("global");

  const token = localStorage.getItem('token');

  useEffect(() => {
    console.log("🔑 TOKEN en Leaderboards:", token);
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API}/api/leaderboard/global`, { headers })
      .then(r => {
        console.log("GLOBAL:", r.data);
        setGlobal(Array.isArray(r.data) ? r.data : r.data.leaderboard || []);
      })
      .catch(err => console.error(err));

    axios.get(`${API}/api/leaderboard/user/cmfb41up20000fhfgi2rh0kyu`, { headers })
      .then(r => {
        console.log("PERSONAL:", r.data);
        setPersonal(Array.isArray(r.data) ? r.data : r.data.leaderboard || []);
      })
      .catch(err => console.error(err));

    axios.get(`${API}/api/leaderboard/session/cmftjlkq5000qe90h67qth6cz`, { headers }) 
      .then(r => {
        console.log("SESSION:", r.data);
        setSession(Array.isArray(r.data) ? r.data : r.data.leaderboard || []);
      })
      .catch(err => console.error(err));
  }, [token]);

  const data =
    tab === "global" ? global :
    tab === "personal" ? personal :
    session;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Leaderboards</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("global")}>Global</button>
        <button onClick={() => setTab("personal")}>Personal</button>
        <button onClick={() => setTab("session")}>Session</button>
      </div>

      <ul className="divide-y">
        {(Array.isArray(data) ? data : []).map((entry, idx) => (
          <li key={entry.userId || idx} className="flex justify-between py-2">
            <div className="flex items-center gap-2">
              <span>{idx + 1}.</span>
              <span>{entry.displayName}</span>
            </div>
            <span>{entry.totalTime?.toFixed(2)}s</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
