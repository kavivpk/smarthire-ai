import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const features = [
  {
    symbol: (
      <svg width="28" height="28" fill="none" stroke="#3b82f6" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Resume Analyzer',
    desc: 'ATS Score + Skill Gap',
    phase: 'Phase 2',
    accent: '#3b82f6',
    path: '/resume',
  },
  {
    symbol: (
      <svg width="28" height="28" fill="none" stroke="#a855f7" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
    title: 'Mock Interview',
    desc: 'Technical + HR Questions',
    phase: 'Phase 2',
    accent: '#a855f7',
    path: '/interview',
  },
  {
    symbol: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Placement Prediction',
    desc: 'ML-based probability',
    phase: 'Phase 3',
    accent: '#22c55e',
      path: '/prediction',
  },
  {
    symbol: (
      <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Career Roadmap',
    desc: 'Personalized learning path',
    phase: 'Phase 3',
    accent: '#f59e0b',
    path: null,
  },
  {
    symbol: (
      <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    title: 'Skill Detection',
    desc: 'Fake skill warning',
    phase: 'Phase 3',
    accent: '#ef4444',
    path: null,
  },
  {
    symbol: (
      <svg width="28" height="28" fill="none" stroke="#14b8a6" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Analytics',
    desc: 'Performance tracking',
    phase: 'Phase 4',
    accent: '#14b8a6',
    path: null,
  },
  {
  title: "Career Roadmap",
  description: "Skill gap analysis & personalized 8-week learning plan",
  icon: "🗺️",
  path: "/career-roadmap",
  color: "from-indigo-500 to-purple-600"
}
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center transition-colors">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          SmartHire <span className="text-blue-500">AI</span>
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">

        {/* Welcome card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Role: <span className="text-blue-500 font-medium capitalize">{user.role}</span>
            &nbsp;·&nbsp; Start your placement preparation today
          </p>
        </div>

        {/* Features grid */}
        <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-3 text-xs uppercase tracking-widest">
          Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => f.path && navigate(f.path)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 transition-all duration-200"
              style={{
                borderTop: `3px solid ${f.accent}`,
                cursor: f.path ? 'pointer' : 'default',
                opacity: f.path ? 1 : 0.6,
              }}
            >
              {/* Icon */}
              <div
                className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${f.accent}18` }}
              >
                {f.symbol}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                {f.title}
              </h3>

              {/* Desc */}
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                {f.desc}
              </p>

              {/* Phase + status */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs px-2 py-1 rounded-md font-medium"
                  style={{ backgroundColor: `${f.accent}18`, color: f.accent }}
                >
                  {f.phase}
                </span>
                {f.path ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Open →
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}