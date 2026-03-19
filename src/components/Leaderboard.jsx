import React from "react";

export default function Leaderboard({ title, data }) {
  return (
    <div className="bg-white shadow rounded-2xl p-4">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <ul className="divide-y">
        {data.map((entry, idx) => (
          <li
            key={entry.userId || idx}
            className="flex justify-between items-center py-2"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">{idx + 1}.</span>
              <span className="text-slate-800">{entry.displayName}</span>
            </div>
            <span className="text-slate-600">{entry.totalTime.toFixed(2)}s</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
