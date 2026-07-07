import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const [technicalStats, setTechnicalStats] = useState(null);

  useEffect(() => {
    API.get('/interview/technical-stats')
      .then((res) => setTechnicalStats(res.data))
      .catch(() => setTechnicalStats(null));
  }, []);

  const features = [
    // ── Student-facing core features (always visible) ──
    {
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#3b82f6" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      title: 'Resume Analyzer', desc: 'ATS Score + Skill Gap Analysis', accent: '#3b82f6', path: '/resume',
    },
    {
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#a855f7" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      ),
      title: 'Mock Interview', desc: 'Topic-based & Resume-based Practice', accent: '#a855f7', path: '/interview',
    },
    {
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="#ef4444" />
        </svg>
      ),
      title: 'Live Interview', desc: 'AI Interview · Manual Interview', accent: '#ef4444', path: '/live-interview',
    },
    // ── Admin-only features ──
    ...(isAdmin ? [{
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#14b8a6" strokeWidth="1.75" viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Admin Dashboard', desc: 'Student analytics + Charts', accent: '#14b8a6', path: '/admin',
    },
    {
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#3b82f6" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Bulk Screening', desc: 'Parse and rank resumes', accent: '#3b82f6', path: '/bulk-screening',
    }] : []),
  ];


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Welcome card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-5 transition-colors"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.15), 0 8px 24px -12px rgba(0,0,0,0.25)' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}
            className="text-gray-900 dark:text-white mb-1">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }}>
            Role: <span className="text-blue-500 font-semibold capitalize">{user.role}</span>
            &nbsp;·&nbsp; Start your placement preparation today
          </p>
        </div>

        {/* Technical Stats Widget */}
        {technicalStats?.recent && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-5"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 16px -8px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600 }}
                  className="text-gray-900 dark:text-white mb-1">
                  Recent Technical Interview
                </h3>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                  Last: {new Date(technicalStats.recent.lastInterviewDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 600,
                  color: technicalStats.recent.overallScore >= 7 ? '#22c55e' : technicalStats.recent.overallScore >= 4 ? '#f59e0b' : '#ef4444' }}>
                  {technicalStats.recent.overallScore}/10
                </div>
                <p className="text-gray-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Overall Score</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: 'Average Score', value: `${technicalStats.averageScore}/10` },
                { label: 'Total Interviews', value: technicalStats.totalInterviews },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-400 text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 15 }}
                    className="text-gray-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features label */}
        <p className="text-gray-500 dark:text-gray-400 font-semibold mb-3"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Features
        </p>

        {/* Feature cards */}
        <div className="grid gap-[18px]"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => f.path && navigate(f.path)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 transition-all duration-200"
              style={{
                borderTop: `3px solid ${f.accent}`,
                cursor: f.path ? 'pointer' : 'default',
                opacity: f.path ? 1 : 0.6,
                boxShadow: `0 1px 2px rgba(0,0,0,0.15), 0 4px 16px -8px rgba(0,0,0,0.2), inset 0 0 0 1px ${f.accent}15`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 4px 6px rgba(0,0,0,0.2), 0 16px 32px -12px rgba(0,0,0,0.35), inset 0 0 0 1px ${f.accent}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 1px 2px rgba(0,0,0,0.15), 0 4px 16px -8px rgba(0,0,0,0.2), inset 0 0 0 1px ${f.accent}15`;
              }}
            >
              <div className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${f.accent}25, ${f.accent}0a)`,
                  border: `1px solid ${f.accent}30`,
                }}>
                {f.symbol}
              </div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16 }}
                className="text-gray-900 dark:text-white mb-1">{f.title}</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}
                className="text-gray-500 dark:text-gray-400 mb-4">{f.desc}</p>
              <div className="flex items-center justify-end">
                <span className="text-xs text-gray-400 dark:text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {f.path ? 'Open →' : 'Coming soon'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
