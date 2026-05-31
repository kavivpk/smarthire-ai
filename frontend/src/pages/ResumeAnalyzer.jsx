import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('PDF files only!');
    }
  };

  const handleSubmit = async () => {
    if (!file) return setError('Please select a PDF file');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await API.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Resume <span className="text-blue-500">Analyzer</span>
          </h1>
        </div>
        <ThemeToggle />
      </nav>

      <div className="max-w-3xl mx-auto p-6">

        {/* Upload Card */}
        {!result && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Upload Your Resume
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Get ATS score, skill gap analysis and improvement suggestions
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('fileInput').click()}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors"
              style={{
                borderColor: dragOver ? '#3b82f6' : file ? '#22c55e' : '#374151',
                backgroundColor: dragOver ? '#1e3a5f20' : 'transparent'
              }}
            >
              <div className="text-4xl mb-3">
                {file ? '✅' : '📄'}
              </div>
              {file ? (
                <>
                  <p className="text-green-500 font-medium">{file.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    Drop your PDF here
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    or click to browse · Max 5MB
                  </p>
                </>
              )}
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Analyzing...
                </span>
              ) : 'Analyze Resume'}
            </button>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="space-y-4">

            {/* ATS Score */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">ATS Score</p>
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={getScoreColor(result.atsScore)}
                    strokeWidth="2.5"
                    strokeDasharray={`${result.atsScore} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {result.atsScore}
                  </span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${getScoreColor(result.atsScore)}20`,
                  color: getScoreColor(result.atsScore)
                }}>
                {getScoreLabel(result.atsScore)}
              </span>
            </div>

            {/* Matched Skills */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-green-500">✓</span> Matched Skills ({result.matchedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((s, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-red-500">✗</span> Missing Skills ({result.missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((s, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                💡 Suggestions
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-blue-500 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Analyze another */}
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-xl transition-colors"
            >
              Analyze Another Resume
            </button>

          </div>
        )}
      </div>
    </div>
  );
}