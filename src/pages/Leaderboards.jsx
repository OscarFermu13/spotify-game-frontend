import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import GlobalTab from '../components/leaderboard/GlobalTab';
import SessionTab from '../components/leaderboard/SessionTab';
import DailyTab from '../components/leaderboard/DailyTab';
import PersonalTab from '../components/leaderboard/PersonalTab';


const TABS = [
  { key: 'daily', label: '🗓️ Hoy' },
  { key: 'global', label: '🌍 Global' },
  { key: 'session', label: '🎮 Sesión' },
  { key: 'me', label: '👤 Personal' },
];

export default function Leaderboards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionFromUrl = searchParams.get('session');
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl || (sessionFromUrl ? 'session' : 'daily');

  const handleTab = (key) => {
    if (key === 'session') {
      setSearchParams((prev) => { prev.set('tab', key); return prev; });
    } else {
      setSearchParams({ tab: key });
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Syne', sans-serif" }}>
        🏆 Leaderboards
      </h1>

      <div className="flex gap-1 mb-8 bg-slate-800/60 border border-slate-700/50 p-1 rounded-2xl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => handleTab(t.key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
              activeTab === t.key
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'daily'   && <DailyTab />}
        {activeTab === 'global'  && <GlobalTab />}
        {activeTab === 'session' && <SessionTab sessionId={sessionFromUrl} />}
        {activeTab === 'me'      && (
          <PersonalTab
            onNavigateToSession={(sid) => setSearchParams({ tab: 'session', session: sid })}
            onNavigateToDaily={() => setSearchParams({ tab: 'daily' })}
          />
        )}
      </div>
    </Layout>
  );
}