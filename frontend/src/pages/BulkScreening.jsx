import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../services/api';
import { useTheme } from '../context/useTheme';

export default function BulkScreening() {
  const { isDark } = useTheme();
  const [requirements, setRequirements] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [shortlisted, setShortlisted] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    if (!items) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (droppedFiles.length > 0) {
        setFiles((prev) => {
          const combined = [...prev, ...droppedFiles];
          return combined.slice(0, 1000);
        });
        setError('');
      } else {
        setError('Only PDF files are allowed!');
      }
      return;
    }

    const fileList = [];
    const traverseEntry = async (entry) => {
      if (entry.isFile) {
        if (entry.name.toLowerCase().endsWith('.pdf')) {
          const file = await new Promise((resolve) => entry.file(resolve));
          fileList.push(file);
        }
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readEntries = () => new Promise((resolve) => reader.readEntries(resolve));
        let entries = await readEntries();
        while (entries.length > 0) {
          for (const childEntry of entries) {
            await traverseEntry(childEntry);
          }
          entries = await readEntries();
        }
      }
    };

    const traversePromises = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        traversePromises.push(traverseEntry(entry));
      }
    }

    await Promise.all(traversePromises);

    if (fileList.length > 0) {
      setFiles((prev) => {
        const combined = [...prev, ...fileList];
        return combined.slice(0, 1000);
      });
      setError('');
    } else {
      setError('No PDF files found in the dropped items!');
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    if (selected.length > 0) {
      setFiles((prev) => {
        const combined = [...prev, ...selected];
        return combined.slice(0, 1000);
      });
      setError('');
    } else {
      setError('Only PDF files are allowed!');
    }
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (files.length === 0 || !requirements.trim()) {
      setError('Please add requirements and at least one resume');
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);
    setExpandedRows({});
    try {
      const formData = new FormData();
      formData.append('requirements', requirements);
      files.forEach((file) => formData.append('resumes', file));

      const res = await API.post('/bulk-screening/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res.data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Screening failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShortlist = (fileName) => {
    setShortlisted((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
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

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;
    const targetResults = results.filter(
      (r) => !showShortlistedOnly || shortlisted[r.fileName]
    );
    if (targetResults.length === 0) {
      alert("No candidates to export.");
      return;
    }
    const headers = ["Candidate Name / Filename", "ATS Match Score", "Matched Skills", "Missing Skills", "Status", "Shortlisted"];
    const rows = targetResults.map((r) => {
      const matchScore = r.error ? "Failed" : `${r.atsScore}%`;
      const matched = r.error ? "" : (r.matchedSkills || []).join("; ");
      const missing = r.error ? "" : (r.missingSkills || []).join("; ");
      const status = r.error ? "Failed" : getScoreLabel(r.atsScore);
      const isStarred = shortlisted[r.fileName] ? "Yes" : "No";
      return [
        `"${r.fileName.replace(/"/g, '""')}"`,
        `"${matchScore}"`,
        `"${matched.replace(/"/g, '""')}"`,
        `"${missing.replace(/"/g, '""')}"`,
        `"${status}"`,
        `"${isStarred}"`
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SmartHire_Screening_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats
  const validResults = results ? results.filter((r) => !r.error) : [];
  const avgScore = validResults.length
    ? Math.round(validResults.reduce((sum, r) => sum + r.atsScore, 0) / validResults.length)
    : 0;
  const topScore = validResults.length ? Math.max(...validResults.map((r) => r.atsScore)) : 0;

  // Filter and Sort
  const filteredResults = results
    ? results.filter((r) => !showShortlistedOnly || shortlisted[r.fileName])
    : [];

  const sortedResults = filteredResults.sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    if (a.error && b.error) return a.fileName.localeCompare(b.fileName);

    if (sortBy === 'score') {
      return sortOrder === 'desc' ? b.atsScore - a.atsScore : a.atsScore - b.atsScore;
    } else {
      return sortOrder === 'desc'
        ? b.fileName.localeCompare(a.fileName)
        : a.fileName.localeCompare(b.fileName);
    }
  });

  const cardCls =
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl transition-all duration-200';
  const cardShadow = {
    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -12px rgba(0,0,0,0.15)'
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 px-4 sm:px-6 py-8 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        {/* Title Section */}
        <div className="mb-8">
          <h1
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.01em'
            }}
            className="text-gray-900 dark:text-white mb-1"
          >
            Bulk Resume Screening
          </h1>
          <p
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }}
            className="text-gray-500 dark:text-gray-400"
          >
            Upload multiple resumes and screen them against your job requirements in one go.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Job Requirements Input */}
          <div className={cardCls} style={{ ...cardShadow, padding: 20 }}>
            <label
              className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 block"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Job Description / Required Skills
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Paste job description, or list skills separated by commas (e.g. React, Node.js, MongoDB, AWS, Docker)"
              rows={5}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-950 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-400"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Upload Resumes Zone */}
          <div className={cardCls} style={{ ...cardShadow, padding: 20 }}>
            <label
              className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 block"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Upload Resumes (PDF, up to 1000 files)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="border-2 border-dashed rounded-xl p-6 text-center transition-all h-[140px] flex flex-col justify-center items-center gap-2"
              style={{
                borderColor: dragOver ? '#3b82f6' : files.length > 0 ? '#22c55e' : isDark ? '#374151' : '#e5e7eb',
                backgroundColor: dragOver ? (isDark ? '#1e3a5f20' : '#eff6ff') : 'transparent'
              }}
            >
              <div className="text-3xl">{files.length > 0 ? '📚' : '📄'}</div>
              {files.length > 0 ? (
                <div>
                  <p
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    className="text-green-500 text-sm"
                  >
                    {files.length} resume(s) selected
                  </p>
                  <p
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: 11 }}
                    className="text-gray-500 dark:text-gray-400 mt-0.5"
                  >
                    Add more: 
                    <button onClick={() => document.getElementById('bulkResumeInput').click()} className="text-blue-500 hover:underline mx-1 font-semibold">Files</button> or
                    <button onClick={() => document.getElementById('bulkFolderInput').click()} className="text-blue-500 hover:underline mx-1 font-semibold">Folder</button>
                  </p>
                </div>
              ) : (
                <div>
                  <p
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 550, fontSize: 13.5 }}
                    className="text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Drop your PDF resumes or folder here
                  </p>
                  <div className="flex gap-2 justify-center mt-1">
                    <button
                      onClick={() => document.getElementById('bulkResumeInput').click()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      📁 Choose Files
                    </button>
                    <button
                      onClick={() => document.getElementById('bulkFolderInput').click()}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      📂 Choose Folder
                    </button>
                  </div>
                </div>
              )}
              <input
                id="bulkResumeInput"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                id="bulkFolderInput"
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Selected Files List (Full Width under inputs) */}
        {files.length > 0 && (
          <div className={`${cardCls} mb-6`} style={{ ...cardShadow, padding: 16 }}>
            <h3
              style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600 }}
              className="text-gray-900 dark:text-white mb-2"
            >
              Selected Resumes ({files.length}/1000)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300"
                >
                  <span className="truncate flex-1 pr-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {file.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="text-gray-400 hover:text-red-500 font-bold ml-1.5 focus:outline-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || files.length === 0 || !requirements.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3.5 transition-all mb-8"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(37,99,235,0.25)'
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing resumes, this may take a moment...
            </span>
          ) : (
            `Screen ${files.length || ''} Resumes`
          )}
        </button>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
              style={{ ...cardShadow }}
            >
              <div>
                <h3
                  style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600 }}
                  className="text-gray-900 dark:text-white"
                >
                  Screening Summary
                </h3>
                <p
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}
                  className="text-gray-400"
                >
                  Batch overview and match rate benchmarks
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-150 dark:border-gray-700">
                  <span
                    className="text-gray-500 dark:text-gray-400 block text-xs"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Total Resumes
                  </span>
                  <span
                    className="text-gray-900 dark:text-white font-bold text-lg"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {results.length}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-150 dark:border-gray-700">
                  <span
                    className="text-gray-500 dark:text-gray-400 block text-xs"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Average Score
                  </span>
                  <span
                    className="text-gray-900 dark:text-white font-bold text-lg"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {avgScore}%
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-150 dark:border-gray-700">
                  <span
                    className="text-gray-500 dark:text-gray-400 block text-xs"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Top Score
                  </span>
                  <span
                    className="text-gray-900 dark:text-white font-bold text-lg"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {topScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Header and Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <h3
                style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 600 }}
                className="text-gray-900 dark:text-white"
              >
                Ranked Candidates
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* Shortlisted filter */}
                <label className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 cursor-pointer font-medium select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <input
                    type="checkbox"
                    checked={showShortlistedOnly}
                    onChange={(e) => setShowShortlistedOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <span>⭐ Shortlisted Only</span>
                </label>

                {/* Export button */}
                <button
                  onClick={handleExportCSV}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-green-600/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  📥 Export CSV
                </button>

                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>

                <span
                  className="text-gray-500 dark:text-gray-400"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none transition-colors cursor-pointer"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="score">ATS Score</option>
                  <option value="name">Candidate Name</option>
                </select>
                <button
                  onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                  title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                >
                  {sortOrder === 'desc' ? '▼' : '▲'}
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div
              className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl"
              style={{ ...cardShadow }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                      <th
                        className="py-4 px-4 font-semibold text-center w-12"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Rank
                      </th>
                      <th
                        className="py-4 px-4 font-semibold"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Candidate / Filename
                      </th>
                      <th
                        className="py-4 px-4 font-semibold w-32"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        ATS Score
                      </th>
                      <th
                        className="py-4 px-4 font-semibold hidden md:table-cell"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Top Skills Matched
                      </th>
                      <th
                        className="py-4 px-4 font-semibold text-center w-24"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Shortlist
                      </th>
                      <th
                        className="py-4 px-4 font-semibold text-right w-32"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r, i) => {
                      const isExpanded = !!expandedRows[i];
                      return (
                        <tr key={i} className="border-b border-gray-150 dark:border-gray-800 last:border-b-0">
                          <td colSpan={6} className="p-0">
                            <table className="w-full table-fixed text-left text-sm">
                              <tbody>
                                <tr
                                  className={`hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors ${
                                    isExpanded ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''
                                  }`}
                                >
                                  <td
                                    className="py-4 px-4 text-gray-400 font-medium text-center w-12"
                                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                                  >
                                    {i + 1}
                                  </td>
                                  <td
                                    className="py-4 px-4 font-medium text-gray-900 dark:text-white truncate"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                  >
                                    {r.fileName}
                                  </td>
                                  <td className="py-4 px-4 w-32">
                                    {r.error ? (
                                      <span
                                        className="text-red-500 dark:text-red-400 text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 font-semibold"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                      >
                                        Failed
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="font-bold text-md"
                                          style={{
                                            fontFamily: 'JetBrains Mono, monospace',
                                            color: getScoreColor(r.atsScore)
                                          }}
                                        >
                                          {r.atsScore}%
                                        </span>
                                        <span
                                          className="text-[10px] hidden lg:inline px-2 py-0.5 rounded-full font-medium"
                                          style={{
                                            backgroundColor: `${getScoreColor(r.atsScore)}15`,
                                            color: getScoreColor(r.atsScore),
                                            border: `1px solid ${getScoreColor(r.atsScore)}25`
                                          }}
                                        >
                                          {getScoreLabel(r.atsScore)}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 hidden md:table-cell">
                                    {r.error ? (
                                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                                        —
                                      </span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {(r.matchedSkills || []).slice(0, 3).map((s, idx) => (
                                          <span
                                            key={idx}
                                            className="bg-green-500/10 text-green-550 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full border border-green-500/10"
                                            style={{ fontFamily: 'Inter, sans-serif' }}
                                          >
                                            {s}
                                          </span>
                                        ))}
                                        {(r.matchedSkills || []).length > 3 && (
                                          <span
                                            className="bg-gray-150 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full"
                                            style={{ fontFamily: 'Inter, sans-serif' }}
                                          >
                                            +{(r.matchedSkills || []).length - 3}
                                          </span>
                                        )}
                                        {(r.matchedSkills || []).length === 0 && (
                                          <span className="text-xs text-gray-400 dark:text-gray-500">
                                            No skills matched
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-center w-24">
                                    {!r.error && (
                                      <button
                                        onClick={() => toggleShortlist(r.fileName)}
                                        className="text-lg focus:outline-none transition-transform active:scale-125 select-none"
                                      >
                                        {shortlisted[r.fileName] ? '⭐' : '☆'}
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-right w-32">
                                    <button
                                      onClick={() => toggleRow(i)}
                                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold"
                                      style={{ fontFamily: 'Inter, sans-serif' }}
                                    >
                                      {isExpanded ? 'Hide Details' : 'View Details'}
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-gray-50/30 dark:bg-gray-850/20">
                                    <td colSpan={6} className="py-4 px-6 border-t border-gray-150 dark:border-gray-800">
                                      {r.error ? (
                                        <div
                                          className="text-red-505 dark:text-red-400 text-sm font-semibold flex items-center gap-1.5"
                                          style={{ fontFamily: 'Inter, sans-serif' }}
                                        >
                                          ⚠️ Error parsing: {r.error}
                                        </div>
                                      ) : (
                                        <div className="space-y-4">
                                          <div>
                                            <h4
                                              style={{
                                                fontFamily: 'Sora, sans-serif',
                                                fontSize: 13,
                                                fontWeight: 600
                                              }}
                                              className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5"
                                            >
                                              <span className="text-green-500 font-bold">✓</span>{' '}
                                              Matched Skills ({r.matchedSkills?.length || 0})
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                              {r.matchedSkills && r.matchedSkills.length > 0 ? (
                                                r.matchedSkills.map((s, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/20 font-medium"
                                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                                  >
                                                    {s}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                  No skills matched.
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <h4
                                              style={{
                                                fontFamily: 'Sora, sans-serif',
                                                fontSize: 13,
                                                fontWeight: 600
                                              }}
                                              className="text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5"
                                            >
                                              <span className="text-red-500 font-bold">✗</span>{' '}
                                              Missing Skills ({r.missingSkills?.length || 0})
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                              {r.missingSkills && r.missingSkills.length > 0 ? (
                                                r.missingSkills.map((s, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="bg-red-500/10 text-red-605 dark:text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/20 font-medium"
                                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                                  >
                                                    {s}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                  No missing skills.
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {r.textPreview && (
                                            <div>
                                              <h4
                                                style={{
                                                  fontFamily: 'Sora, sans-serif',
                                                  fontSize: 13,
                                                  fontWeight: 600
                                                }}
                                                className="text-gray-800 dark:text-gray-200 mb-1.5"
                                              >
                                                📄 Resume Text Preview
                                              </h4>
                                              <div className="bg-gray-55 dark:bg-gray-800/80 border border-gray-150 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                {r.textPreview}...
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
