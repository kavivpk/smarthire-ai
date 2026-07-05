// // frontend/src/pages/AdminDashboard.jsx

// import { useEffect, useState } from "react";
// import API from "../services/api";
// import {
//   Chart as ChartJS,
//   CategoryScale, LinearScale,
//   BarElement, LineElement, PointElement,
//   ArcElement, Title, Tooltip, Legend
// } from "chart.js";
// import { Bar, Line, Doughnut } from "react-chartjs-2";

// ChartJS.register(
//   CategoryScale, LinearScale,
//   BarElement, LineElement, PointElement,
//   ArcElement, Title, Tooltip, Legend
// );

// const StatCard = ({ icon, label, value, color }) => (
//   <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border-l-4 ${color}`}>
//     <p className="text-2xl">{icon}</p>
//     <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
//     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
//   </div>
// );

// export default function AdminDashboard() {
//   const [stats, setStats]       = useState(null);
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading]   = useState(true);
//   const [error, setError]       = useState("");

//   // Question Upload State
//   const [qSection, setQSection] = useState('Analytical');
//   const [qText, setQText]       = useState('');
//   const [qOpt0, setQOpt0]       = useState('');
//   const [qOpt1, setQOpt1]       = useState('');
//   const [qOpt2, setQOpt2]       = useState('');
//   const [qOpt3, setQOpt3]       = useState('');
//   const [qAns, setQAns]         = useState(0);
//   const [qLoading, setQLoading] = useState(false);
//   const [qMsg, setQMsg]         = useState('');

//   const handleAddQuestion = async (e) => {
//     e.preventDefault();
//     setQLoading(true);
//     setQMsg('');
//     try {
//       await API.post("/admin/questions/aptitude", {
//         section: qSection,
//         question: qText,
//         options: [qOpt0, qOpt1, qOpt2, qOpt3],
//         answer: Number(qAns)
//       });
//       setQMsg('Question added successfully!');
//       setQText(''); setQOpt0(''); setQOpt1(''); setQOpt2(''); setQOpt3(''); setQAns(0);
//     } catch (err) {
//       setQMsg(err.response?.data?.message || 'Failed to add question');
//     }
//     setQLoading(false);
//   };

//   useEffect(() => {
//     Promise.all([
//       API.get("/admin/stats"),
//       API.get("/admin/students")
//     ])
//       .then(([statsRes, studentsRes]) => {
//         setStats(statsRes.data);
//         setStudents(studentsRes.data);
//       })
//       .catch(() => setError("Failed to load admin data. Are you logged in as admin?"))
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//       <p className="text-gray-500 dark:text-gray-400 text-lg">⏳ Loading dashboard...</p>
//     </div>
//   );

//   if (error) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//       <p className="text-red-500 text-lg">{error}</p>
//     </div>
//   );

//   // Chart data — Topic Bar Chart
//   const topicChartData = {
//     labels: stats.topicStats.map((t) => t._id || "Unknown"),
//     datasets: [{
//       label: "Interviews per Topic",
//       data: stats.topicStats.map((t) => t.count),
//       backgroundColor: [
//         "#3B82F6", "#10B981", "#F59E0B",
//         "#EF4444", "#8B5CF6"
//       ],
//       borderRadius: 8
//     }]
//   };

//   // Chart data — Daily Registrations Line Chart
//   const lineChartData = {
//     labels: stats.dailyRegistrations.map((d) => d._id),
//     datasets: [{
//       label: "New Students",
//       data: stats.dailyRegistrations.map((d) => d.count),
//       borderColor: "#3B82F6",
//       backgroundColor: "rgba(59,130,246,0.1)",
//       fill: true,
//       tension: 0.4,
//       pointRadius: 5
//     }]
//   };

//   // Chart data — Overview Doughnut
//   const doughnutData = {
//     labels: ["Resumes Uploaded", "Interviews Taken"],
//     datasets: [{
//       data: [stats.totalResumes, stats.totalInterviews],
//       backgroundColor: ["#10B981", "#3B82F6"],
//       borderWidth: 0
//     }]
//   };

//   const chartOptions = {
//     responsive: true,
//     plugins: { legend: { position: "bottom" } }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
//       <div className="max-w-6xl mx-auto">

//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
//             🛡️ Admin Dashboard
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1">
//             SmartHire AI — Student Analytics &amp; Platform Stats
//           </p>
//         </div>

//         {/* Stat Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//           <StatCard icon="👥" label="Total Students"     value={stats.totalStudents}   color="border-blue-500"   />
//           <StatCard icon="📄" label="Resumes Uploaded"   value={stats.totalResumes}    color="border-green-500"  />
//           <StatCard icon="🎤" label="Interviews Taken"   value={stats.totalInterviews} color="border-yellow-500" />
//           <StatCard icon="⭐" label="Avg Interview Score" value={`${stats.avgScore}%`} color="border-purple-500" />
//         </div>

//         {/* Charts Row */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           {/* Bar Chart */}
//           <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
//             <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
//               📊 Interviews by Topic
//             </h2>
//             {stats.topicStats.length > 0
//               ? <Bar data={topicChartData} options={chartOptions} />
//               : <p className="text-gray-400 text-sm">No interview data yet.</p>
//             }
//           </div>

//           {/* Doughnut */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
//             <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
//               🍩 Platform Overview
//             </h2>
//             <Doughnut data={doughnutData} options={chartOptions} />
//           </div>
//         </div>

//         {/* Line Chart */}
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-8">
//           <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
//             📈 Student Registrations (Last 7 Days)
//           </h2>
//           {stats.dailyRegistrations.length > 0
//             ? <Line data={lineChartData} options={chartOptions} />
//             : <p className="text-gray-400 text-sm">No registration data in last 7 days.</p>
//           }
//         </div>

//         {/* Students Table */}
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-8">
//           <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
//             👥 All Students
//           </h2>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
//                   <th className="pb-3 pr-4">#</th>
//                   <th className="pb-3 pr-4">Name</th>
//                   <th className="pb-3 pr-4">Email</th>
//                   <th className="pb-3 pr-4">ATS Score</th>
//                   <th className="pb-3 pr-4">Interviews</th>
//                   <th className="pb-3 pr-4">Avg Score</th>
//                   <th className="pb-3">Joined</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {students.length === 0 && (
//                   <tr>
//                     <td colSpan={7} className="text-gray-400 py-4 text-center">
//                       No students yet.
//                     </td>
//                   </tr>
//                 )}
//                 {students.map((s, i) => (
//                   <tr key={s._id}
//                       className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
//                     <td className="py-3 pr-4 text-gray-400">{i + 1}</td>
//                     <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">{s.name}</td>
//                     <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.email}</td>
//                     <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.resumeScore || 'N/A'}</td>
//                     <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.interviewsTaken || 0}</td>
//                     <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.avgInterviewScore || 'N/A'}</td>
//                     <td className="py-3 text-gray-500 dark:text-gray-400">
//                       {new Date(s.createdAt).toLocaleDateString()}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Upload Question Form */}
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-8">
//           <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
//             ➕ Add Aptitude Question
//           </h2>
//           {qMsg && (
//             <div className={`mb-4 px-4 py-2 rounded-xl text-sm ${qMsg.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//               {qMsg}
//             </div>
//           )}
//           <form onSubmit={handleAddQuestion} className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Section</label>
//                 <select value={qSection} onChange={e => setQSection(e.target.value)}
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500">
//                   <option value="Analytical">Analytical</option>
//                   <option value="Logical">Logical</option>
//                   <option value="Technical">Technical</option>
//                   <option value="General">General</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Question</label>
//                 <input type="text" value={qText} onChange={e => setQText(e.target.value)} required
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
//               </div>
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 1</label>
//                 <input type="text" value={qOpt0} onChange={e => setQOpt0(e.target.value)} required
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
//               </div>
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 2</label>
//                 <input type="text" value={qOpt1} onChange={e => setQOpt1(e.target.value)} required
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
//               </div>
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 3</label>
//                 <input type="text" value={qOpt2} onChange={e => setQOpt2(e.target.value)} required
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
//               </div>
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 4</label>
//                 <input type="text" value={qOpt3} onChange={e => setQOpt3(e.target.value)} required
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
//               </div>
//               <div>
//                 <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Correct Answer</label>
//                 <select value={qAns} onChange={e => setQAns(e.target.value)}
//                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500">
//                   <option value={0}>Option 1</option>
//                   <option value={1}>Option 2</option>
//                   <option value={2}>Option 3</option>
//                   <option value={3}>Option 4</option>
//                 </select>
//               </div>
//             </div>
//             <button type="submit" disabled={qLoading}
//               className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
//               {qLoading ? 'Adding...' : 'Add Question'}
//             </button>
//           </form>
//         </div>

//       </div>
//     </div>
//   );
// }



import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import API from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend
);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/students')
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (studentId) => {
    try {
      const res = await API.get(`/admin/students/${studentId}`);
      setStudentDetail(res.data);
      setSelectedStudent(studentId);
    } catch (error) {
      console.error('Failed to fetch student detail:', error);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart data
  const monthlyChartData = {
    labels: stats?.monthlyData?.map(d =>
      `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`
    ) || [],
    datasets: [{
      label: 'New Students',
      data: stats?.monthlyData?.map(d => d.count) || [],
      backgroundColor: '#3b82f620',
      borderColor: '#3b82f6',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 5,
    }]
  };

  const topicChartData = {
    labels: stats?.topicData?.map(d => d._id) || [],
    datasets: [{
      data: stats?.topicData?.map(d => d.count) || [],
      backgroundColor: [
        '#3b82f6', '#a855f7', '#22c55e',
        '#f59e0b', '#ef4444', '#14b8a6', '#f97316'
      ],
      borderWidth: 0,
    }]
  };

  const atsChartData = {
    labels: ['0-25 (Low)', '25-50 (Avg)', '50-75 (Good)', '75-100 (Great)'],
    datasets: [{
      label: 'Students',
      data: stats?.atsDistribution?.map(d => d.count) || [0, 0, 0, 0],
      backgroundColor: ['#ef444440', '#f59e0b40', '#3b82f640', '#22c55e40'],
      borderColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: '#1f293720' },
        ticks: { color: '#9ca3af', font: { size: 11 } }
      },
      y: {
        grid: { color: '#1f293720' },
        ticks: { color: '#9ca3af', font: { size: 11 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9ca3af', padding: 12, font: { size: 11 } }
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Platform analytics and student performance overview
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {['overview', 'students', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={{
              backgroundColor: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#1f2937' : '#9ca3af',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Students', value: stats?.totalStudents || 0, color: '#3b82f6', icon: (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )
              },
              {
                label: 'Resumes Analyzed', value: stats?.totalResumes || 0, color: '#22c55e', icon: (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )
              },
              {
                label: 'Interviews Done', value: stats?.totalInterviews || 0, color: '#a855f7', icon: (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                )
              },
              {
                label: 'Avg ATS Score', value: `${stats?.avgATS || 0}%`, color: '#f59e0b', icon: (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                )
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Monthly registrations */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Student Registrations (Monthly)
              </h3>
              {stats?.monthlyData?.length > 0 ? (
                <Line data={monthlyChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No data yet
                </div>
              )}
            </div>

            {/* Interview topics */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Interview Topics Distribution
              </h3>
              {stats?.topicData?.length > 0 ? (
                <Doughnut data={topicChartData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No interviews yet
                </div>
              )}
            </div>
          </div>

          {/* ATS Distribution */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
              ATS Score Distribution
            </h3>
            <Bar data={atsChartData} options={chartOptions} />
          </div>

          {/* Performance summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Platform Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Avg Resume ATS Score', value: `${stats?.avgATS || 0}/100`, color: '#3b82f6', pct: stats?.avgATS || 0 },
                  { label: 'Avg Interview Score', value: `${stats?.avgInterview || 0}/10`, color: '#a855f7', pct: (stats?.avgInterview || 0) * 10 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="font-medium" style={{ color: item.color }}>{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent students */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Recent Registrations
              </h3>
              <div className="space-y-3">
                {students.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold flex-shrink-0">
                      {s.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{s.name}</p>
                      <p className="text-gray-400 text-xs truncate">{s.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No students yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="space-y-4">

          {/* Search */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex gap-3">
            <div className="flex-1 relative">
              <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"
                className="absolute left-3 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name or email..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-gray-400 flex items-center">
              {filteredStudents.length} students
            </div>
          </div>

          {/* Students table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</div>
              <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</div>
              <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</div>
              <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No students found</div>
            ) : (
              filteredStudents.map((student, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold flex-shrink-0">
                      {student.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-gray-900 dark:text-white text-sm font-medium truncate">
                      {student.name}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm truncate">{student.email}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <button
                      onClick={() => fetchStudentDetail(student._id)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Student detail modal */}
          {selectedStudent && studentDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-y-auto"
                style={{ maxHeight: '85vh' }}>

                {/* Modal header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                      {studentDetail.student?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {studentDetail.student?.name}
                      </h2>
                      <p className="text-gray-400 text-xs">{studentDetail.student?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedStudent(null); setStudentDetail(null); }}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">

                  {/* Resume history */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                      Resume History ({studentDetail.resumes?.length || 0})
                    </h3>
                    {studentDetail.resumes?.length > 0 ? (
                      <div className="space-y-2">
                        {studentDetail.resumes.map((r, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div>
                              <p className="text-gray-900 dark:text-white text-sm">{r.fileName || 'Resume'}</p>
                              <p className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold"
                              style={{ color: r.atsScore >= 70 ? '#22c55e' : r.atsScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                              ATS: {r.atsScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No resumes analyzed yet</p>
                    )}
                  </div>

                  {/* Interview history */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                      Interview History ({studentDetail.interviews?.length || 0})
                    </h3>
                    {studentDetail.interviews?.length > 0 ? (
                      <div className="space-y-2">
                        {studentDetail.interviews.map((iv, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div>
                              <p className="text-gray-900 dark:text-white text-sm capitalize">{iv.topic} Interview</p>
                              <p className="text-gray-400 text-xs">{new Date(iv.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold"
                              style={{ color: iv.totalScore >= 7 ? '#22c55e' : iv.totalScore >= 4 ? '#f59e0b' : '#ef4444' }}>
                              {iv.totalScore}/10
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No interviews taken yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Monthly Growth
              </h3>
              <Line data={monthlyChartData} options={chartOptions} />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Interview Topics
              </h3>
              <Doughnut data={topicChartData} options={doughnutOptions} />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:col-span-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                ATS Score Distribution
              </h3>
              <Bar data={atsChartData} options={chartOptions} />
            </div>
          </div>

          {/* Top performers */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
              Platform Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: stats?.totalStudents || 0, color: '#3b82f6' },
                { label: 'Resumes Analyzed', value: stats?.totalResumes || 0, color: '#22c55e' },
                { label: 'Interviews Done', value: stats?.totalInterviews || 0, color: '#a855f7' },
                { label: 'Avg ATS Score', value: `${stats?.avgATS || 0}%`, color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-gray-400 text-xs">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}