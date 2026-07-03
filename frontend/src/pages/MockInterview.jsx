import { useState } from 'react';
import API from '../services/api';
import { AI_SERVICE_URL } from '../config/apiConfig';
import { useTheme } from '../context/useTheme';

const TOPICS = [
  { id: 'javascript', label: 'JavaScript', color: '#f7df1e', bg: '#f7df1e20' },
  { id: 'react', label: 'React', color: '#61dafb', bg: '#61dafb20' },
  { id: 'python', label: 'Python', color: '#3776ab', bg: '#3776ab20' },
  { id: 'dsa', label: 'DSA', color: '#a855f7', bg: '#a855f720' },
  { id: 'hr', label: 'HR Round', color: '#22c55e', bg: '#22c55e20' },
  { id: 'nodejs', label: 'Node.js', color: '#68a063', bg: '#68a06320' },
  { id: 'sql', label: 'SQL', color: '#f59e0b', bg: '#f59e0b20' },
  { id: 'java', label: 'Java', color: '#ef4444', bg: '#ef444420' },
];

export default function MockInterview() {
  const { isDark } = useTheme();
  const borderDefault = isDark ? '#374151' : '#e5e7eb';
  const [stage, setStage] = useState('select'); // select → resume → interview → result
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionData, setQuestionData] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [mode, setMode] = useState('topic'); // 'topic' or 'resume'

  // Topic based interview
  const startTopicInterview = async (topic) => {
    setLoading(true);
    try {
      const res = await API.get(`/interview/questions/${topic.id}`);
      setSelectedTopic(topic);
      setQuestions(res.data.questions);
      setQuestionData(res.data.questions);
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

  // Resume based interview
  const analyzeResumeForInterview = async () => {
    if (!resumeFile) return;
    setLoading(true);
    try {
      // Get resume skills from AI service
      const formData = new FormData();
      formData.append('file', resumeFile);
      const resumeRes = await fetch(`${AI_SERVICE_URL}/api/resume/analyze`, {
        method: 'POST',
        body: formData
      });
      const resumeData = await resumeRes.json();
      const skills = resumeData.matched_skills || [];
      setResumeSkills(skills);

      // Get questions based on skills
      const qRes = await API.post('/interview/questions/from-skills', {
        skills,
        questionCount
      });

      setSelectedTopic({ id: 'mixed', label: 'Resume-Based' });
      setQuestions(qRes.data.questions);
      setQuestionData(qRes.data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setCurrentAnswer('');
      setStage('interview');
    } catch {
      alert('Failed to analyze resume. Make sure AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = [...answers, {
      questionId: currentQ,
      question: questions[currentQ].question,
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
        answers: finalAnswers,
        questions: questionData
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
    ? Math.round((currentQ / questions.length) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* Stage 1 — Mode Select */}
      {stage === 'select' && (
        <div className="space-y-4">

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Mock Interview
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Choose how you want to practice
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('topic')}
              className="p-4 rounded-xl border-2 transition-all text-left"
              style={{
                borderColor: mode === 'topic' ? '#a855f7' : borderDefault,
                backgroundColor: mode === 'topic' ? '#a855f720' : 'transparent'
              }}
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                Topic-wise
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Choose a specific topic
              </div>
            </button>

            <button
              onClick={() => setMode('resume')}
              className="p-4 rounded-xl border-2 transition-all text-left"
              style={{
                borderColor: mode === 'resume' ? '#a855f7' : borderDefault,
                backgroundColor: mode === 'resume' ? '#a855f720' : 'transparent'
              }}
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                Resume-Based
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Questions from your resume skills
              </div>
            </button>
          </div>

          {/* Topic mode */}
          {mode === 'topic' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Select Topic
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => startTopicInterview(topic)}
                    disabled={loading}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all text-left disabled:opacity-50"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {topic.label}
                    </div>
                    <div className="text-xs"
                      style={{ color: topic.color }}>
                      5 questions
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resume mode */}
          {mode === 'resume' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Upload Your Resume
              </h3>

              {/* File upload */}
              <div
                onClick={() => document.getElementById('interviewResume').click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: resumeFile ? '#22c55e' : borderDefault }}
              >
                <div className="text-3xl mb-2">{resumeFile ? '✅' : '📄'}</div>
                {resumeFile ? (
                  <p className="text-green-500 font-medium text-sm">{resumeFile.name}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Click to upload resume PDF
                  </p>
                )}
                <input
                  id="interviewResume"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </div>

              {/* Question count */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-gray-500 dark:text-gray-400 text-sm">
                    Number of Questions
                  </label>
                  <span className="text-purple-500 font-medium text-sm">
                    {questionCount}
                  </span>
                </div>
                <input
                  type="range" min="3" max="10" step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>3 (Quick)</span>
                  <span>10 (Full)</span>
                </div>
              </div>

              <button
                onClick={analyzeResumeForInterview}
                disabled={!resumeFile || loading}
                className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
                style={{ backgroundColor: '#a855f7' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Analyzing Resume...
                  </span>
                ) : '🚀 Start Resume-Based Interview'}
              </button>

              {/* Show detected skills */}
              {resumeSkills.length > 0 && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                    Skills detected from resume:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeSkills.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stage 2 — Interview */}
      {stage === 'interview' && questions.length > 0 && (
        <div>
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>{selectedTopic?.label} Interview</span>
              <span>Question {currentQ + 1} / {questions.length}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: '#a855f7' }}
              />
            </div>
          </div>

          {/* Topic badge */}
          {questions[currentQ].topic && (
            <div className="mb-3">
              <span className="text-xs px-2 py-1 rounded-md font-medium capitalize"
                style={{ backgroundColor: '#a855f720', color: '#a855f7' }}>
                {questions[currentQ].topic}
              </span>
            </div>
          )}

          {/* Question */}
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

          {/* Answer */}
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
            <p className="text-gray-400 text-xs mt-2">{currentAnswer.length} characters</p>
          </div>

          <button
            onClick={nextQuestion}
            disabled={!currentAnswer.trim() || loading}
            className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#a855f7' }}
          >
            {loading ? 'Submitting...' :
              currentQ + 1 === questions.length ? 'Submit Interview ✓' : 'Next Question →'}
          </button>
        </div>
      )}

      {/* Stage 3 — Results */}
      {stage === 'result' && result && (
        <div className="space-y-4">

          {/* Score */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              {selectedTopic?.label} Interview Score
            </p>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="2.5"/>
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

          {/* Per question */}
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

          <button
            onClick={() => { setStage('select'); setResult(null); setResumeFile(null); setResumeSkills([]); }}
            className="w-full py-3 rounded-xl font-medium text-white"
            style={{ backgroundColor: '#a855f7' }}
          >
            Try Another Interview 🔄
          </button>
        </div>
      )}
    </div>
  );
}
