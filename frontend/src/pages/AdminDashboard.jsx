// frontend/src/pages/AdminDashboard.jsx

import { useEffect, useState } from "react";
import API from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend
);

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border-l-4 ${color}`}>
    <p className="text-2xl">{icon}</p>
    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // Question Upload State
  const [qSection, setQSection] = useState('Analytical');
  const [qText, setQText]       = useState('');
  const [qOpt0, setQOpt0]       = useState('');
  const [qOpt1, setQOpt1]       = useState('');
  const [qOpt2, setQOpt2]       = useState('');
  const [qOpt3, setQOpt3]       = useState('');
  const [qAns, setQAns]         = useState(0);
  const [qLoading, setQLoading] = useState(false);
  const [qMsg, setQMsg]         = useState('');

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQLoading(true);
    setQMsg('');
    try {
      await API.post("/admin/questions/aptitude", {
        section: qSection,
        question: qText,
        options: [qOpt0, qOpt1, qOpt2, qOpt3],
        answer: Number(qAns)
      });
      setQMsg('Question added successfully!');
      setQText(''); setQOpt0(''); setQOpt1(''); setQOpt2(''); setQOpt3(''); setQAns(0);
    } catch (err) {
      setQMsg(err.response?.data?.message || 'Failed to add question');
    }
    setQLoading(false);
  };

  useEffect(() => {
    Promise.all([
      API.get("/admin/stats"),
      API.get("/admin/students")
    ])
      .then(([statsRes, studentsRes]) => {
        setStats(statsRes.data);
        setStudents(studentsRes.data);
      })
      .catch(() => setError("Failed to load admin data. Are you logged in as admin?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-500 dark:text-gray-400 text-lg">⏳ Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-red-500 text-lg">{error}</p>
    </div>
  );

  // Chart data — Topic Bar Chart
  const topicChartData = {
    labels: stats.topicStats.map((t) => t._id || "Unknown"),
    datasets: [{
      label: "Interviews per Topic",
      data: stats.topicStats.map((t) => t.count),
      backgroundColor: [
        "#3B82F6", "#10B981", "#F59E0B",
        "#EF4444", "#8B5CF6"
      ],
      borderRadius: 8
    }]
  };

  // Chart data — Daily Registrations Line Chart
  const lineChartData = {
    labels: stats.dailyRegistrations.map((d) => d._id),
    datasets: [{
      label: "New Students",
      data: stats.dailyRegistrations.map((d) => d.count),
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59,130,246,0.1)",
      fill: true,
      tension: 0.4,
      pointRadius: 5
    }]
  };

  // Chart data — Overview Doughnut
  const doughnutData = {
    labels: ["Resumes Uploaded", "Interviews Taken"],
    datasets: [{
      data: [stats.totalResumes, stats.totalInterviews],
      backgroundColor: ["#10B981", "#3B82F6"],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            SmartHire AI — Student Analytics &amp; Platform Stats
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="👥" label="Total Students"     value={stats.totalStudents}   color="border-blue-500"   />
          <StatCard icon="📄" label="Resumes Uploaded"   value={stats.totalResumes}    color="border-green-500"  />
          <StatCard icon="🎤" label="Interviews Taken"   value={stats.totalInterviews} color="border-yellow-500" />
          <StatCard icon="⭐" label="Avg Interview Score" value={`${stats.avgScore}%`} color="border-purple-500" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
              📊 Interviews by Topic
            </h2>
            {stats.topicStats.length > 0
              ? <Bar data={topicChartData} options={chartOptions} />
              : <p className="text-gray-400 text-sm">No interview data yet.</p>
            }
          </div>

          {/* Doughnut */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
              🍩 Platform Overview
            </h2>
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-8">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            📈 Student Registrations (Last 7 Days)
          </h2>
          {stats.dailyRegistrations.length > 0
            ? <Line data={lineChartData} options={chartOptions} />
            : <p className="text-gray-400 text-sm">No registration data in last 7 days.</p>
          }
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-8">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            👥 All Students
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">ATS Score</th>
                  <th className="pb-3 pr-4">Interviews</th>
                  <th className="pb-3 pr-4">Avg Score</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-gray-400 py-4 text-center">
                      No students yet.
                    </td>
                  </tr>
                )}
                {students.map((s, i) => (
                  <tr key={s._id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="py-3 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">{s.name}</td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.email}</td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.resumeScore || 'N/A'}</td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.interviewsTaken || 0}</td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.avgInterviewScore || 'N/A'}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Question Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-8">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            ➕ Add Aptitude Question
          </h2>
          {qMsg && (
            <div className={`mb-4 px-4 py-2 rounded-xl text-sm ${qMsg.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {qMsg}
            </div>
          )}
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Section</label>
                <select value={qSection} onChange={e => setQSection(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500">
                  <option value="Analytical">Analytical</option>
                  <option value="Logical">Logical</option>
                  <option value="Technical">Technical</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Question</label>
                <input type="text" value={qText} onChange={e => setQText(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 1</label>
                <input type="text" value={qOpt0} onChange={e => setQOpt0(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 2</label>
                <input type="text" value={qOpt1} onChange={e => setQOpt1(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 3</label>
                <input type="text" value={qOpt2} onChange={e => setQOpt2(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Option 4</label>
                <input type="text" value={qOpt3} onChange={e => setQOpt3(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm block mb-1">Correct Answer</label>
                <select value={qAns} onChange={e => setQAns(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500">
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={qLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
              {qLoading ? 'Adding...' : 'Add Question'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
