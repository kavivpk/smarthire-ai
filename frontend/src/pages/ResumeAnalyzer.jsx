import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useTheme } from '../context/useTheme';

export default function ResumeAnalyzer() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') { setFile(selectedFile); setError(''); }
    else setError('PDF files only!');
  };

  const handleSubmit = async () => {
    if (!file) return setError('Please select a PDF file');
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await API.post('/resume/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const getScoreColor = (score) => score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const getScoreLabel = (score) => score >= 70 ? 'Excellent' : score >= 40 ? 'Average' : 'Needs Work';

  const cardCls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-all duration-200';
  const cardShadow = { boxShadow: '0 1px 2px rgba(0,0,0,0.15), 0 8px 24px -12px rgba(0,0,0,0.25)' };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-3xl mx-auto p-6">

        {!result && (
          <div className={cardCls} style={{ ...cardShadow, padding: 32 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}
              className="text-gray-900 dark:text-white mb-2">
              Upload Your Resume
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }}
              className="text-gray-500 dark:text-gray-400 mb-6">
              Get ATS score, skill gap analysis and improvement suggestions
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('fileInput').click()}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragOver ? '#3b82f6' : file ? '#22c55e' : isDark ? '#374151' : '#e5e7eb',
                backgroundColor: dragOver ? (isDark ? '#1e3a5f20' : '#eff6ff') : 'transparent',
              }}
            >
              <div className="text-4xl mb-3">{file ? '✅' : '📄'}</div>
              {file ? (
                <>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }} className="text-green-500">{file.name}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }} className="text-gray-500 dark:text-gray-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14.5 }} className="text-gray-700 dark:text-gray-300">Drop your PDF here</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }} className="text-gray-500 dark:text-gray-400 mt-1">or click to browse · Max 5MB</p>
                </>
              )}
              <input id="fileInput" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            {error && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5 }} className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <button onClick={handleSubmit} disabled={!file || loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 transition-all"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, fontWeight: 600, borderRadius: 12,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(37,99,235,0.25)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Analyzing...
                  </span>
                : 'Analyze Resume'}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">

            <div className="mb-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-all font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* ATS Score */}
            <div className={cardCls} style={{ ...cardShadow, padding: 24, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                className="text-gray-500 dark:text-gray-400 mb-3">ATS Score</p>
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={getScoreColor(result.atsScore)} strokeWidth="3"
                    strokeDasharray={`${result.atsScore} 100`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 34, fontWeight: 600, letterSpacing: '-0.01em', color: getScoreColor(result.atsScore) }}>
                    {result.atsScore}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }} className="text-gray-500">/ 100</span>
                </div>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600,
                backgroundColor: `${getScoreColor(result.atsScore)}20`, color: getScoreColor(result.atsScore),
                padding: '4px 14px', borderRadius: 999, border: `1px solid ${getScoreColor(result.atsScore)}40` }}>
                {getScoreLabel(result.atsScore)}
              </span>
            </div>

            {/* Matched Skills */}
            <div className={cardCls} style={{ ...cardShadow, padding: 24 }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16 }}
                className="text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-green-500">✓</span> Matched Skills ({result.matchedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((s, i) => (
                  <span key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5 }}
                    className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className={cardCls} style={{ ...cardShadow, padding: 24 }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16 }}
                className="text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-red-500">✗</span> Missing Skills ({result.missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((s, i) => (
                  <span key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5 }}
                    className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className={cardCls} style={{ ...cardShadow, padding: 24 }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16 }}
                className="text-gray-900 dark:text-white mb-3">
                💡 Suggestions
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, lineHeight: 1.6 }}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <span className="text-blue-500 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => { setResult(null); setFile(null); }}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 transition-all border border-gray-200 dark:border-gray-700"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, fontWeight: 500, borderRadius: 12 }}>
              Analyze Another Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
