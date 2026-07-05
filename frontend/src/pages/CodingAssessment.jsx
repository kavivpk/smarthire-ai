import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import API from '../services/api';
import { useTheme } from '../context/useTheme';

// ── Difficulty badge ────────────────────────────────────────────────────────
const DiffBadge = ({ d }) => {
  const cls =
    d === 'Easy'   ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{d}</span>
  );
};

// ── Score ring ──────────────────────────────────────────────────────────────
const ScoreRing = ({ score, max = 10, size = 100 }) => {
  const { isDark } = useTheme();
  const pct = Math.min(Math.max(score, 0), max) / max;
  const r = 38, C = 2 * Math.PI * r;
  const color = score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444';
  const trackColor = isDark ? '#374151' : '#e5e7eb';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-400">/{max}</span>
      </div>
    </div>
  );
};

// ── Status pill ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const ok = status === 'Pass';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {ok ? '✓ Pass' : '✗ Fail'}
    </span>
  );
};

export default function CodingAssessment() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // ── state ──────────────────────────────────────────────────────────────────
  const [stage, setStage] = useState('loading'); // loading | coding | result
  const [problems, setProblems] = useState([]);
  const [problemIndex, setProblemIndex] = useState(0);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [running, setCodeRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [activeTestcase, setActiveTestcase] = useState(0);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(1200);

  const bg = isDark ? 'bg-gray-950' : 'bg-gray-100';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const text = isDark ? 'text-gray-100' : 'text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';

  // ── load problems ──────────────────────────────────────────────────────────
  useEffect(() => {
    API.get('/interview/coding-problems')
      .then(res => {
        const probs = res.data.problems;
        setProblems(probs);
        setCode(probs[0]?.starterCode?.python || '# Write your solution here\n');
        setStage('coding');
      })
      .catch(() => {
        setError('Failed to load problems. Make sure the backend is running.');
        setStage('coding');
      });
  }, []);

  // ── per-problem countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'coding') return;
    setTimeLeft(1200);
  }, [problemIndex, stage]);

  useEffect(() => {
    if (stage !== 'coding') return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleAutoSubmit(); return 1200; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, problemIndex]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const prob = problems[problemIndex];

  // ── language change ────────────────────────────────────────────────────────
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(prob?.starterCode?.[lang] || `// Write your ${lang} solution here\n`);
  };

  // ── run code ───────────────────────────────────────────────────────────────
  const runCode = async () => {
    if (!code.trim()) { setError('Write some code first.'); return; }
    setCodeRunning(true);
    setRunResult(null);
    setConsoleOpen(true);
    setError('');
    try {
      const res = await API.post('/interview/evaluate-code', {
        code,
        language,
        problem: prob.description,
        runOnly: true,
        testCases: prob.testCases
      });
      setRunResult(res.data);
    } catch {
      setError('Code execution failed.');
    } finally {
      setCodeRunning(false);
    }
  };

  // ── submit code ────────────────────────────────────────────────────────────
  const submitCode = async () => {
    if (!code.trim()) { setError('Write some code before submitting.'); return; }
    setSubmitting(true);
    setEvaluation(null);
    setError('');
    try {
      const res = await API.post('/interview/evaluate-code', {
        code,
        language,
        problem: prob.description,
        runOnly: false,
        testCases: prob.testCases
      });
      setEvaluation(res.data);
      setResults(prev => [...prev, { problemId: prob.id, title: prob.title, ...res.data }]);
    } catch {
      setError('Evaluation failed. Check backend & GROQ_API_KEY.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── auto-submit on timer expiry ────────────────────────────────────────────
  const handleAutoSubmit = async () => {
    if (code.trim()) {
      try {
        const res = await API.post('/interview/evaluate-code', {
          code, language, problem: prob.description, runOnly: false, testCases: prob.testCases
        });
        const next = [...results, { problemId: prob.id, title: prob.title, ...res.data }];
        setResults(next);
        if (problemIndex + 1 >= problems.length) { setStage('result'); return; }
      } catch { /* safe fail */ }
    }
    const nextIdx = problemIndex + 1;
    if (nextIdx >= problems.length) { setStage('result'); return; }
    setProblemIndex(nextIdx);
    setEvaluation(null);
    setCode(problems[nextIdx]?.starterCode?.[language] || '// Write your solution here\n');
  };

  // ── next problem ───────────────────────────────────────────────────────────
  const nextProblem = () => {
    const nextIdx = problemIndex + 1;
    if (nextIdx >= problems.length) { setStage('result'); return; }
    setProblemIndex(nextIdx);
    setEvaluation(null);
    setRunResult(null);
    setConsoleOpen(false);
    setCode(problems[nextIdx]?.starterCode?.[language] || '// Write your solution here\n');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'loading') {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className={`${muted} text-sm animate-pulse`}>Loading problems…</div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULT STAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'result') {
    const avg = results.length
      ? Math.round((results.reduce((s, r) => s + (r.score || 0), 0) / results.length) * 10) / 10
      : 0;
    const avgColor = avg >= 7 ? '#22c55e' : avg >= 4 ? '#f59e0b' : '#ef4444';
    return (
      <div className={`min-h-screen ${bg} p-6`}>
        <div className="max-w-2xl mx-auto">
          <div className={`${card} border rounded-2xl p-6 mb-4`}>
            <h2 className={`text-lg font-bold ${text} mb-1`}>Assessment Complete 🎉</h2>
            <p className={`${muted} text-sm mb-4`}>
              {results.length} of {problems.length} problem{problems.length !== 1 ? 's' : ''} attempted
            </p>
            <div className="flex items-center gap-4 mb-4">
              <ScoreRing score={avg} size={100} />
              <div>
                <p className={`text-2xl font-bold`} style={{ color: avgColor }}>{avg}/10</p>
                <p className={`${muted} text-xs`}>Average Score</p>
              </div>
            </div>
          </div>

          {results.map((r, i) => (
            <div key={i} className={`${card} border rounded-xl p-4 mb-3`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold text-sm ${text}`}>{r.title}</span>
                <span className={`text-sm font-bold`} style={{ color: (r.score || 0) >= 7 ? '#22c55e' : (r.score || 0) >= 4 ? '#f59e0b' : '#ef4444' }}>
                  {r.score || 0}/10
                </span>
              </div>
              <p className={`${muted} text-xs mb-1`}>Verdict: {r.verdict || 'N/A'} &nbsp;·&nbsp; Time: {r.timeComplexity || 'N/A'}</p>
              {r.feedback && <p className={`text-xs ${muted}`}>{r.feedback}</p>}
            </div>
          ))}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-2 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: '#2563eb' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CODING STAGE
  // ══════════════════════════════════════════════════════════════════════════
  const timerColor = timeLeft <= 120 ? '#ef4444' : timeLeft <= 300 ? '#f59e0b' : (isDark ? '#9ca3af' : '#6b7280');

  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>

      {/* ── Top bar ── */}
      <div className={`${card} border-b px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className={`font-bold text-sm ${text}`}>
            Problem {problemIndex + 1}/{problems.length}
          </span>
          {prob && <DiffBadge d={prob.difficulty} />}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold" style={{ color: timerColor }}>
            ⏱ {formatTime(timeLeft)}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className={`text-xs ${muted} hover:text-red-400 transition-colors`}
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* ── Main split layout ── */}
      <div className="flex flex-1 gap-0 overflow-hidden" style={{ height: 'calc(100vh - 52px)' }}>

        {/* Left — problem + evaluation */}
        <div className={`w-2/5 flex flex-col border-r ${isDark ? 'border-gray-800' : 'border-gray-200'} overflow-y-auto`}>

          {/* Problem description */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <h2 className={`font-bold text-base ${text} mb-2`}>{prob?.title}</h2>
            <pre className={`whitespace-pre-wrap text-xs ${muted} leading-relaxed font-sans`}>
              {prob?.description}
            </pre>
          </div>

          {/* Test cases */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <p className={`text-xs font-semibold ${muted} uppercase tracking-wider mb-2`}>Examples</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {(prob?.testCases || []).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestcase(i)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    activeTestcase === i
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : `${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`
                  }`}
                >
                  Case {i + 1}
                </button>
              ))}
            </div>
            {prob?.testCases?.[activeTestcase] && (
              <div className={`rounded-lg p-3 text-xs font-mono ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                <div><span className={muted}>Input: </span>{prob.testCases[activeTestcase].input}</div>
                <div className="mt-1"><span className={muted}>Expected: </span>{prob.testCases[activeTestcase].expected}</div>
              </div>
            )}
          </div>

          {/* AI Evaluation panel */}
          {evaluation && (
            <div className="p-4 flex-1">
              <p className={`text-xs font-semibold ${muted} uppercase tracking-wider mb-3`}>AI Evaluation</p>

              <div className="flex items-center gap-4 mb-4">
                <ScoreRing score={evaluation.score || 0} size={88} />
                <div>
                  <p className={`font-bold text-sm ${text}`}>{evaluation.verdict}</p>
                  <p className={`text-xs ${muted}`}>Time: {evaluation.timeComplexity || 'N/A'}</p>
                  <p className={`text-xs ${muted}`}>
                    Tests: {(evaluation.testCases || []).filter(t => t.status === 'Pass').length}/{(evaluation.testCases || []).length} passed
                  </p>
                </div>
              </div>

              {evaluation.feedback && (
                <div className={`rounded-lg p-3 mb-3 text-xs leading-relaxed ${isDark ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}>
                  <span className="font-semibold">Feedback: </span>{evaluation.feedback}
                </div>
              )}
              {evaluation.hints && (
                <div className={`rounded-lg p-3 mb-4 text-xs leading-relaxed ${isDark ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                  <span className="font-semibold">Hint: </span>{evaluation.hints}
                </div>
              )}

              {/* Per-test-case results */}
              <div className="space-y-2">
                {(evaluation.testCases || []).map((tc, i) => (
                  <div key={i} className={`rounded-lg p-2 text-xs font-mono ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={muted}>Case {i + 1}</span>
                      <StatusPill status={tc.status} />
                    </div>
                    <div className={muted}>In: {tc.input}</div>
                    <div className={muted}>Expected: {tc.expected} &nbsp;·&nbsp; Got: {tc.actual}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={nextProblem}
                className="w-full mt-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: '#2563eb' }}
              >
                {problemIndex + 1 >= problems.length ? 'View Results →' : 'Next Problem →'}
              </button>
            </div>
          )}
        </div>

        {/* Right — editor + console */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          {/* Console panel */}
          {consoleOpen && (
            <div className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
              style={{ height: '180px', overflow: 'auto' }}>
              <div className={`px-4 py-2 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <span className={`text-xs font-semibold ${muted} uppercase tracking-wider`}>Console</span>
                <button onClick={() => setConsoleOpen(false)} className={`text-xs ${muted} hover:text-red-400`}>✕</button>
              </div>
              <div className="p-3 space-y-2">
                {running && <p className={`text-xs ${muted} animate-pulse`}>Running…</p>}
                {runResult && (runResult.testCases || []).map((tc, i) => (
                  <div key={i} className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`font-semibold ${tc.status === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                      [{tc.status}]
                    </span>
                    &nbsp;{tc.input} → {tc.actual} (expected {tc.expected})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className={`px-4 py-3 border-t flex items-center justify-between gap-3 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <button
              onClick={runCode}
              disabled={running}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                isDark
                  ? 'border-gray-700 text-gray-300 hover:border-green-500 hover:text-green-400'
                  : 'border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600'
              } disabled:opacity-50`}
            >
              {running ? 'Running…' : '▶ Run'}
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${muted}`}>
                {problemIndex + 1}/{problems.length}
              </span>
              <button
                onClick={submitCode}
                disabled={submitting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: submitting ? '#6b7280' : '#2563eb' }}
              >
                {submitting ? 'Evaluating…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
