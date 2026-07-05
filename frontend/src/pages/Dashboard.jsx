import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === "admin";
  const [technicalStats, setTechnicalStats] = useState(null);

  useEffect(() => {
    API.get('/interview/technical-stats')
      .then((res) => setTechnicalStats(res.data))
      .catch(() => setTechnicalStats(null));
  }, []);

  const features = [
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#3b82f6" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      title: 'Resume Analyzer',
      desc: 'ATS Score + Skill Gap',
      accent: '#3b82f6',
      path: '/resume',
    },
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#a855f7" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      ),
      title: 'Mock Interview',
      desc: 'Technical + HR Questions',
      accent: '#a855f7',
      path: '/interview',
    },
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      title: 'Placement Prediction',
      desc: 'ML-based probability',
      accent: '#22c55e',
      path: '/prediction',
    },
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      ),
      title: 'Skill Detection',
      desc: 'Fake skill warning',
      accent: '#ef4444',
      path: '/fakeskill',
    },
    ...(isAdmin ? [{
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#14b8a6" strokeWidth="1.8" viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Analytics',
      desc: 'Student analytics + Charts',
      accent: '#14b8a6',
      path: '/admin',
    }] : []),
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: 'Career Roadmap',
      desc: 'Personalized learning path',
      accent: '#f59e0b',
      path: '/career-roadmap',
    },
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="#ef4444" />
        </svg>
      ),
      title: 'Live Interview',
      desc: 'Real-time AI + Admin interview',
      accent: '#ef4444',
      path: '/live-interview',
    },
    {
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#06b6d4" strokeWidth="1.8" viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      title: 'Coding Assessment',
      desc: 'AI-evaluated coding problems',
      accent: '#06b6d4',
      path: '/coding',
    },
    // Dashboard.jsx la user.role check pannunga:
    // features array appuram add pannunga:
    ...(user.role === 'admin' ? [{
      symbol: (
        <svg width="28" height="28" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      title: 'Admin Dashboard',
      desc: 'Student analytics + charts',
      phase: 'Phase 4',
      accent: '#6366f1',
      path: '/admin',
    }] : []),


  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
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

        {technicalStats?.recent && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Recent Technical Interview
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Last interview: {new Date(technicalStats.recent.lastInterviewDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: technicalStats.recent.overallScore >= 7 ? '#22c55e' : technicalStats.recent.overallScore >= 4 ? '#f59e0b' : '#ef4444' }}>
                  {technicalStats.recent.overallScore}/10
                </div>
                <p className="text-gray-400 text-xs">Overall Score</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Average Score</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{technicalStats.averageScore}/10</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Total Interviews</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{technicalStats.totalInterviews}</p>
              </div>
            </div>
          </div>
        )}

        {/* Features grid */}
        <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-3 text-xs uppercase tracking-widest">
          Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => f.path && navigate(f.path)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 transition-all duration-200 hover:shadow-lg"
              style={{
                borderTop: `3px solid ${f.accent}`,
                cursor: f.path ? 'pointer' : 'default',
                opacity: f.path ? 1 : 0.6,
              }}
            >
              <div
                className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${f.accent}18` }}
              >
                {f.symbol}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                {f.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                {f.desc}
              </p>
              <div className="flex items-center justify-end">
                {f.path ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Open →</span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
