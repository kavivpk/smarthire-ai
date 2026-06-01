import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const TOPICS = [
  { id: 'javascript', label: 'JavaScript', icon: (
    <svg width="24" height="24" fill="none" stroke="#f7df1e" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 17c0 1 .5 2 2 2s2-1 2-2v-6M16 11c-1 0-2 .5-2 2s1 2 2 2 2 .5 2 2-.5 2-2 2"/>
    </svg>
  )},
  { id: 'react', label: 'React', icon: (
    <svg width="24" height="24" fill="none" stroke="#61dafb" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2"/>
      <ellipse cx="12" cy="12" rx="10" ry="4"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
    </svg>
  )},
  { id: 'python', label: 'Python', icon: (
    <svg width="24" height="24" fill="none" stroke="#3776ab" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 2C8 2 6 4 6 7v2h6v1H5c-2 0-4 1.5-4 4s2 4 4 4h1v-2c0-2 2-3 4-3h4c2 0 4-1 4-3V7c0-3-2-5-6-5z"/>
      <path d="M12 22c4 0 6-2 6-5v-2h-6v-1h7c2 0 4-1.5 4-4s-2-4-4-4h-1v2c0 2-2 3-4 3H10c-2 0-4 1-4 3v3c0 3 2 5 6 5z"/>
    </svg>
  )},
  { id: 'dsa', label: 'DSA', icon: (
    <svg width="24" height="24" fill="none" stroke="#a855f7" strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { id: 'hr', label: 'HR Round', icon: (
    <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )},
];

export default function MockInterview() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('select'); // select → interview → result
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startInterview = async (topic) => {
    setLoading(true);
    try {
      const res = await API.get(`/interview/questions/${topic.id}`);
      setSelectedTopic(topic);
      setQuestions(res.data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setCurrentAnswer('');
      setStage('interview');
  } catch {
  alert('Failed to load questions');
} finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = [...answers, {
      questionId: currentQ,
      answer: currentAnswer
    }];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      submitInterview(newAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
    setLoading(true);
    try {
      const res = await API.post('/interview/submit', {
        topic: selectedTopic.id,
        answers: finalAnswers
      });
      setResult(res.data);
      setStage('result');
} catch {
  alert('Submission failed');
} finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 7) return '#22c55e';
    if (score >= 4) return '#f59e0b';
    return '#ef4444';
  };

  const progress = questions.length > 0
    ? Math.round(((currentQ) / questions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => stage === 'select' ? navigate('/dashboard') : setStage('select')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Mock <span className="text-purple-500">Interview</span>
          </h1>
        </div>
        <ThemeToggle />
      </nav>

      <div className="max-w-2xl mx-auto p-6">

        {/* Stage 1 — Topic Select */}
        {stage === 'select' && (
          <div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Choose Interview Topic
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                5 questions per topic · AI-evaluated answers · Instant feedback
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startInterview(topic)}
                  disabled={loading}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-500 rounded-xl p-5 text-left transition-all duration-200 disabled:opacity-50"
                >
                  <div className="mb-3">{topic.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {topic.label}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    5 questions · ~10 mins
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stage 2 — Interview */}
        {stage === 'interview' && questions.length > 0 && (
          <div>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>{selectedTopic.label} Interview</span>
                <span>Question {currentQ + 1} / {questions.length}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: '#a855f7' }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium px-2 py-1 rounded-md"
                  style={{ backgroundColor: '#a855f720', color: '#a855f7' }}>
                  Q{currentQ + 1}
                </span>
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-base leading-relaxed">
                {questions[currentQ].question}
              </p>
            </div>

            {/* Answer box */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
              <label className="text-gray-500 dark:text-gray-400 text-sm mb-2 block">
                Your Answer
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={5}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <p className="text-gray-400 text-xs mt-2">
                {currentAnswer.length} characters
              </p>
            </div>

            <button
              onClick={nextQuestion}
              disabled={!currentAnswer.trim() || loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#a855f7' }}
            >
              {loading ? 'Submitting...' :
                currentQ + 1 === questions.length ? 'Submit Interview' : 'Next Question →'}
            </button>
          </div>
        )}

        {/* Stage 3 — Results */}
        {stage === 'result' && result && (
          <div className="space-y-4">

            {/* Score card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                {selectedTopic.label} Interview Score
              </p>
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={getScoreColor(result.totalScore)}
                    strokeWidth="2.5"
                    strokeDasharray={`${result.totalScore * 10} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {result.totalScore}
                  </span>
                  <span className="text-xs text-gray-500">/ 10</span>
                </div>
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${getScoreColor(result.totalScore)}20`,
                  color: getScoreColor(result.totalScore)
                }}>
                {result.totalScore >= 7 ? 'Excellent' : result.totalScore >= 4 ? 'Average' : 'Needs Practice'}
              </span>
            </div>

            {/* Per question results */}
            {result.results.map((r, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-900 dark:text-white font-medium text-sm flex-1 pr-4">
                    Q{i + 1}: {r.question}
                  </p>
                  <span className="text-sm font-bold flex-shrink-0"
                    style={{ color: getScoreColor(r.score) }}>
                    {r.score}/10
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                  Your answer: {r.userAnswer.slice(0, 100)}{r.userAnswer.length > 100 ? '...' : ''}
                </p>
                <div className="flex items-start gap-2 text-xs p-3 rounded-lg"
                  style={{ backgroundColor: `${getScoreColor(r.score)}10` }}>
                  <span style={{ color: getScoreColor(r.score) }}>→</span>
                  <span style={{ color: getScoreColor(r.score) }}>{r.feedback}</span>
                </div>
              </div>
            ))}

            {/* Try again */}
            <button
              onClick={() => setStage('select')}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: '#a855f7' }}
            >
              Try Another Topic
            </button>

          </div>
        )}
      </div>
    </div>
  );
}