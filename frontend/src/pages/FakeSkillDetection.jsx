import { useState } from 'react';


export default function FakeSkillDetection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (selectedFile) => {
    if (selectedFile?.type === 'application/pdf') {
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
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/api/fakeskill/detect', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Detection failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return { bg: '#ef444420', text: '#ef4444', border: '#ef444440' };
    if (severity === 'medium') return { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b40' };
    return { bg: '#3b82f620', text: '#3b82f6', border: '#3b82f640' };
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      <div className="max-w-4xl mx-auto p-6">

        {!result ? (
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Resume Credibility Check
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                AI detects exaggerated claims, unverified skills, and suspicious patterns in your resume
              </p>
            </div>

            {/* Upload */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('fsdFileInput').click()}
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: dragOver ? '#ef4444' : file ? '#22c55e' : '#374151',
                  backgroundColor: dragOver ? '#ef444410' : 'transparent'
                }}
              >
                <div className="text-4xl mb-3">{file ? '✅' : '🔍'}</div>
                {file ? (
                  <>
                    <p className="text-green-500 font-medium">{file.name}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Drop your resume PDF here
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      or click to browse · Max 5MB
                    </p>
                  </>
                )}
                <input
                  id="fsdFileInput"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="w-full mt-6 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
                style={{ backgroundColor: '#ef4444' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Detect Fake Skills 🔍'}
              </button>
            </div>

          </div>
        ) : (

          <div className="space-y-4">

            {/* Score + Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Credibility Score */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Credibility Score
                </p>
                <div className="relative w-36 h-36 mb-4">
                  <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5"/>
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={getScoreColor(result.credibility_score)}
                      strokeWidth="2.5"
                      strokeDasharray={`${result.credibility_score} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {result.credibility_score}
                    </span>
                    <span className="text-xs text-gray-500">/ 100</span>
                  </div>
                </div>
                <span className="text-sm font-medium px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: `${getScoreColor(result.credibility_score)}20`,
                    color: getScoreColor(result.credibility_score)
                  }}>
                  {result.verdict}
                </span>
              </div>

              {/* Summary stats */}
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 uppercase tracking-wide">
                    Summary
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Red Flags</span>
                      <span className="text-red-500 font-medium">{result.red_flags.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Suspicious Skills</span>
                      <span className="text-amber-500 font-medium">{result.suspicious_skills.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Skills Without Evidence</span>
                      <span className="text-blue-500 font-medium">{result.skills_without_evidence.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Credible Skills</span>
                      <span className="text-green-500 font-medium">{result.credible_skills.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                    💡 Recommendation
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {result.red_flags.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-red-500">🚨</span> Red Flags ({result.red_flags.length})
                </h3>
                <div className="space-y-2">
                  {result.red_flags.map((flag, i) => {
                    const colors = getSeverityColor(flag.severity);
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors.bg, color: colors.text }}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <span className="text-sm" style={{ color: colors.text }}>
                          {flag.detail}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suspicious Skills */}
            {result.suspicious_skills.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-amber-500">⚠️</span> Suspicious Skills
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suspicious_skills.map((item, i) => (
                    <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-amber-500 font-medium text-sm capitalize">
                          {item.skill}
                        </span>
                        <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          {item.claim}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {item.warning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills without evidence */}
            {result.skills_without_evidence.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-500">ℹ️</span> Skills Need More Context
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.skills_without_evidence.map((item, i) => (
                    <div key={i} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.skill}
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
                  → Add project descriptions or GitHub links to verify these skills
                </p>
              </div>
            )}

            {/* Credible skills */}
            {result.credible_skills.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Verified Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.credible_skills.map((skill, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: '#ef4444' }}
            >
              Check Another Resume 🔍
            </button>

          </div>
        )}
      </div>
    </div>
  );
}