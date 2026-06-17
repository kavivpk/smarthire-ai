import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';
import VideoCall from '../components/VideoCall';
import CodeEditor from '../components/CodeEditor';
import { BACKEND_URL, AI_SERVICE_URL } from '../config/apiConfig';

const SOCKET_URL = BACKEND_URL;

// ─── Difficulty badge ───────────────────────────────────────────────────────
const DiffBadge = ({ d }) => {
  const cls = d === 'Easy' ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : d === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30';
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{d}</span>;
};

// ─── Score ring ─────────────────────────────────────────────────────────────
const ScoreRing = ({ score, max = 100, size = 120 }) => {
  const pct = Math.min(Math.max(score, 0), max) / max;
  const r = 44, C = 2 * Math.PI * r;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#374151" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-400">/{max}</span>
      </div>
    </div>
  );
};

export default function LiveInterview() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── global state ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState('setup'); // setup | aptitude | coding | qa_interview | waiting | interview | result
  const [mainMode, setMainMode] = useState('ai'); // ai | admin
  const [aiSubMode, setAiSubMode] = useState('aptitude'); // aptitude | coding | qa
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  // ── Socket / Admin interview ───────────────────────────────────────────────
  const [mode, setMode] = useState('admin');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [role, setRole] = useState('student');
  const [participants, setParticipants] = useState([]);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [copyText, setCopyText] = useState('📋 Copy Room ID');
  const [showModal, setShowModal] = useState(false);

  // chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // question panel (admin)
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [adminQuestion, setAdminQuestion] = useState('');
  const [adminTopic, setAdminTopic] = useState('General');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // manual evaluation (admin side)
  const [evalScores, setEvalScores] = useState({ communication: 0, technical: 0, problemSolving: 0, cultureFit: 0 });
  const [aiMonitorLog, setAiMonitorLog] = useState([]);

  // email invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // ── Aptitude state ────────────────────────────────────────────────────────
  const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
  const [aptAnswers, setAptAnswers] = useState({});
  const [aptPage, setAptPage] = useState(0);
  const [aptLoading, setAptLoading] = useState(false);
  const [aptResult, setAptResult] = useState(null);
  const [aptSubmitting, setAptSubmitting] = useState(false);
  const QUESTIONS_PER_PAGE = 5;

  // ── Coding state ──────────────────────────────────────────────────────────
  const [codingProblems, setCodingProblems] = useState([]);
  const [codingProblemIndex, setCodingProblemIndex] = useState(0);
  const [codingLanguage, setCodingLanguage] = useState('python');
  const [codingCode, setCodingCode] = useState('');
  const [codingEval, setCodingEval] = useState(null);
  const [codingSubmitting, setCodingSubmitting] = useState(false);
  const [codingResults, setCodingResults] = useState([]);
  const [codingLoading, setCodingLoading] = useState(false);
  const [codeRunning, setCodeRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState('testcases'); // 'testcases' | 'result'
  const [activeTestcaseIdx, setActiveTestcaseIdx] = useState(0);

  // ── Resume-based Q&A state ───────────────────────────────────────────────
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [questionCount, setQuestionCount] = useState(35); // Always default to 35 questions
  const [result, setResult] = useState(null);

  // ── Aptitude custom PDF state ─────────────────────────────────────────────
  const [aptitudeFile, setAptitudeFile] = useState(null);
  const [aptitudeSource, setAptitudeSource] = useState('default'); // 'default' | 'pdf'

  // ── Scroll chat to bottom ─────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Speech recognition ────────────────────────────────────────────────────
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        setAnswer(prev => prev + ' ' + t);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // APTITUDE FLOW
  // ══════════════════════════════════════════════════════════════════════════
  const startAptitude = async () => {
    setAptLoading(true);
    setError('');
    try {
      const res = await API.post('/interview/aptitude');
      setAptitudeQuestions(res.data.questions);
      setAptAnswers({});
      setAptPage(0);
      setAptResult(null);
      setStage('aptitude');
    } catch (e) {
      setError(e.message || 'Failed to load questions. Make sure AI service and backend are running.');
    } finally {
      setAptLoading(false);
    }
  };

  const submitAptitude = async () => {
    setAptSubmitting(true);
    try {
      const res = await API.post('/interview/aptitude/submit', {
        answers: aptAnswers,
        questions: aptitudeQuestions
      });
      setAptResult(res.data);
      setStage('result');
    } catch {
      setError('Failed to submit. Try again.');
    } finally {
      setAptSubmitting(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CODING FLOW
  // ══════════════════════════════════════════════════════════════════════════
  const startCoding = async () => {
    setCodingLoading(true);
    setError('');
    try {
      const res = await API.get('/interview/coding-problems');
      const problems = res.data.problems;
      setCodingProblems(problems);
      setCodingProblemIndex(0);
      setCodingResults([]);
      setCodingEval(null);
      setCodingCode(problems[0]?.starterCode?.[codingLanguage] || '// Write your solution here\n');
      setStage('coding');
    } catch {
      setError('Failed to load coding problems. Make sure backend is running.');
    } finally {
      setCodingLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setCodingLanguage(lang);
    const starter = codingProblems[codingProblemIndex]?.starterCode?.[lang] || `// Write your ${lang} solution here\n`;
    setCodingCode(starter);
  };

  const runCode = async () => {
    if (!codingCode.trim()) { setError('Please write some code before running.'); return; }
    setCodeRunning(true);
    setRunResult(null);
    setConsoleOpen(true);
    setConsoleTab('result');
    setError('');
    try {
      const prob = codingProblems[codingProblemIndex];
      const res = await API.post('/interview/evaluate-code', {
        code: codingCode,
        language: codingLanguage,
        problem: prob.description,
        runOnly: true,
        testCases: prob.testCases
      });
      setRunResult(res.data);
    } catch (err) {
      setError('Code execution failed. Check backend connection.');
    } finally {
      setCodeRunning(false);
    }
  };

  const submitCode = async () => {
    if (!codingCode.trim()) { setError('Please write some code before submitting.'); return; }
    setCodingSubmitting(true);
    setCodingEval(null);
    setError('');
    try {
      const prob = codingProblems[codingProblemIndex];
      const res = await API.post('/interview/evaluate-code', {
        code: codingCode,
        language: codingLanguage,
        problem: prob.description,
        runOnly: false,
        testCases: prob.testCases
      });
      const evalData = res.data;
      setCodingEval(evalData);
      setCodingResults(prev => [...prev, { problemId: prob.id, title: prob.title, ...evalData }]);
    } catch {
      setError('Code evaluation failed. Check backend & GROQ_API_KEY.');
    } finally {
      setCodingSubmitting(false);
    }
  };

  const nextCodingProblem = () => {
    const nextIdx = codingProblemIndex + 1;
    if (nextIdx >= codingProblems.length) {
      // All problems done
      setStage('result');
      setResult({ type: 'coding', results: codingResults });
    } else {
      setCodingProblemIndex(nextIdx);
      setCodingEval(null);
      setCodingCode(codingProblems[nextIdx]?.starterCode?.[codingLanguage] || '// Write your solution here\n');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SOCKET / ADMIN INTERVIEW FLOW
  // ══════════════════════════════════════════════════════════════════════════
  const connectSocket = useCallback(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('room_created', ({ roomId: id, mode }) => { setRoomId(id); setStage('waiting'); if (mode !== 'ai') setShowModal(true); });
    newSocket.on('user_joined', ({ participants: p, message }) => {
      setParticipants(p);
      setMessages(prev => [...prev, { id: Date.now(), userName: 'System', role: 'system', message, time: new Date().toLocaleTimeString() }]);
    });
    newSocket.on('new_question', ({ question, topic, questionNumber: qNum, totalQuestions: total }) => {
      setCurrentQuestion({ question, topic });
      setQuestionNumber(qNum);
      setTotalQuestions(total);
      setAnswer('');
      setFeedback(null);
      setStage('interview');
    });
    newSocket.on('answer_feedback', ({ score, feedback: fb }) => setFeedback({ score, feedback: fb }));
    newSocket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
    newSocket.on('interview_complete', ({ totalScore, results: r, message }) => {
      setResult({ totalScore, results: r, message, type: 'qa' });
      setStage('result');
    });
    newSocket.on('error', ({ message }) => setError(message));
    newSocket.on('room_joined', ({ roomId: id, mode: roomMode, participants: p }) => {
      setRoomId(id);
      setParticipants(p);
      setStage(roomMode === 'admin' ? 'interview' : 'waiting');
    });
    // AI monitoring update (admin sees this)
    newSocket.on('ai_monitor_update', (data) => {
      setAiMonitorLog(prev => [data, ...prev].slice(0, 10));
    });

    setSocket(newSocket);
    return newSocket;
  }, []);

  const startAiTechInterview = async () => {
    if (!resumeFile) { setError('Please upload your resume to start'); return; }
    setError('');
    setResumeAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      const resumeRes = await fetch(`${AI_SERVICE_URL}/api/resume/analyze`, { method: 'POST', body: formData });
      const resumeData = await resumeRes.json();
      const skills = resumeData.matched_skills || [];
      setResumeSkills(skills);
      if (skills.length === 0) { setError('No skills detected. Please upload a valid resume.'); setResumeAnalyzing(false); return; }

      const qRes = await API.post('/interview/questions/from-skills', { skills, questionCount });
      const generatedQuestions = qRes.data.questions.map(q => ({ q: q.question, topic: q.topic, keywords: q.keywords }));

      setIsRoomCreator(true);
      setRole('student');
      const newSocket = connectSocket();
      const newRoomId = `ROOM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setTimeout(() => {
        newSocket.emit('create_room', { roomId: newRoomId, userName: userName || 'Candidate', userId: user.id || null, mode: 'ai', customQuestions: generatedQuestions, role: 'student' });
      }, 500);
    } catch {
      setError('Failed to analyze resume. Make sure AI service is running.');
    } finally {
      setResumeAnalyzing(false);
    }
  };





  const handleCreateRoom = () => {
    if (!userName.trim()) { setError('Please enter your name'); return; }
    setError('');
    setIsRoomCreator(true);
    setRole('admin');
    const newSocket = connectSocket();
    const newRoomId = `ROOM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setTimeout(() => {
      newSocket.emit('create_room', { roomId: newRoomId, userName: userName || user.name, userId: user.id || null, mode: 'admin' });
    }, 500);
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim() || !userName.trim()) { setError('Please enter room ID and your name'); return; }
    setError('');
    setIsRoomCreator(false);
    const newSocket = connectSocket();
    setTimeout(() => {
      newSocket.emit('join_room', { roomId: joinRoomId, userName: userName || user.name, userId: user.id || null, role });
      setRoomId(joinRoomId);
      setStage('waiting');
    }, 500);
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim() || !socket) return;
    socket.emit('submit_answer', { roomId, answer, questionIndex: questionNumber - 1 });
    // Also emit for AI monitoring
    socket.emit('student_answered', { roomId, answer });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    socket.emit('send_message', { roomId, message: newMessage, userName: userName || user.name, role });
    setNewMessage('');
  };

  const handleAdminQuestion = () => {
    if (!adminQuestion.trim() || !socket) return;
    socket.emit('admin_send_question', { roomId, question: adminQuestion, topic: adminTopic });
    setAdminQuestion('');
  };

  const handleEndInterview = () => { if (socket) socket.emit('end_interview', { roomId }); };

  const handleSendEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    setEmailSending(true);
    try {
      await API.post('/interview/send-invite', { toEmail: inviteEmail, roomId, studentName: inviteName || inviteEmail });
      setEmailSent(true); setInviteEmail(''); setInviteName('');
    } catch {
      alert('Failed to send email. Check EMAIL_USER and EMAIL_PASS in backend .env');
    } finally {
      setEmailSending(false);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) { alert('Speech recognition not supported'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopyText('✅ Copied!');
    setTimeout(() => setCopyText('📋 Copy Room ID'), 2000);
  };

  const resetAll = () => {
    setStage('setup'); setResult(null); setMessages([]);
    setCurrentQuestion(null); setEmailSent(false); setFeedback(null);
    setShowModal(false); setRoomId(''); setIsRoomCreator(false);
    setResumeFile(null); setResumeSkills([]);
    setAptitudeQuestions([]); setAptAnswers({}); setAptResult(null);
    setCodingResults([]); setCodingEval(null); setAiMonitorLog([]);
    setEvalScores({ communication: 0, technical: 0, problemSolving: 0, cultureFit: 0 });
    if (socket) { socket.disconnect(); setSocket(null); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: SETUP
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'setup') return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">Interview Platform</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Live Interview Studio</h1>
          <p className="text-gray-400">AI-powered aptitude, coding rounds & live HR interviews</p>
        </div>

        {/* Mode picker */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { id: 'ai', icon: '🤖', title: 'AI Interview', desc: 'Self-practice with AI evaluation', badge: 'No interviewer needed' },
            { id: 'admin', icon: '🎙️', title: 'HR Live Interview', desc: 'Real-time with recruiter/HR', badge: 'WebRTC + AI monitoring' },
          ].map(m => (
            <button key={m.id} id={`mode-${m.id}`} onClick={() => setMainMode(m.id)}
              className="relative p-6 rounded-2xl border-2 text-left transition-all"
              style={{ borderColor: mainMode === m.id ? '#ef4444' : '#374151', background: mainMode === m.id ? 'rgba(239,68,68,0.08)' : '#111827' }}>
              <div className="text-3xl mb-3">{m.icon}</div>
              <div className="font-bold text-white text-lg">{m.title}</div>
              <div className="text-gray-400 text-sm mt-1">{m.desc}</div>
              <div className="mt-3 inline-block text-xs px-2 py-0.5 rounded-full" style={{ background: mainMode === m.id ? '#ef444430' : '#1f2937', color: mainMode === m.id ? '#f87171' : '#6b7280' }}>{m.badge}</div>
              {mainMode === m.id && <div className="absolute top-4 right-4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
            </button>
          ))}
        </div>

        {/* ── AI Interview sub-mode ── */}
        {mainMode === 'ai' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-semibold text-lg">Choose Interview Type</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'aptitude', icon: '🧠', title: 'Aptitude', desc: '20 MCQ questions', color: '#6366f1' },
                { id: 'coding', icon: '💻', title: 'Coding', desc: 'Multi-language editor', color: '#06b6d4' },
                { id: 'qa', icon: '🗣️', title: 'Tech Q&A', desc: 'Resume-based questions', color: '#22c55e' },
              ].map(s => (
                <button key={s.id} id={`submode-${s.id}`} onClick={() => setAiSubMode(s.id)}
                  className="p-4 rounded-xl border text-center transition-all"
                  style={{ borderColor: aiSubMode === s.id ? s.color : '#374151', background: aiSubMode === s.id ? s.color + '15' : '#111827' }}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-semibold text-white text-sm">{s.title}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* Name */}
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Your Name</label>
              <input id="ai-name" type="text" value={userName} onChange={e => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>



            {/* Q&A section */}
            {aiSubMode === 'qa' && (
              <div className="p-4 bg-gray-800/50 rounded-xl space-y-4">
                <p className="text-gray-300 text-sm font-medium">📄 Upload Resume (AI generates questions from your resume)</p>
                <div onClick={() => document.getElementById('liveResumeUpload').click()}
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
                  style={{ borderColor: resumeFile ? '#22c55e' : '#4b5563' }}>
                  <div className="text-2xl mb-1">{resumeFile ? '✅' : '📄'}</div>
                  {resumeFile ? <p className="text-green-400 text-xs font-medium">{resumeFile.name}</p>
                    : <p className="text-gray-500 text-xs">Click to upload PDF</p>}
                  <input id="liveResumeUpload" type="file" accept=".pdf" className="hidden"
                    onChange={e => { setResumeFile(e.target.files[0]); setResumeSkills([]); }} />
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>}

            {/* Start button */}
            <button id="btn-start-ai"
              onClick={() => {
                if (!userName.trim()) { setError('Please enter your name'); return; }
                setError('');
                if (aiSubMode === 'aptitude') startAptitude();
                else if (aiSubMode === 'coding') startCoding();
                else startAiTechInterview();
              }}
              disabled={aptLoading || codingLoading || resumeAnalyzing}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
              {(aptLoading || codingLoading || resumeAnalyzing) ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg> Preparing...</>
              ) : `🚀 ${aiSubMode === 'aptitude' ? 'Start Aptitude Test' : aiSubMode === 'coding' ? 'Start Coding Round' : 'Start Technical Interview'}`}
            </button>
          </div>
        )}

        {/* ── HR / Admin Interview ── */}
        {mainMode === 'admin' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-semibold text-lg">HR Live Interview Room</h2>
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Your Name</label>
              <input id="admin-name" type="text" value={userName} onChange={e => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500" />
            </div>

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'student', label: '🎓 Student / Candidate', desc: 'You are being interviewed' },
                { id: 'admin', label: '👔 HR / Interviewer', desc: 'You are conducting the interview' },
              ].map(r => (
                <button key={r.id} id={`role-${r.id}`} onClick={() => setRole(r.id)}
                  className="p-4 rounded-xl border text-left text-sm transition-all"
                  style={{ borderColor: role === r.id ? '#ef4444' : '#374151', background: role === r.id ? '#ef444415' : '#111827' }}>
                  <div className="font-medium text-white">{r.label}</div>
                  <div className="text-gray-500 text-xs mt-1">{r.desc}</div>
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button id="btn-create-room" onClick={handleCreateRoom}
                className="py-3 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                🚀 Create Room
              </button>
              <div className="flex gap-2">
                <input id="join-room-input" type="text" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="ROOM-XXXXXX"
                  className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-red-500" />
                <button id="btn-join-room" onClick={handleJoinRoom}
                  className="px-4 py-3 rounded-xl font-semibold text-white text-sm bg-gray-700 hover:bg-gray-600 transition-all">
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: APTITUDE TEST
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'aptitude') {
    const pageStart = aptPage * QUESTIONS_PER_PAGE;
    const pageEnd = Math.min(pageStart + QUESTIONS_PER_PAGE, aptitudeQuestions.length);
    const pageQuestions = aptitudeQuestions.slice(pageStart, pageEnd);
    const totalPages = Math.ceil(aptitudeQuestions.length / QUESTIONS_PER_PAGE);
    const answeredAll = aptitudeQuestions.every(q => aptAnswers[q.id] !== undefined);

    return (
      <div className="min-h-screen bg-gray-950 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-xl">🧠 Aptitude Test</h2>
              <p className="text-gray-400 text-sm">Page {aptPage + 1} of {totalPages} · {aptitudeQuestions.length} questions total</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Answered</div>
              <div className="text-white font-bold">{Object.keys(aptAnswers).length}/{aptitudeQuestions.length}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="h-2 rounded-full transition-all" style={{ width: `${(Object.keys(aptAnswers).length / aptitudeQuestions.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #ef4444)' }} />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {pageQuestions.map((q, i) => {
              const globalIdx = pageStart + i;
              return (
                <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: aptAnswers[q.id] !== undefined ? '#6366f1' : '#374151' }}>{globalIdx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border text-indigo-400 border-indigo-500/30 bg-indigo-500/10">{q.category}</span>
                    </div>
                    {aptAnswers[q.id] !== undefined && <span className="text-green-400 text-xs">✓ Answered</span>}
                  </div>
                  <p className="text-white text-sm font-medium mb-4">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button key={oi} id={`q${q.id}-opt${oi}`}
                        onClick={() => setAptAnswers(prev => ({ ...prev, [q.id]: oi }))}
                        className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all"
                        style={{
                          borderColor: aptAnswers[q.id] === oi ? '#6366f1' : '#374151',
                          background: aptAnswers[q.id] === oi ? '#6366f115' : '#111827',
                          color: aptAnswers[q.id] === oi ? '#a5b4fc' : '#9ca3af'
                        }}>
                        <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setAptPage(p => Math.max(p - 1, 0))} disabled={aptPage === 0}
              className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm disabled:opacity-30 hover:bg-gray-800 transition-all">
              ← Previous
            </button>
            {aptPage < totalPages - 1 ? (
              <button id="apt-next" onClick={() => setAptPage(p => p + 1)}
                className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Next Page →
              </button>
            ) : (
              <button id="apt-submit" onClick={submitAptitude} disabled={aptSubmitting}
                className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all"
                style={{ background: answeredAll ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
                {aptSubmitting ? 'Submitting...' : answeredAll ? '✅ Submit All Answers' : `Submit (${Object.keys(aptAnswers).length}/${aptitudeQuestions.length} answered)`}
              </button>
            )}
          </div>
          <button onClick={resetAll} className="text-gray-600 text-xs hover:text-gray-400 transition-all">← Back to Setup</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: CODING ROUND
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'coding') {
    const prob = codingProblems[codingProblemIndex];
    if (!prob) return null;

    return (
      <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800" style={{ background: '#111827' }}>
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold">💻 Coding Round</h2>
            <span className="text-gray-500 text-sm">Problem {codingProblemIndex + 1} of {codingProblems.length}</span>
          </div>
          <div className="flex items-center gap-3">
            {codingResults.length > 0 && (
              <span className="text-green-400 text-xs font-medium">{codingResults.length} solved</span>
            )}
            <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm transition-all">✕ Exit</button>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
          {/* Left: Problem statement */}
          <div className="w-2/5 border-r border-gray-800 overflow-y-auto p-5 space-y-4" style={{ background: '#111827' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-lg">{prob.title}</h3>
              <DiffBadge d={prob.difficulty} />
            </div>

            <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">{prob.description}</pre>

            {/* Problem progress */}
            <div className="pt-3 border-t border-gray-800">
              <p className="text-gray-500 text-xs mb-2">Progress</p>
              <div className="flex gap-2">
                {codingProblems.map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: codingResults.find(r => r.problemId === i) ? '#22c55e' : i === codingProblemIndex ? '#6366f1' : '#374151',
                      color: 'white'
                    }}>{i + 1}</div>
                ))}
              </div>
            </div>

            {/* Evaluation result */}
            {codingEval && (
              <div className="bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">AI Evaluation</span>
                  <span className="text-lg font-bold" style={{ color: codingEval.score >= 7 ? '#22c55e' : codingEval.score >= 4 ? '#f59e0b' : '#ef4444' }}>
                    {codingEval.score}/10
                  </span>
                </div>
                <div className="text-xs px-2 py-1 rounded-full inline-block"
                  style={{ background: codingEval.verdict === 'Correct' ? '#22c55e20' : codingEval.verdict === 'Partially Correct' ? '#f59e0b20' : '#ef444420', color: codingEval.verdict === 'Correct' ? '#4ade80' : codingEval.verdict === 'Partially Correct' ? '#fbbf24' : '#f87171' }}>
                  {codingEval.verdict}
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{codingEval.feedback}</p>
                {codingEval.hints && <p className="text-blue-400 text-xs">💡 {codingEval.hints}</p>}
                {codingEval.timeComplexity && <p className="text-gray-500 text-xs">⏱ Time: {codingEval.timeComplexity}</p>}

                <div className="flex gap-2 pt-1">
                  {codingProblemIndex < codingProblems.length - 1 ? (
                    <button id="btn-next-problem" onClick={nextCodingProblem}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      Next Problem →
                    </button>
                  ) : (
                    <button id="btn-finish-coding" onClick={() => { setStage('result'); setResult({ type: 'coding', results: codingResults }); }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      🏁 Finish Round
                    </button>
                  )}
                  <button onClick={() => setCodingEval(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-gray-700 hover:bg-gray-700 transition-all">
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Code editor + LeetCode drawer */}
          <div className="flex-grow flex flex-col relative overflow-hidden" style={{ background: '#1e1e1e' }}>
            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden relative transition-all duration-150">
              <CodeEditor language={codingLanguage} value={codingCode} onChange={setCodingCode} onLanguageChange={handleLanguageChange} />
            </div>

            {/* Collapsible Console Drawer */}
            {/* Collapsible Console Drawer */}
            <div className="border-t border-gray-800 bg-[#141414] flex flex-col transition-all duration-150" style={{ height: consoleOpen ? '300px' : 'auto' }}>
              {/* Drawer Header (Unified Action Bar) */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#1c1c1c] border-b border-gray-800 select-none">
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 hover:text-white font-semibold text-xs flex items-center gap-1 cursor-pointer" onClick={() => setConsoleOpen(!consoleOpen)}>
                    <span>Console</span>
                    <span className="text-[10px]">{consoleOpen ? '▼' : '▲'}</span>
                  </span>

                  {consoleOpen && (
                    <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
                      <button type="button" onClick={() => setConsoleTab('testcases')}
                        className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${consoleTab === 'testcases' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                        Testcase
                      </button>
                      <button type="button" onClick={() => setConsoleTab('result')}
                        className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${consoleTab === 'result' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                        Result
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!consoleOpen && runResult && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${runResult.verdict === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {runResult.verdict}
                    </span>
                  )}
                  {error && <p className="text-red-400 text-xs truncate max-w-[200px]" title={error}>{error}</p>}
                  
                  <button type="button" onClick={runCode} disabled={codeRunning || codingSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 hover:text-white text-xs font-bold transition-all border border-gray-700 disabled:opacity-40">
                    Run Code
                  </button>

                  <button id="btn-submit-code" type="button" onClick={submitCode} disabled={codeRunning || codingSubmitting}
                    className="px-4 py-1.5 rounded-lg font-bold text-white text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    {codingSubmitting ? (
                      <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg> Submitting...</>
                    ) : '⚡ Submit Code'}
                  </button>
                </div>
              </div>

              {/* Drawer Body (Content) */}
              {consoleOpen && (
                <div className="flex-1 p-4 overflow-y-auto min-h-0 text-sm text-gray-300 font-sans">
                  {consoleTab === 'testcases' ? (
                    <div className="space-y-4">
                      {/* Case Selectors */}
                      <div className="flex gap-2">
                        {prob.testCases?.map((_, idx) => (
                          <button key={idx} type="button" onClick={() => setActiveTestcaseIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTestcaseIdx === idx ? 'bg-gray-800 text-indigo-400 border border-indigo-500/30' : 'bg-[#242424] text-gray-400 hover:text-white'}`}>
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      {prob.testCases?.[activeTestcaseIdx] && (
                        <div className="space-y-3 bg-[#1c1c1c] p-3 rounded-xl border border-gray-800">
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Input</div>
                            <pre className="bg-[#111] p-2 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">{prob.testCases[activeTestcaseIdx].input}</pre>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Expected Output</div>
                            <pre className="bg-[#111] p-2 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">{prob.testCases[activeTestcaseIdx].expected}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Run Result tab */
                    <div className="space-y-4">
                      {codeRunning ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span className="text-xs text-gray-400 font-mono">Running code against test cases...</span>
                        </div>
                      ) : runResult ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${runResult.verdict === 'Accepted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                              {runResult.verdict}
                            </span>
                            <span className="text-xs text-gray-500">
                              {runResult.testCases?.filter(tc => tc.status === 'Pass').length || 0} / {runResult.testCases?.length || 0} passed
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {runResult.testCases?.map((tc, idx) => (
                              <button key={idx} type="button" onClick={() => setActiveTestcaseIdx(idx)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${activeTestcaseIdx === idx ? 'bg-gray-800 text-white' : 'bg-[#242424] text-gray-400 hover:text-white'}`}>
                                <span className={tc.status === 'Pass' ? 'text-green-400' : 'text-red-400'}>
                                  {tc.status === 'Pass' ? '●' : '●'}
                                </span>
                                <span>Case {idx + 1}</span>
                              </button>
                            ))}
                          </div>

                          {runResult.testCases?.[activeTestcaseIdx] && (
                            <div className="space-y-3 bg-[#1c1c1c] p-3 rounded-xl border border-gray-800">
                              <div>
                                <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Input</div>
                                <pre className="bg-[#111] p-2 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">{runResult.testCases[activeTestcaseIdx].input}</pre>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Expected Output</div>
                                  <pre className="bg-[#111] p-2 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">{runResult.testCases[activeTestcaseIdx].expected}</pre>
                                </div>
                                <div>
                                  <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Actual Output</div>
                                  <pre className="bg-[#111] p-2 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap" style={{ color: runResult.testCases[activeTestcaseIdx].status === 'Pass' ? '#4ade80' : '#f87171' }}>
                                    {runResult.testCases[activeTestcaseIdx].actual}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-xs text-gray-500 font-mono">
                          Click "Run Code" to run the default test cases.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: RESULT (Aptitude or Coding)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'result' && (result?.type === 'aptitude' || aptResult)) {
    const r = aptResult;
    const cats = r?.categoryScores || {};
    return (
      <div className="min-h-screen bg-gray-950 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">{r.totalScore >= 70 ? '🏆' : r.totalScore >= 40 ? '📊' : '📚'}</div>
            <h2 className="text-white text-2xl font-bold">Aptitude Test Complete!</h2>
            <div className="flex justify-center"><ScoreRing score={r.totalScore} size={140} /></div>
            <p className="text-gray-400">{r.correct} correct out of {r.total} questions</p>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(cats).map(([cat, s]) => (
              <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-2">{cat}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">{s.correct}/{s.total}</span>
                  <span className="text-sm font-semibold" style={{ color: (s.correct / s.total) >= 0.7 ? '#22c55e' : (s.correct / s.total) >= 0.4 ? '#f59e0b' : '#ef4444' }}>
                    {Math.round((s.correct / s.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${(s.correct / s.total) * 100}%`, background: (s.correct / s.total) >= 0.7 ? '#22c55e' : (s.correct / s.total) >= 0.4 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Review answers */}
          {r.results && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Answer Review</h3>
              {r.results.map((q, i) => (
                <div key={q.id} className="bg-gray-900 border rounded-xl p-4 text-sm"
                  style={{ borderColor: q.isCorrect ? '#22c55e40' : '#ef444440' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-gray-300 flex-1">{i + 1}. {q.question}</p>
                    <span>{q.isCorrect ? '✅' : '❌'}</span>
                  </div>
                  {!q.isCorrect && (
                    <p className="text-green-400 text-xs mt-2">✓ Correct: {q.correctOption}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button id="btn-retake" onClick={resetAll}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
            🔄 Try Again / New Test
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'result' && result?.type === 'coding') {
    const results = result.results || [];
    const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) : 0;
    return (
      <div className="min-h-screen bg-gray-950 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">{avg >= 70 ? '🏆' : avg >= 40 ? '💪' : '📚'}</div>
            <h2 className="text-white text-2xl font-bold">Coding Round Complete!</h2>
            <div className="flex justify-center"><ScoreRing score={avg} size={140} /></div>
            <p className="text-gray-400">{results.length} problems attempted · Average score {avg}/100</p>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{r.title}</span>
                  <span className="font-bold text-lg" style={{ color: r.score >= 7 ? '#22c55e' : r.score >= 4 ? '#f59e0b' : '#ef4444' }}>{r.score}/10</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.verdict === 'Correct' ? '#22c55e20' : '#f59e0b20', color: r.verdict === 'Correct' ? '#4ade80' : '#fbbf24' }}>{r.verdict}</span>
                {r.feedback && <p className="text-gray-400 text-xs mt-2">{r.feedback}</p>}
              </div>
            ))}
          </div>
          <button id="btn-coding-retry" onClick={resetAll}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: WAITING ROOM
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'waiting') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full mx-auto space-y-4">

        {/* AI self-practice: show loading spinner */}
        {role === 'student' ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl animate-bounce" style={{ background: 'linear-gradient(135deg, #6366f120, #ef444420)' }}>🤖</div>
            <div>
              <h2 className="text-white font-bold text-xl mb-2">AI is Preparing Your Interview</h2>
              <p className="text-gray-400 text-sm">Generating personalized questions from your resume...</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-gray-600 text-xs">This will only take a moment...</p>
          </div>
        ) : (
          /* HR/Admin room: show Room ID sharing panel */
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#ef444420' }}>🎙️</div>
              <h2 className="text-white font-bold text-xl">Interview Room Ready</h2>
              <p className="text-gray-400 text-sm">Share the Room ID with the interviewer/candidate</p>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Room ID</p>
                <p className="text-white text-2xl font-bold font-mono tracking-wider">{roomId}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button id="btn-copy-room" onClick={handleCopyRoomId}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">
                  {copyText}
                </button>
                <a href={`https://wa.me/?text=Join my interview: Room ID ${roomId}`} target="_blank" rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all">
                  WhatsApp 📲
                </a>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 text-sm">Waiting for participants... ({participants.length} joined)</span>
              </div>
            </div>

            {/* Email invite */}
            {isRoomCreator && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm">📧 Email Invitation</h3>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Candidate name (optional)"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                <div className="flex gap-2">
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="candidate@email.com"
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                  <button id="btn-send-invite" onClick={handleSendEmailInvite} disabled={emailSending || !inviteEmail}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                    style={{ background: '#ef4444' }}>
                    {emailSending ? '...' : emailSent ? '✅' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={resetAll} className="block mx-auto text-gray-600 text-xs hover:text-gray-400 transition-all">← Back to Setup</button>
      </div>
    </div>
  );


  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LIVE INTERVIEW (Admin + Student face-to-face)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'interview') {
    const isAdmin = role === 'admin';

    // ── AI Self-Practice Interview (no video, no chat, single user) ──
    if (mainMode === 'ai') {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800" style={{ background: '#111827' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">🤖 AI Interview</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: '#6366f120', color: '#818cf8', border: '1px solid #6366f130' }}>
                Q {questionNumber} / {totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm transition-all">✕ Exit</button>
            </div>
          </div>

          {/* Main layout wrapper */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar for Question Progress */}
            <div className="w-64 border-r border-gray-800 bg-gray-900/30 p-5 overflow-y-auto hidden md:block">
              <h3 className="text-gray-400 text-xs font-semibold mb-4 uppercase tracking-wider">Interview Progress</h3>
              <div className="space-y-2">
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const isPast = i < questionNumber - 1;
                  const isCurrent = i === questionNumber - 1;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isCurrent ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-sm' : 'border border-transparent'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${isPast ? 'bg-green-500/20 text-green-400' : isCurrent ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-800 text-gray-500'}`}>
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${isPast ? 'text-gray-400' : isCurrent ? 'text-indigo-400 font-medium' : 'text-gray-600'}`}>
                        Question {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-start justify-center p-6 md:p-10 overflow-y-auto">
              <div className="w-full max-w-2xl space-y-5">

              {/* AI avatar + question */}
              {currentQuestion ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 mt-1"
                      style={{ background: 'linear-gradient(135deg, #6366f120, #ef444420)', border: '1px solid #6366f130' }}>
                      🤖
                    </div>
                    <div className="flex-1 bg-gray-900 border border-indigo-500/30 rounded-2xl rounded-tl-none p-5 space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                          Question {questionNumber}
                        </span>
                        {currentQuestion.topic && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                            {currentQuestion.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium text-lg leading-relaxed">{currentQuestion.question}</p>
                    </div>
                  </div>

                  {/* Answer box */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 mt-1"
                      style={{ background: '#1f2937', border: '1px solid #374151' }}>
                      👤
                    </div>
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={6}
                        className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <div className="flex gap-3">
                        <button id="btn-voice-toggle" onClick={toggleVoice}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
                          style={{ borderColor: isListening ? '#ef4444' : '#374151', background: isListening ? '#ef444420' : '#1f2937', color: isListening ? '#f87171' : '#9ca3af' }}>
                          {isListening ? '🔴 Stop' : '🎙️ Voice'}
                        </button>
                        <button id="btn-submit-answer" onClick={handleSubmitAnswer} disabled={!answer.trim()}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                          style={{ background: answer.trim() ? 'linear-gradient(135deg, #6366f1, #ef4444)' : '#374151' }}>
                          Submit Answer →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show a subtle "loading next question" indicator after submit */}
                  {feedback && (
                    <div className="ml-16 flex items-center gap-2 text-gray-600 text-xs">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span>Loading next question...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-pulse"
                    style={{ background: 'linear-gradient(135deg, #6366f120, #ef444420)' }}>🤖</div>
                  <p className="text-gray-400 text-sm">AI is preparing your next question...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

    // ── HR Live Interview (video + chat + admin panel) ──
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800" style={{ background: '#111827' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">LIVE</span>
            </div>
            <span className="text-gray-400 text-sm font-mono">{roomId}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            {isAdmin && (
              <button id="btn-end-interview" onClick={handleEndInterview}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#ef4444' }}>
                End Interview
              </button>
            )}
            <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              {/* Video */}
              <div className="w-1/2 p-3 border-r border-gray-800">
                <VideoCall socket={socket} roomId={roomId} userName={userName || user.name} isAiMode={false} />
                {!isAdmin && (
                  <div className="mt-3 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    <span className="text-indigo-400 text-xs">AI is passively monitoring this session for quality assurance</span>
                  </div>
                )}
              </div>

              {/* Question / Answer panel */}
              <div className="w-1/2 flex flex-col overflow-hidden">
                {isAdmin ? (
                  <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-semibold text-sm">📤 Send Question</h3>
                      <select value={adminTopic} onChange={e => setAdminTopic(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                        {['General', 'Technical', 'Behavioral', 'Problem Solving', 'HR'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <textarea value={adminQuestion} onChange={e => setAdminQuestion(e.target.value)}
                        placeholder="Type your question here..."
                        rows={3} className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-500" />
                      <button id="btn-send-question" onClick={handleAdminQuestion} disabled={!adminQuestion.trim()}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                        style={{ background: '#ef4444' }}>
                        Send Question
                      </button>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                        <h3 className="text-white font-semibold text-sm">🤖 AI Monitor</h3>
                      </div>
                      {aiMonitorLog.length === 0 ? (
                        <p className="text-gray-600 text-xs text-center py-3">Waiting for student answers...</p>
                      ) : aiMonitorLog.map((log, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-2 text-xs text-gray-400">{log.message}</div>
                      ))}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-semibold text-sm">📋 Manual Evaluation</h3>
                      {Object.entries(evalScores).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <label className="text-gray-400 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                            <span className="text-yellow-400 text-xs font-bold">{val}/5 {'⭐'.repeat(val)}</span>
                          </div>
                          <input type="range" min="0" max="5" step="1" value={val}
                            onChange={e => setEvalScores(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                            className="w-full accent-yellow-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-4">
                    {currentQuestion ? (
                      <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Question {questionNumber}</span>
                          {currentQuestion.topic && <span className="text-xs text-gray-500">{currentQuestion.topic}</span>}
                        </div>
                        <p className="text-white font-medium">{currentQuestion.question}</p>
                        <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          rows={5} className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-500" />
                        <div className="flex gap-2">
                          <button id="btn-voice-toggle" onClick={toggleVoice}
                            className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                            style={{ borderColor: isListening ? '#ef4444' : '#374151', background: isListening ? '#ef444420' : '#1f2937', color: isListening ? '#f87171' : '#9ca3af' }}>
                            {isListening ? '🔴 Stop' : '🎙️ Voice'}
                          </button>
                          <button id="btn-submit-answer" onClick={handleSubmitAnswer} disabled={!answer.trim()}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                            style={{ background: '#ef4444' }}>
                            Submit Answer
                          </button>
                        </div>
                        {feedback && (
                          <div className="bg-gray-800 rounded-xl p-3 space-y-1 border border-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">AI Score</span>
                              <span className="font-bold" style={{ color: feedback.score >= 7 ? '#22c55e' : feedback.score >= 4 ? '#f59e0b' : '#ef4444' }}>{feedback.score}/10</span>
                            </div>
                            <p className="text-gray-300 text-xs">{feedback.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
                        <div className="text-3xl mb-3">⏳</div>
                        <p className="text-gray-400 text-sm">Waiting for the interviewer to send a question...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="border-t border-gray-800" style={{ height: '200px', background: '#111827' }}>
              <div className="flex h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-600 text-xs text-center pt-2">Chat messages will appear here</p>
                  ) : messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 text-xs ${msg.role === 'system' ? 'justify-center' : ''}`}>
                      {msg.role === 'system' ? (
                        <span className="text-gray-500 italic">{msg.message}</span>
                      ) : (
                        <>
                          <span className="font-medium" style={{ color: msg.role === 'admin' ? '#f87171' : '#a5b4fc' }}>{msg.userName}:</span>
                          <span className="text-gray-300">{msg.message}</span>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex flex-col border-l border-gray-800 p-2 gap-2" style={{ width: '220px' }}>
                  <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Type a message..."
                    rows={3} className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:border-red-500" />
                  <button id="btn-send-chat" onClick={handleSendMessage} disabled={!newMessage.trim()}
                    className="py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: '#ef4444' }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Q&A RESULT (from socket-based interview)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'result' && result?.type === 'qa') {
    return (
      <div className="min-h-screen bg-gray-950 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">{result.totalScore >= 70 ? '🏆' : '📊'}</div>
            <h2 className="text-white text-2xl font-bold">Interview Complete!</h2>
            <div className="flex justify-center"><ScoreRing score={result.totalScore} size={140} /></div>
            <p className="text-gray-400">{result.message}</p>
          </div>
          {result.results?.map((r, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm space-y-2">
              <p className="text-white font-medium">{i + 1}. {r.question}</p>
              <p className="text-gray-400 text-xs">{r.answer}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: r.score >= 7 ? '#22c55e' : r.score >= 4 ? '#f59e0b' : '#ef4444' }}>Score: {r.score}/10</span>
                <span className="text-gray-500 text-xs">{r.feedback}</span>
              </div>
            </div>
          ))}
          <button onClick={resetAll} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>🔄 New Session</button>
        </div>
      </div>
    );
  }

  return null;
}