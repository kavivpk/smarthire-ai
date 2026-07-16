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

  const studentFeatures = [
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
      title: 'Live Interview', desc: 'Take AI or Manual Interviews', accent: '#ef4444', path: '/live-interview',
    }
  ];

  const adminFeatures = [
    {
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
      title: 'Bulk Screening', desc: 'Parse, rank, and shortlist resumes', accent: '#3b82f6', path: '/bulk-screening',
    },
    {
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#ea580c" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      ),
      title: 'Fake Skill Detection', desc: 'Verify resume credibility and claims', accent: '#ea580c', path: '/fakeskill',
    },
    {
      symbol: (
        <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="#ef4444" />
        </svg>
      ),
      title: 'Live Interviews', desc: 'Conduct or Review Interviews', accent: '#ef4444', path: '/live-interview',
    }
  ];

  const features = isAdmin ? adminFeatures : studentFeatures;



  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="flex-1 flex flex-col" style={{ maxWidth: 1600, width: '100%', margin: '0 auto', padding: '24px' }}>

        {/* Welcome card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-5 transition-colors"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.15), 0 8px 24px -12px rgba(0,0,0,0.25)' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}
            className="text-gray-900 dark:text-white mb-1">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }}>
            Role: <span className="text-blue-500 font-semibold capitalize">{user.role}</span>
            &nbsp;·&nbsp; {isAdmin ? 'Manage platform activities and analytics' : 'Start your placement preparation today'}
          </p>
        </div>

        {/* Technical Stats Widget */}
        {!isAdmin && technicalStats?.recent && (
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
        <p className="text-gray-500 dark:text-gray-400 font-semibold mb-3 mt-6"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isAdmin ? 'Admin Features' : 'Student Features'}
        </p>

        {/* Feature cards */}
        <div className="grid gap-[24px] flex-1 pb-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => f.path && navigate(f.path)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 transition-all duration-200 flex flex-col text-center"
              style={{
                borderTop: `4px solid ${f.accent}`,
                cursor: f.path ? 'pointer' : 'default',
                opacity: f.path ? 1 : 0.6,
                boxShadow: `0 1px 2px rgba(0,0,0,0.15), 0 4px 16px -8px rgba(0,0,0,0.2), inset 0 0 0 1px ${f.accent}15`,
                minHeight: '250px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 6px 12px rgba(0,0,0,0.1), 0 24px 48px -12px rgba(0,0,0,0.25), inset 0 0 0 1px ${f.accent}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 1px 2px rgba(0,0,0,0.15), 0 4px 16px -8px rgba(0,0,0,0.2), inset 0 0 0 1px ${f.accent}15`;
              }}
            >
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${f.accent}25, ${f.accent}0a)`,
                    border: `1px solid ${f.accent}30`,
                  }}>
                  <div style={{ transform: 'scale(1.5)' }}>{f.symbol}</div>
                </div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24 }}
                  className="text-gray-900 dark:text-white mb-3">{f.title}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15 }}
                  className="text-gray-500 dark:text-gray-400 mb-6">{f.desc}</p>
              </div>
              <div className="flex items-center justify-center mt-auto">
                <span className="text-sm font-semibold px-6 py-2 rounded-full transition-colors" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif', 
                    color: f.accent, 
                    background: `${f.accent}15`,
                    border: `1px solid ${f.accent}30`
                  }}>
                  {f.path ? 'Open Feature →' : 'Coming soon'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
