import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import API from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  
  const [allInterviews, setAllInterviews] = useState([]);
  const [ivLoading, setIvLoading] = useState(false);
  const [ivSearch, setIvSearch] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qMsg, setQMsg] = useState('');
  const [qSection, setQSection] = useState('Analytical');
  const [qText, setQText] = useState('');
  const [qOpts, setQOpts] = useState(['','','','']);
  const [qAns, setQAns] = useState(0);
  
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  const [annLoading, setAnnLoading] = useState(false);
  const [annResult, setAnnResult] = useState('');

  useEffect(() => {
    if (user.role !== 'admin') { navigate('/dashboard'); return; }
    fetchMain();
  }, []);

  const fetchMain = async () => {
    setLoading(true);
    try {
      const [sRes, stuRes] = await Promise.all([API.get('/admin/stats'), API.get('/admin/students')]);
      setStats(sRes.data);
      setStudents(stuRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchStudentDetail = async (id) => {
    try {
      const res = await API.get(`/admin/students/${id}`);
      setStudentDetail(res.data);
      setSelectedStudent(id);
    } catch (e) { console.error(e); }
  };

  const fetchInterviews = async () => {
    setIvLoading(true);
    try {
      const res = await API.get('/admin/all-interviews');
      setAllInterviews(res.data);
    } catch (e) { console.error(e); }
    finally { setIvLoading(false); }
  };

  const fetchQuestions = async () => {
    setQLoading(true);
    try {
      const res = await API.get('/admin/questions/aptitude');
      setQuestions(res.data);
    } catch (e) { console.error(e); }
    finally { setQLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'interviews' && allInterviews.length === 0) fetchInterviews();
    if (activeTab === 'questions' && questions.length === 0) fetchQuestions();
  }, [activeTab]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQLoading(true); setQMsg('');
    try {
      await API.post('/admin/questions/aptitude', {
        section: qSection,
        question: qText,
        options: qOpts,
        answer: Number(qAns)
      });
      setQMsg('Question added successfully!');
      setQText(''); setQOpts(['','','','']); setQAns(0);
      fetchQuestions();
    } catch (err) {
      setQMsg('Failed: ' + (err.response?.data?.detail || 'error'));
    }
    setQLoading(false);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await API.delete(`/admin/questions/aptitude/${id}`);
      setQuestions(q => q.filter(x => x.id !== id));
    } catch (e) { alert('Delete failed'); }
  };

  const handleAnnounce = async (e) => {
    e.preventDefault();
    setAnnLoading(true); setAnnResult('');
    try {
      const res = await API.post('/admin/announce', { title: annTitle, message: annMsg });
      setAnnResult(`Sent to ${res.data.count} students!`);
      setAnnTitle(''); setAnnMsg('');
    } catch {
      setAnnResult('Failed to send announcement');
    }
    setAnnLoading(false);
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredInterviews = allInterviews.filter(iv =>
    iv.studentName?.toLowerCase().includes(ivSearch.toLowerCase()) ||
    iv.topic?.toLowerCase().includes(ivSearch.toLowerCase())
  );

  const monthlyChartData = {
    labels: stats?.monthlyData?.map(d => `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`) || [],
    datasets: [{
      label: 'New Students',
      data: stats?.monthlyData?.map(d => d.count) || [],
      backgroundColor: 'rgba(59,130,246,0.15)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 5
    }]
  };

  const topicChartData = {
    labels: stats?.topicData?.map(d => d._id) || [],
    datasets: [{
      data: stats?.topicData?.map(d => d.count) || [],
      backgroundColor: ['#3b82f6','#a855f7','#22c55e','#f59e0b','#ef4444','#14b8a6','#f97316'],
      borderWidth: 0
    }]
  };

  const atsChartData = {
    labels: ['0-25 (Low)', '25-50 (Fair)', '50-75 (Good)', '75-100 (Great)'],
    datasets: [{
      label: 'Students',
      data: stats?.atsDistribution?.map(d => d.count) || [0,0,0,0],
      backgroundColor: ['rgba(239,68,68,0.2)','rgba(245,158,11,0.2)','rgba(59,130,246,0.2)','rgba(34,197,94,0.2)'],
      borderColor: ['#ef4444','#f59e0b','#3b82f6','#22c55e'],
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const chartOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: 1, padding: 10,
        titleFont: { family: 'Sora, sans-serif', size: 12, weight: '600' },
        bodyFont: { family: 'Inter, sans-serif', size: 11 }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(75,85,99,0.15)' }, ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: 'rgba(75,85,99,0.15)' }, ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } } }
    }
  };

  const dOpts = {
    responsive: true, cutout: '65%',
    plugins: {
      tooltip: { backgroundColor: '#111827', padding: 10 },
      legend: { position: 'bottom', labels: { color: '#6b7280', padding: 14, font: { family: 'Inter', size: 11 } } }
    }
  };

  const sc = s => s >= 7 ? '#22c55e' : s >= 4 ? '#f59e0b' : '#ef4444';
  const tabEmoji = { overview: '📊', students: '👥', analytics: '📈', interviews: '🎤', questions: '❓', announce: '📢' };

  const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl ${className}`}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)' }}>
      {children}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14 }} className="text-gray-500 dark:text-gray-400">Loading admin dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}
              className="text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14.5 }} className="text-gray-500 dark:text-gray-400">
              Platform management & analytics — SmartHire AI
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/bulk-screening')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f630' }}>
              📋 Bulk Screening
            </button>
            <button onClick={fetchMain}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#a855f720', color: '#a855f7', border: '1px solid #a855f730' }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1.5 mb-6 p-1.5 rounded-2xl w-fit bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          {['overview', 'students', 'analytics', 'interviews', 'questions', 'announce'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all text-sm font-medium capitalize"
              style={{
                fontFamily: 'Inter,sans-serif',
                backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
                color: activeTab === tab ? 'white' : '#6b7280',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
              }}>
              <span>{tabEmoji[tab]}</span> {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: stats?.totalStudents || 0, color: '#3b82f6' },
                { label: 'Resumes Analyzed', value: stats?.totalResumes || 0, color: '#22c55e' },
                { label: 'Interviews Done', value: stats?.totalInterviews || 0, color: '#a855f7' },
                { label: 'Avg ATS Score', value: `${stats?.avgATS || 0}%`, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 transition-all duration-200"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)', borderTop: `4px solid ${s.color}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 32, fontWeight: 600, color: s.color, lineHeight: 1.1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500 }} className="text-gray-500 dark:text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            <Card className="p-5">
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'View All Students', emoji: '👥', tab: 'students', color: '#3b82f6' },
                  { label: 'Interview Reports', emoji: '🎤', tab: 'interviews', color: '#a855f7' },
                  { label: 'Add Questions', emoji: '❓', tab: 'questions', color: '#f59e0b' },
                  { label: 'Announce to All', emoji: '📢', tab: 'announce', color: '#22c55e' },
                ].map((a, i) => (
                  <button key={i} onClick={() => setActiveTab(a.tab)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                    style={{ borderColor: `${a.color}30`, backgroundColor: `${a.color}08` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}60`; e.currentTarget.style.backgroundColor = `${a.color}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${a.color}30`; e.currentTarget.style.backgroundColor = `${a.color}08`; }}>
                    <span style={{ fontSize: 24 }}>{a.emoji}</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">Monthly Registrations</h3>
                {stats?.monthlyData?.length > 0
                  ? <Line data={monthlyChartData} options={chartOpts} />
                  : <div className="h-40 flex items-center justify-center text-gray-400" style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No data yet</div>}
              </Card>
              <Card className="p-6">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">Interview Topics</h3>
                {stats?.topicData?.length > 0
                  ? <Doughnut data={topicChartData} options={dOpts} />
                  : <div className="h-40 flex items-center justify-center text-gray-400" style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No interviews yet</div>}
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white">Recent Registrations</h3>
                <button onClick={() => setActiveTab('students')} style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>View all →</button>
              </div>
              <div className="space-y-2">
                {students.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => { fetchStudentDetail(s.id); setActiveTab('students'); }}>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold flex-shrink-0">
                      {s.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500 }} className="text-gray-900 dark:text-white truncate">{s.name}</p>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400 truncate">{s.email}</p>
                    </div>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400 flex-shrink-0">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {students.length === 0 && (
                  <div className="py-8 text-center text-gray-400" style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No students yet</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">Platform Performance</h3>
              <div className="space-y-4">
                {[
                  { label: 'Avg Resume ATS Score', value: `${stats?.avgATS || 0}/100`, pct: stats?.avgATS || 0, color: '#3b82f6' },
                  { label: 'Avg Interview Score', value: `${stats?.avgInterview || 0}/10`, pct: (stats?.avgInterview || 0) * 10, color: '#a855f7' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* STUDENTS */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search students by name or email..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ fontFamily: 'Inter,sans-serif' }} />
                </div>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-400 flex-shrink-0">{filteredStudents.length}/{students.length}</span>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 grid grid-cols-12 gap-4">
                {[['Name', 5], ['Email', 4], ['Joined', 2], ['Action', 1]].map(([h, c]) => (
                  <div key={h} className={`col-span-${c} text-gray-500 dark:text-gray-400`}
                    style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {filteredStudents.length === 0 ? (
                <div className="py-16 text-center text-gray-400" style={{ fontFamily: 'Inter,sans-serif', fontSize: 14 }}>👥 No students found</div>
              ) : filteredStudents.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold flex-shrink-0">{s.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500 }} className="text-gray-900 dark:text-white truncate">{s.name}</p>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11 }} className="text-gray-400">Interviews: {s.interviewsTaken || 0}</p>
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-500 dark:text-gray-400 truncate">{s.email}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <button onClick={() => fetchStudentDetail(s.id)}
                      className="text-xs px-2 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#3b82f620', color: '#3b82f6' }}>View</button>
                  </div>
                </div>
              ))}
            </Card>

            {/* Student Detail Modal */}
            {selectedStudent && studentDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                  style={{ maxHeight: '85vh' }}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-lg">
                        {studentDetail.student?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600 }} className="text-gray-900 dark:text-white">{studentDetail.student?.name}</h2>
                        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400">{studentDetail.student?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedStudent(null); setStudentDetail(null); }}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">✕</button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-5">
                    <div>
                      <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14 }} className="text-gray-900 dark:text-white mb-3">
                        📄 Resume History ({studentDetail.resumes?.length || 0})
                      </h3>
                      {studentDetail.resumes?.length > 0 ? studentDetail.resumes.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2">
                          <div>
                            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500 }} className="text-gray-900 dark:text-white">{r.fileName || 'Resume'}</p>
                            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700, color: r.atsScore >= 70 ? '#22c55e' : r.atsScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                            ATS: {r.atsScore}%
                          </span>
                        </div>
                      )) : <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-400">No resumes yet</p>}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14 }} className="text-gray-900 dark:text-white mb-3">
                        🎤 Interview History ({studentDetail.interviews?.length || 0})
                      </h3>
                      {studentDetail.interviews?.length > 0 ? studentDetail.interviews.map((iv, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2">
                          <div>
                            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500 }} className="capitalize text-gray-900 dark:text-white">{iv.topic} Interview</p>
                            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400">{new Date(iv.createdAt).toLocaleDateString()} · {iv.totalQuestions} Qs</p>
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700, color: sc(iv.totalScore) }}>{iv.totalScore}/10</span>
                        </div>
                      )) : <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-400">No interviews yet</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">Monthly Growth</h3>
                <Line data={monthlyChartData} options={chartOpts} />
              </Card>
              <Card className="p-6">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">Interview Topics</h3>
                <Doughnut data={topicChartData} options={dOpts} />
              </Card>
              <Card className="p-6 md:col-span-2">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-4">ATS Score Distribution</h3>
                <Bar data={atsChartData} options={chartOpts} />
              </Card>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: stats?.totalStudents || 0, color: '#3b82f6' },
                { label: 'Resumes Analyzed', value: stats?.totalResumes || 0, color: '#22c55e' },
                { label: 'Interviews Done', value: stats?.totalInterviews || 0, color: '#a855f7' },
                { label: 'Avg ATS Score', value: `${stats?.avgATS || 0}%`, color: '#f59e0b' },
              ].map((item, i) => (
                <Card key={i} className="text-center p-4">
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 28, fontWeight: 600, color: item.color, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-400">{item.label}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* INTERVIEWS */}
        {activeTab === 'interviews' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" value={ivSearch} onChange={e => setIvSearch(e.target.value)}
                    placeholder="Search by student or topic..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    style={{ fontFamily: 'Inter,sans-serif' }} />
                </div>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-400 flex-shrink-0">{filteredInterviews.length} records</span>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 grid grid-cols-12 gap-3">
                {['Student', 'Topic', 'Qs', 'Score', 'Date'].map((h, i) => (
                  <div key={h} className={[`col-span-4`, `col-span-3`, `col-span-2`, `col-span-2`, `col-span-1`][i] + ` text-gray-500 dark:text-gray-400`}
                    style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {ivLoading ? (
                <div className="py-16 flex justify-center">
                  <svg className="animate-spin h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="py-16 text-center text-gray-400" style={{ fontFamily: 'Inter,sans-serif', fontSize: 14 }}>🎤 No interviews found</div>
              ) : filteredInterviews.map((iv, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold flex-shrink-0">{iv.studentName?.charAt(0)?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500 }} className="text-gray-900 dark:text-white truncate">{iv.studentName}</p>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11 }} className="text-gray-400 truncate">{iv.studentEmail}</p>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="px-2 py-1 rounded-md text-xs font-medium capitalize"
                      style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#a855f720', color: '#a855f7' }}>{iv.topic}</span>
                  </div>
                  <div className="col-span-2 flex items-center"><span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13 }} className="text-gray-600 dark:text-gray-300">{iv.totalQuestions}</span></div>
                  <div className="col-span-2 flex items-center"><span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700, color: sc(iv.totalScore) }}>{iv.totalScore}/10</span></div>
                  <div className="col-span-1 flex items-center"><span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11 }} className="text-gray-400">{iv.createdAt ? new Date(iv.createdAt).toLocaleDateString() : '—'}</span></div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-6">
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-5">➕ Add Aptitude Question</h3>
              {qMsg && (
                <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${qMsg.includes('success') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                  style={{ fontFamily: 'Inter,sans-serif' }}>{qMsg}</div>
              )}
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-gray-500 dark:text-gray-400 block mb-1.5">Section</label>
                  <select value={qSection} onChange={e => setQSection(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500"
                    style={{ fontFamily: 'Inter,sans-serif' }}>
                    {['Analytical', 'Logical', 'Technical', 'Verbal', 'Quantitative'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-gray-500 dark:text-gray-400 block mb-1.5">Question</label>
                  <textarea value={qText} onChange={e => setQText(e.target.value)} required rows={3} placeholder="Enter your question..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 resize-none"
                    style={{ fontFamily: 'Inter,sans-serif' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Option A', 'Option B', 'Option C', 'Option D'].map((label, i) => (
                    <div key={i}>
                      <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-gray-500 dark:text-gray-400 block mb-1.5">{label}</label>
                      <input type="text" value={qOpts[i]} onChange={e => { const o = [...qOpts]; o[i] = e.target.value; setQOpts(o); }} required placeholder={label}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                        style={{ fontFamily: 'Inter,sans-serif' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-gray-500 dark:text-gray-400 block mb-1.5">Correct Answer</label>
                  <select value={qAns} onChange={e => setQAns(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500"
                    style={{ fontFamily: 'Inter,sans-serif' }}>
                    {['Option A', 'Option B', 'Option C', 'Option D'].map((o, i) => <option key={i} value={i}>{o}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={qLoading}
                  className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#f59e0b', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                  {qLoading ? 'Adding...' : '➕ Add Question'}
                </button>
              </form>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white">Custom Questions ({questions.length})</h3>
                <button onClick={fetchQuestions} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#f59e0b20', color: '#f59e0b' }}>🔄 Refresh</button>
              </div>
              {qLoading ? (
                <div className="flex justify-center py-8"><svg className="animate-spin h-6 w-6 text-yellow-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                  <span style={{ fontSize: 36 }}>❓</span>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No custom questions yet</p>
                  <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 12 }} className="text-gray-300 text-center">Use the form on the left to add questions</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {questions.map(q => (
                    <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                          style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#f59e0b20', color: '#f59e0b' }}>{q.section}</span>
                        <button onClick={() => handleDeleteQuestion(q.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg text-red-500 transition-all"
                          style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#ef444415' }}>Delete</button>
                      </div>
                      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500, lineHeight: 1.5 }} className="text-gray-900 dark:text-white mb-2">{q.question}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {q.options.map((opt, j) => (
                          <p key={j} style={{ fontFamily: 'Inter,sans-serif', fontSize: 11 }}
                            className={j === q.answer ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-400'}>
                            {String.fromCharCode(65 + j)}) {opt}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ANNOUNCE */}
        {activeTab === 'announce' && (
          <div className="max-w-2xl space-y-5 mx-auto">
            <Card className="p-6">
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600 }} className="text-gray-900 dark:text-white mb-2">📢 Send Platform Announcement</h3>
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="text-gray-500 dark:text-gray-400 mb-6">
                Notify all {students.length} students via their notification bell.
              </p>
              {annResult && (
                <div className={`mb-5 px-4 py-3 rounded-xl text-sm ${annResult.includes('Sent') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                  style={{ fontFamily: 'Inter,sans-serif' }}>{annResult}</div>
              )}
              <form onSubmit={handleAnnounce} className="space-y-4">
                <div>
                  <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-gray-500 dark:text-gray-400 block mb-1.5">Title</label>
                  <input type="text" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required placeholder="e.g. New Mock Interview Topics Added!"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                    style={{ fontFamily: 'Inter,sans-serif' }} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="text-gray-500 dark:text-gray-400 block mb-1.5">Message</label>
                  <textarea value={annMsg} onChange={e => setAnnMsg(e.target.value)} required rows={5} placeholder="Type your message to all students..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
                    style={{ fontFamily: 'Inter,sans-serif' }} />
                </div>
                <button type="submit" disabled={annLoading}
                  className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ fontFamily: 'Inter,sans-serif', backgroundColor: '#22c55e', boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}>
                  {annLoading ? 'Sending...' : `📢 Send to All ${students.length} Students`}
                </button>
              </form>
            </Card>
            <Card className="p-5">
              <h4 style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600 }} className="text-gray-700 dark:text-gray-300 mb-3">💡 Tips</h4>
              <ul className="space-y-2">
                {[
                  'Use clear titles that grab student attention',
                  'Keep messages focused and actionable',
                  'Announce new features, upcoming assessments, or important updates',
                  'Notifications appear instantly in the student notification bell',
                ].map((tip, i) => (
                  <li key={i} style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }} className="flex gap-2 text-gray-500 dark:text-gray-400">
                    <span className="text-green-500 flex-shrink-0">•</span>{tip}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}