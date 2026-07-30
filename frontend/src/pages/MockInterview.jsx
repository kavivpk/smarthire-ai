import { useState, useRef, useEffect } from 'react';
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
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [mode, setMode] = useState('topic'); // 'topic' or 'resume'
  const [interviewId, setInterviewId] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);
  const [evaluationError, setEvaluationError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setCurrentAnswer(finalTranscript + interim);
    };
    recognition.onend = () => {
      setIsListening(false);
      finalTranscript = '';
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setCurrentAnswer('');
      recognition.start();
      setIsListening(true);
    }
  };

  const DIFFICULTY_CONFIG = {
    easy:   { count: 3,  label: 'Easy',   color: '#22c55e', bg: '#22c55e15', desc: '3 questions' },
    medium: { count: 5,  label: 'Medium', color: '#f59e0b', bg: '#f59e0b15', desc: '5 questions' },
    hard:   { count: 10, label: 'Hard',   color: '#ef4444', bg: '#ef444415', desc: '10 questions' },
  };

  // Topic based interview
  const startTopicInterview = async (topic) => {
    setLoading(true);
    try {
      const res = await API.get(`/interview/questions/${topic.id}`);
      // Slice questions based on difficulty
      const count = DIFFICULTY_CONFIG[difficulty].count;
      const sliced = res.data.questions.slice(0, count);
      setSelectedTopic(topic);
      setQuestions(sliced);
      setQuestionData(sliced);
      setCurrentQ(0);
      setAnswers([]);
      setEvaluatedAnswers([]);
      setCurrentAnswer('');
      setCurrentEvaluation(null);
      setEvaluationError('');
      setInterviewId(`topic-${topic.id}-${Date.now()}`);
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
      const count = DIFFICULTY_CONFIG[difficulty].count;
      const qRes = await API.post('/interview/questions/from-skills', {
        skills,
        questionCount: count
      });

      setSelectedTopic({ id: 'mixed', label: 'Resume-Based' });
      setQuestions(qRes.data.questions);
      setQuestionData(qRes.data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setEvaluatedAnswers([]);
      setCurrentAnswer('');
      setCurrentEvaluation(null);
      setEvaluationError('');
      setInterviewId(`resume-${Date.now()}`);
      setStage('interview');
    } catch {
      alert('Failed to analyze resume. Make sure AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const goToNextQuestion = async () => {
    if (!currentAnswer.trim()) return;

    const answerRecord = {
      questionId: currentQ,
      question: questions[currentQ].question,
      answer: currentAnswer,
    };

    const newAnswers = [...answers, answerRecord];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setEvaluationError('');

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      // All questions answered — now evaluate everything and submit
      await submitInterview(newAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
    setLoading(true);
    try {
      // Evaluate all answers at once
      const evaluatedList = [];
      for (let i = 0; i < finalAnswers.length; i++) {
        const a = finalAnswers[i];
        try {
          const res = await API.post('/interview/evaluate', {
            question: a.question,
            answer: a.answer,
            resume: resumeSkills.join(', '),
            interviewId,
            keywords: questionData[i]?.keywords || []
          });
          evaluatedList.push({ ...a, evaluation: res.data });
        } catch {
          evaluatedList.push({ ...a, evaluation: null });
        }
      }

      const [submitRes, completeRes] = await Promise.all([
        API.post('/interview/submit', {
          topic: selectedTopic.id,
          answers: evaluatedList,
          questions: questionData
        }),
        API.post('/interview/evaluate/complete', { interviewId })
      ]);

      setResult({
        ...submitRes.data,
        technicalSummary: completeRes.data.summary,
        technicalReports: completeRes.data.reports,
        evaluatedAnswers: evaluatedList
      });
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
    <div className="max-w-[1600px] mx-auto p-6">

      {/* Stage 1 — Mode Select */}
      {stage === 'select' && (
        <div className="space-y-4">

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
            style={{ boxShadow:'0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontFamily:'Sora, sans-serif', fontSize:22, fontWeight:600, lineHeight:1.3 }}
              className="text-gray-900 dark:text-white mb-1">
              Mock Interview
            </h2>
            <p style={{ fontFamily:'Inter, sans-serif', fontSize:14.5 }} className="text-gray-500 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
              style={{ boxShadow:'0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)' }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 style={{ fontFamily:'Sora, sans-serif', fontWeight:600, fontSize:15 }}
                  className="text-gray-900 dark:text-white">
                  Select Topic
                </h3>
                {/* Difficulty selector */}
                <div className="flex gap-2">
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                      style={{
                        borderColor: difficulty === key ? cfg.color : borderDefault,
                        backgroundColor: difficulty === key ? cfg.bg : 'transparent',
                        color: difficulty === key ? cfg.color : undefined,
                      }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
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
                    <div className="text-xs" style={{ color: DIFFICULTY_CONFIG[difficulty].color }}>
                      {DIFFICULTY_CONFIG[difficulty].desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resume mode */}
          {mode === 'resume' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4"
              style={{ boxShadow:'0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontFamily:'Sora, sans-serif', fontWeight:600, fontSize:15 }}
                className="text-gray-900 dark:text-white">
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

              {/* Difficulty selector */}
              <div>
                <label className="text-gray-500 dark:text-gray-400 text-sm mb-3 block">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className="py-3 rounded-xl border-2 transition-all font-semibold text-sm"
                      style={{
                        borderColor: difficulty === key ? cfg.color : borderDefault,
                        backgroundColor: difficulty === key ? cfg.bg : 'transparent',
                        color: difficulty === key ? cfg.color : undefined,
                        boxShadow: difficulty === key ? `0 0 12px ${cfg.color}30` : 'none',
                      }}
                    >
                      <div>{cfg.label}</div>
                      <div className="text-xs font-normal mt-0.5 opacity-75">{cfg.desc}</div>
                    </button>
                  ))}
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4"
            style={{ boxShadow:'0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded-md"
                style={{ backgroundColor: '#a855f720', color: '#a855f7', fontFamily:'JetBrains Mono, monospace' }}>
                Q{currentQ + 1}
              </span>
            </div>
            <p style={{ fontFamily:'Inter, sans-serif', fontSize:15, lineHeight:1.7, fontWeight:500 }}
              className="text-gray-900 dark:text-white">
              {questions[currentQ].question}
            </p>
          </div>

          {/* Answer */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4"
            style={{ boxShadow:'0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}
                className="text-gray-500 dark:text-gray-400">
                Your Answer
              </label>
              {/* Voice Button */}
              <button
                onClick={toggleVoice}
                disabled={!!currentEvaluation}
                title={isListening ? 'Stop recording' : 'Speak your answer'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all disabled:opacity-40"
                style={{
                  borderColor: isListening ? '#ef4444' : '#a855f7',
                  backgroundColor: isListening ? '#ef444415' : '#a855f715',
                  color: isListening ? '#ef4444' : '#a855f7',
                }}
              >
                {isListening ? (
                  <>
                    {/* Pulsing red dot */}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      display: 'inline-block',
                      animation: 'pulse 1s infinite',
                    }} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                    Speak Answer
                  </>
                )}
              </button>
            </div>

            {isListening && (
              <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
                style={{ backgroundColor: '#ef444410', color: '#ef4444', border: '1px solid #ef444430' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#ef4444', display:'inline-block', animation:'pulse 1s infinite' }} />
                Listening... speak your answer clearly
              </div>
            )}

            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              disabled={!!currentEvaluation}
              placeholder={isListening ? 'Listening to your voice...' : 'Type your answer or click "Speak Answer" to use voice...'}
              rows={5}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
            <p className="text-gray-400 text-xs mt-2">{currentAnswer.length} characters</p>
          </div>

          {evaluationError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {evaluationError}
            </div>
          )}

          {/* Evaluating loader shown only on last question submit */}
          {loading && (
            <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <div className="flex justify-center gap-1.5 mb-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-purple-400 text-sm font-medium">Evaluating all your answers...</p>
              <p className="text-purple-300 text-xs mt-1">Please wait, this takes a few seconds</p>
            </div>
          )}

          <button
            onClick={goToNextQuestion}
            disabled={!currentAnswer.trim() || loading}
            className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#a855f7' }}
          >
            {loading ? 'Evaluating all answers...' :
              currentQ + 1 === questions.length ? 'Submit & See Results' : 'Next Question'}
          </button>
        </div>
      )}

      {/* Stage 3 — Results */}
      {stage === 'result' && result && (
        <div className="space-y-4">

          {/* Success Message instead of Scores */}
          <div className="bg-white dark:bg-gray-900 border border-purple-500/30 rounded-2xl p-10 text-center"
            style={{ boxShadow:'0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -12px rgba(168,85,247,0.2)' }}>
            
            <div className="w-20 h-20 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">✉️</span>
            </div>
            
            <h2 style={{ fontFamily:'Sora, sans-serif', fontSize:24, fontWeight:700 }} className="text-gray-900 dark:text-white mb-2">
              Interview Complete!
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-md mx-auto">
              Your mock interview answers have been evaluated. To keep you focused, we've hidden the scores here. A detailed report with all your marks and feedback has been sent to your registered email address.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Detailed report sent to your email
            </div>
          </div>

          <button
            onClick={() => {
              setStage('select');
              setResult(null);
              setResumeFile(null);
              setResumeSkills([]);
              setCurrentEvaluation(null);
              setEvaluatedAnswers([]);
              setInterviewId('');
            }}
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
