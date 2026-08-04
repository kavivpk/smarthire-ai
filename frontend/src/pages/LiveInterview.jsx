import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';
import VideoCall from '../components/VideoCall';
import CodeEditor from '../components/CodeEditor';
import { BACKEND_URL, AI_SERVICE_URL } from '../config/apiConfig';
import { useTheme } from '../context/useTheme';
import ProctoringGuard from '../components/ProctoringGuard';

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
  const { isDark } = useTheme();
  const pct = Math.min(Math.max(score, 0), max) / max;
  const r = 44, C = 2 * Math.PI * r;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const trackColor = isDark ? '#374151' : '#e5e7eb';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{score}</span>
        <span className="text-xs text-gray-400">/{max}</span>
      </div>
    </div>
  );
};

export default function LiveInterview() {
  const { isDark } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── global state ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState('setup'); // setup | aptitude | coding | qa_interview | waiting | interview | result
  const [mainMode, setMainMode] = useState('ai'); // ai | admin
  const [aiSubMode, setAiSubMode] = useState('aptitude'); // aptitude | coding | qa
  // ── AI Session (3-step sequential flow) ──────────────────────────────────
  // aptitude → coding → technical → complete
  const [aiSessionStage, setAiSessionStage] = useState('aptitude');
  const [sessionViolations, setSessionViolations] = useState(0);
  const [sessionDisqualified, setSessionDisqualified] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sectionPhase, setSectionPhase] = useState('instructions'); // 'instructions' | 'active' | 'result'
  const [aiSessionStream, setAiSessionStream] = useState(null); // camera stream from ProctoringGuard session
  const [aiCodingResult, setAiCodingResult] = useState(null); // { solved, total, avgScore, results }
  const [techResult, setTechResult] = useState(null); // { overallScore, totalScore }
  const [combinedScore, setCombinedScore] = useState(null); // { score, outOf, percent }
  const [candidateDisqualified, setCandidateDisqualified] = useState(null); // for interviewer side
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
  const [copyText, setCopyText] = useState(' Copy Room ID');
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
  const testStartTimeRef = useRef(null);   // set once when aptitude loads — never reset
  const stageRef = useRef('setup');        // mirror of stage — readable inside stale closures
  const aptResultRef = useRef(null);
  const aiCodingResultRef = useRef(null);
  const techResultRef = useRef(null);
  const sessionViolationsRef = useRef(0);
  const sessionDisqualifiedRef = useRef(false);
  const TOTAL_TEST_DURATION_MS = 75 * 60 * 1000; // 75 minutes total

  // manual evaluation (admin side)
  const [evalScores, setEvalScores] = useState({ communication: 0, technical: 0, problemSolving: 0, cultureFit: 0 });
  const [aiMonitorLog, setAiMonitorLog] = useState([]);

  // email invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // ── Aptitude state ────────────────────────────────────────────────────────
  const [aptSections, setAptSections] = useState([]);
  const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
  const [aptAnswers, setAptAnswers] = useState({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentAptQuestionIdx, setCurrentAptQuestionIdx] = useState(0);
  const [aptTotalTimeLeft, setAptTotalTimeLeft] = useState(4500);
  const [aptLoading, setAptLoading] = useState(false);
  const [aptResult, setAptResult] = useState(null);
  const [aptSubmitting, setAptSubmitting] = useState(false);
  const [showSectionConfirm, setShowSectionConfirm] = useState(false);
  const [sectionConfirmInput, setSectionConfirmInput] = useState('');
  const [aptSectionTimeLeft, setAptSectionTimeLeft] = useState(0);
  
  // ── Result / Feedback state ───────────────────────────────────────────────
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState([0,0,0,0,0]);

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
  const [codingTimeLeft, setCodingTimeLeft] = useState(1200); // 20 minutes in seconds

  // ── Resume-based Q&A state ───────────────────────────────────────────────
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [questionCount, setQuestionCount] = useState(35); // Always default to 35 questions
  const [result, setResult] = useState(null);

  // ── Aptitude custom PDF state ─────────────────────────────────────────────
  const [aptitudeFile, setAptitudeFile] = useState(null);
  const [aptitudeSource, setAptitudeSource] = useState('default'); // 'default' | 'pdf'

  // Keep stageRef in sync so socket callbacks (stale closures) can read current stage
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { aptResultRef.current = aptResult; }, [aptResult]);
  useEffect(() => { aiCodingResultRef.current = aiCodingResult; }, [aiCodingResult]);
  useEffect(() => { techResultRef.current = techResult; }, [techResult]);
  useEffect(() => { sessionViolationsRef.current = sessionViolations; }, [sessionViolations]);
  useEffect(() => { sessionDisqualifiedRef.current = sessionDisqualified; }, [sessionDisqualified]);

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
      const sections = res.data.sections || [];
      setAptSections(sections);
      
      // Flatten all questions for final submit evaluation
      const flat = sections.flatMap(sec => sec.questions.map(q => ({ ...q, section: sec.section })));
      setAptitudeQuestions(flat);
      
      setAptAnswers({});
      setCurrentSectionIdx(0);
      setCurrentAptQuestionIdx(0);
      // Single source of truth: record start time once, never reset between sections
      if (!testStartTimeRef.current) {
        testStartTimeRef.current = Date.now();
      }
      const elapsed = Date.now() - testStartTimeRef.current;
      setAptTotalTimeLeft(Math.max(0, Math.round((TOTAL_TEST_DURATION_MS - elapsed) / 1000)));
      const firstSecLen = sections[0]?.questions?.length || 0;
      setAptSectionTimeLeft(firstSecLen * 60); // per-section pacing guide (informational)
      setAptResult(null);
      // Don't change stage if already in ai_interview — we're embedded inside ProctoringGuard
      if (stage !== 'ai_interview') setStage('aptitude');
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
        questions: aptitudeQuestions,
        skipEmail: false,
      });
      setAptResult(res.data);
      // In AI sequential flow, advance to coding; otherwise show result
      if (stageRef.current === 'ai_interview') {
        onAptitudeComplete(res.data);
      } else {
        setStage('result');
      }
    } catch {
      setError('Failed to submit. Try again.');
    } finally {
      setAptSubmitting(false);
    }
  };

  const handleNextAptQuestion = () => {
    const currentSection = aptSections[currentSectionIdx];
    if (!currentSection) return;

    if (currentAptQuestionIdx + 1 < currentSection.questions.length) {
      setCurrentAptQuestionIdx(prev => prev + 1);
    } else {
      // End of section
      if (currentSectionIdx + 1 < aptSections.length) {
        setCurrentSectionIdx(prev => prev + 1);
        setCurrentAptQuestionIdx(0);
      } else {
        // End of test
        submitAptitude();
      }
    }
  };

  const handlePrevAptQuestion = () => {
    if (currentAptQuestionIdx > 0) {
      setCurrentAptQuestionIdx(prev => prev - 1);
    } else if (currentSectionIdx > 0) {
      const prevSecIdx = currentSectionIdx - 1;
      setCurrentSectionIdx(prevSecIdx);
      setCurrentAptQuestionIdx(aptSections[prevSecIdx].questions.length - 1);
    }
  };

  const handleSubmitSection = () => {
    const isLastSection = currentSectionIdx >= aptSections.length - 1;
    if (isLastSection) {
      submitAptitude();
    } else {
      const nextIdx = currentSectionIdx + 1;
      const nextSecLen = aptSections[nextIdx]?.questions?.length || 0;
      setAptSectionTimeLeft(nextSecLen * 60); // reset section timer
      setCurrentSectionIdx(nextIdx);
      setCurrentAptQuestionIdx(0);
    }
  };

  // Aptitude Global Timer — single source of truth via testStartTimeRef
  useEffect(() => {
    if ((stage !== 'aptitude' && stage !== 'ai_interview') || aptResult || aptitudeQuestions.length === 0) return;
    const interval = setInterval(() => {
      if (!testStartTimeRef.current) return;
      const elapsed = Date.now() - testStartTimeRef.current;
      const remaining = Math.max(0, Math.round((TOTAL_TEST_DURATION_MS - elapsed) / 1000));
      setAptTotalTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        submitAptitude();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, aptResult, aptitudeQuestions]);

  // Aptitude Per-Section Timer
  useEffect(() => {
    if ((stage !== 'aptitude' && stage !== 'ai_interview') || aptResult || aptSectionTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setAptSectionTimeLeft(prev => {
        if (prev <= 1) {
          // Section time expired — auto advance
          handleSubmitSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, aptResult, currentSectionIdx]);

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
      // Don't change stage if already in ai_interview — embedded flow
      if (stage !== 'ai_interview') setStage('coding');
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
      if (stage === 'ai_interview') {
        onCodingComplete(codingResults);
      } else {
        setStage('result');
        setResult({ type: 'coding', results: codingResults });
      }
    } else {
      setCodingProblemIndex(nextIdx);
      setCodingEval(null);
      setCodingCode(codingProblems[nextIdx]?.starterCode?.[codingLanguage] || '// Write your solution here\n');
    }
  };

  const handleAutoSubmitCode = async () => {
    let finalResults = codingResults;
    if (codingCode.trim()) {
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
        finalResults = [...codingResults, { problemId: prob.id, title: prob.title, ...evalData }];
        setCodingResults(finalResults);
      } catch (err) {
        // Safe fail
      }
    }
    
    const nextIdx = codingProblemIndex + 1;
    if (nextIdx >= codingProblems.length) {
      if (stage === 'ai_interview') {
        onCodingComplete(finalResults);
      } else {
        setStage('result');
        setResult({ type: 'coding', results: finalResults });
      }
    } else {
      setCodingProblemIndex(nextIdx);
      setCodingEval(null);
      setCodingCode(codingProblems[nextIdx]?.starterCode?.[codingLanguage] || '// Write your solution here\n');
    }
  };

  // Coding Timers — unified global timer when inside ai_interview, per-problem 20-min timer otherwise
  useEffect(() => {
    if ((stage !== 'coding' && stage !== 'ai_interview') || codingProblems.length === 0) return;
    if (stage === 'ai_interview' && testStartTimeRef.current) {
      // Sync from global clock so the timer continues uninterrupted across stages
      const elapsed = Date.now() - testStartTimeRef.current;
      setCodingTimeLeft(Math.max(0, Math.round((TOTAL_TEST_DURATION_MS - elapsed) / 1000)));
    } else {
      setCodingTimeLeft(1200); // standalone 20-minute coding timer
    }
  }, [stage, codingProblemIndex, codingProblems]);

  useEffect(() => {
    if ((stage !== 'coding' && stage !== 'ai_interview') || codingProblems.length === 0) return;

    const interval = setInterval(() => {
      if (stage === 'ai_interview' && testStartTimeRef.current) {
        // Global clock — keep in sync
        const elapsed = Date.now() - testStartTimeRef.current;
        const remaining = Math.max(0, Math.round((TOTAL_TEST_DURATION_MS - elapsed) / 1000));
        setCodingTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          handleAutoSubmitCode();
        }
      } else {
        setCodingTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmitCode();
            return 1200;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, codingProblemIndex, codingProblems, codingCode, codingLanguage]);

  // ══════════════════════════════════════════════════════════════════════════
  // AI SEQUENTIAL FLOW — stage-change triggers
  // ══════════════════════════════════════════════════════════════════════════
  // When session starts, load aptitude questions
  useEffect(() => {
    if (stage === 'ai_interview' && sessionStarted && aiSessionStage === 'aptitude') {
      if (aptitudeQuestions.length === 0 && !aptLoading) startAptitude();
    }
  }, [sessionStarted, stage, aiSessionStage]);

  // When coding stage begins, load coding problems
  useEffect(() => {
    if (stage === 'ai_interview' && sessionStarted && aiSessionStage === 'coding') {
      if (codingProblems.length === 0 && !codingLoading) startCoding();
    }
  }, [sessionStarted, stage, aiSessionStage]);

  // When technical stage begins, auto-start the tech interview if resume is ready
  useEffect(() => {
    if (stage === 'ai_interview' && sessionStarted && aiSessionStage === 'technical' && resumeFile && !resumeAnalyzing && !socket) {
      startAiTechInterview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStarted, stage, aiSessionStage]);

  // ══════════════════════════════════════════════════════════════════════════
  // SOCKET / ADMIN INTERVIEW FLOW
  // ══════════════════════════════════════════════════════════════════════════
  const connectSocket = useCallback(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('room_created', ({ roomId: id, mode }) => {
      setRoomId(id);
      // Don't overwrite stage when in ai_interview (tech Q&A sub-flow uses socket internally)
      if (stageRef.current !== 'ai_interview') setStage('waiting');
      if (mode !== 'ai') setShowModal(true);
    });
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
      // Don't overwrite stage when in ai_interview — Tech Q&A runs embedded
      if (stageRef.current !== 'ai_interview') setStage('interview');
    });
    newSocket.on('answer_feedback', ({ score, feedback: fb }) => setFeedback({ score, feedback: fb }));
    newSocket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
    newSocket.on('interview_complete', ({ totalScore, results: r, message }) => {
      if (stageRef.current === 'ai_interview') {
        // AI sequential flow: tech result out of 10 (socket returns 0-10 avg score)
        const tech = { overallScore: totalScore, totalScore };
        setTechResult(tech);
        setAiSessionStage('complete');
        saveAndEmailSession({ techResult: tech });
      } else {
        setResult({ totalScore, results: r, message, type: 'qa' });
        setStage('result');
      }
    });
    newSocket.on('error', ({ message }) => setError(message));
    newSocket.on('room_joined', ({ roomId: id, mode: roomMode, participants: p }) => {
      setRoomId(id);
      setParticipants(p);
      // Don't overwrite stage when in ai_interview
      if (stageRef.current !== 'ai_interview') setStage('waiting');
    });
    newSocket.on('interview_started', () => {
      // Don't overwrite stage when in ai_interview (tech Q&A runs embedded)
      if (stageRef.current !== 'ai_interview') setStage('interview');
    });
    // Candidate disqualified relay (interviewer receives this)
    newSocket.on('candidate_disqualified', ({ violations, reason }) => {
      setCandidateDisqualified({ violations, reason });
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

  const startInterview = () => { if (socket) socket.emit('start_interview', { roomId }); };

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
    setCopyText(' Copied!');
    setTimeout(() => setCopyText(' Copy Room ID'), 2000);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // COMBINED AI INTERVIEW — helpers
  // ══════════════════════════════════════════════════════════════════════════

  // Pure helper — extract outside component for testability
  // Scale: Aptitude /80 + Coding /30 + Technical /40 = /150 total (matches spec example)
  function computeCombinedScore(apt, cod, tech) {
    // Aptitude: correct/total × 80 points
    const aptPts  = apt  ? Math.round((apt.correct  / (apt.total  || 1)) * 80) : 0;
    // Coding: avgScore is 0-10 per problem; scale to 30 pts total
    const codPts  = cod  ? Math.round(((cod.avgScore || 0) / 10) * 30) : 0;
    // Technical: overallScore is 0-10 from socket; scale to 40 pts
    const techPts = tech ? Math.round(((tech.overallScore || 0) / 10) * 40) : 0;
    const score   = aptPts + codPts + techPts;
    return { score, outOf: 150, percent: Math.round((score / 150) * 100), aptPts, codPts, techPts };
  }

  const saveAndEmailSession = useCallback(async (overrides = {}) => {
    try {
      const apt  = overrides.aptResult  ?? aptResultRef.current;
      const cod  = overrides.codingResult ?? aiCodingResultRef.current;
      const tech = overrides.techResult  ?? techResultRef.current;
      const combined = computeCombinedScore(apt, cod, tech);
      console.log('[saveAndEmailSession] Saving session & sending email...', {
        apt, cod, tech, combined,
        disqualified: overrides.disqualified ?? sessionDisqualifiedRef.current,
      });
      const response = await API.post('/interview/session/save', {
        aptitudeResult:  apt  || {},
        codingResult:    cod  || {},
        technicalResult: tech || {},
        overallScore:    combined,
        violations:      overrides.violations  ?? sessionViolationsRef.current,
        disqualified:    overrides.disqualified ?? sessionDisqualifiedRef.current,
      });
      console.log('[saveAndEmailSession] Session saved:', response.data);
    } catch (err) {
      console.error('[saveAndEmailSession] Session save failed:', err.response?.data || err.message);
    }
  }, []);

  const onAptitudeComplete = useCallback(async (result) => {
    setAptResult(result);
    setSectionPhase('result');
    try {
      await API.post('/interview/aptitude/email', { aptitudeResult: result });
    } catch (err) {
      console.error('Failed to send aptitude email', err);
    }
  }, []);

  const onCodingComplete = useCallback(async (results) => {
    const solved   = results.filter(r => (r.score || 0) >= 5).length;
    const avgScore = results.length
      ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) / 10
      : 0;
    const codingRes = { solved, total: results.length, avgScore, results };
    setAiCodingResult(codingRes);
    setSectionPhase('result');
    try {
      await API.post('/interview/coding/email', { codingResult: codingRes });
    } catch (err) {
      console.error('Failed to send coding email', err);
    }
  }, []);

  const handleAIDisqualified = useCallback(async ({ violations, reason }) => {
    setSessionViolations(violations);
    setSessionDisqualified(true);

    // If aptitude was in progress but not yet submitted, force-submit it now
    // so partial scores are captured before sending the combined email
    let aptData = aptResultRef.current;
    if (!aptData && aptitudeQuestions.length > 0) {
      try {
        const res = await API.post('/interview/aptitude/submit', {
          answers: aptAnswers,
          questions: aptitudeQuestions,
          skipEmail: false,
        });
        aptData = res.data;
        // sync the ref immediately so saveAndEmailSession picks it up
        aptResultRef.current = aptData;
      } catch (err) {
        console.error('Force aptitude submit on disqualify failed:', err);
      }
    }

    saveAndEmailSession({
      aptResult: aptData,
      disqualified: true,
      violations,
    });
  }, [saveAndEmailSession, aptitudeQuestions, aptAnswers]);

  const handleManualDisqualified = useCallback(({ violations, reason }) => {
    setSessionViolations(violations);
    setSessionDisqualified(true);
    if (socket) socket.emit('candidate_disqualified', { roomId, violations, reason });
  }, [socket, roomId]);

  const resetAll = () => {
    setStage('setup'); setResult(null); setMessages([]);
    setCurrentQuestion(null); setEmailSent(false); setFeedback(null);
    setShowModal(false); setRoomId(''); setIsRoomCreator(false);
    setResumeFile(null); setResumeSkills([]);
    setAptitudeQuestions([]); setAptAnswers({}); setAptResult(null);
    setCodingResults([]); setCodingEval(null); setAiMonitorLog([]);
    testStartTimeRef.current = null;
    setAiSessionStage('aptitude'); setSessionViolations(0);
    setSessionDisqualified(false); setSessionStarted(false);
    setAiCodingResult(null); setTechResult(null); setCombinedScore(null);
    setCandidateDisqualified(null); setAiSessionStream(null);
    setEvalScores({ communication: 0, technical: 0, problemSolving: 0, cultureFit: 0 });
    if (socket) { socket.disconnect(); setSocket(null); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: SETUP
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'setup') return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">Interview Studio</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
            style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
            Live Interview Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }}>
            AI-powered aptitude, coding rounds & live HR interviews
          </p>
        </div>

        {/* Mode picker */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { id: 'ai', icon: '', title: 'AI Interview', desc: 'Self-practice with AI evaluation', badge: 'No interviewer needed' },
            { id: 'admin', icon: '️', title: 'HR Live Interview', desc: 'Real-time with recruiter/HR', badge: 'WebRTC + AI monitoring' },
          ].map(m => (
            <button key={m.id} id={`mode-${m.id}`} onClick={() => setMainMode(m.id)}
              className="relative p-6 rounded-2xl border-2 text-left transition-all"
              style={{ borderColor: mainMode === m.id ? '#ef4444' : (isDark ? '#374151' : '#e5e7eb'), background: mainMode === m.id ? 'rgba(239,68,68,0.08)' : (isDark ? '#111827' : '#ffffff'), color: isDark ? '#ffffff' : '#111827' }}>
              <div className="text-3xl mb-3">{m.icon}</div>
              <div className="font-bold text-gray-900 dark:text-white text-lg">{m.title}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{m.desc}</div>
              <div className="mt-3 inline-block text-xs px-2 py-0.5 rounded-full" style={{ background: mainMode === m.id ? '#ef444430' : (isDark ? '#1f2937' : '#f3f4f6'), color: mainMode === m.id ? '#f87171' : (isDark ? '#6b7280' : '#4b5563') }}>{m.badge}</div>
              {mainMode === m.id && <div className="absolute top-4 right-4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
            </button>
          ))}
        </div>

        {/* ── AI Interview ── */}
        {mainMode === 'ai' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-gray-900 dark:text-white font-bold text-xl"
              style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
              AI Interview
            </h2>

            {/* Choose Interview Type */}
            <div>
              <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-base mb-3">Choose Interview Type</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'aptitude', icon: '', label: 'Aptitude', desc: '20 MCQ questions', color: '#6366f1' },
                  { id: 'coding',   icon: '', label: 'Coding',   desc: 'Multi-language editor', color: '#f59e0b' },
                  { id: 'qa',       icon: '️', label: 'Tech Q&A', desc: 'Resume-based questions', color: '#10b981' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    id={`submode-${sub.id}`}
                    onClick={() => setAiSubMode(sub.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center"
                    style={{
                      borderColor: aiSubMode === sub.id ? sub.color : (isDark ? '#374151' : '#e5e7eb'),
                      background: aiSubMode === sub.id ? `${sub.color}15` : (isDark ? '#111827' : '#f9fafb'),
                    }}
                  >
                    <span className="text-2xl">{sub.icon}</span>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">{sub.label}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{sub.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Your Name</label>
              <input id="ai-name" type="text" value={userName} onChange={e => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            {/* Resume upload */}
            {aiSubMode === 'qa' && (
              <div>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={!!resumeFile}
                    onChange={() => { if (resumeFile) setResumeFile(null); else document.getElementById('ai-resume-upload').click(); }}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  Upload Resume (AI generates questions from your resume)
                </label>
                <div
                  onClick={() => document.getElementById('ai-resume-upload').click()}
                  className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: resumeFile ? '#10b981' : (isDark ? '#374151' : '#d1d5db'),
                    background: resumeFile ? 'rgba(16,185,129,0.06)' : (isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb'),
                  }}
                >
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl"></span>
                      <span className="text-green-500 dark:text-green-400 text-sm font-semibold">{resumeFile.name}</span>
                      <span className="text-gray-400 text-xs">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl text-gray-400"></span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Click to upload your resume (PDF)</span>
                      <span className="text-gray-400 text-xs">Optional — enhances question quality</span>
                    </div>
                  )}
                </div>
                <input
                  id="ai-resume-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => { if (e.target.files[0]) setResumeFile(e.target.files[0]); }}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>}

            {/* Start button */}
            <button id="btn-start-ai"
              onClick={() => {
                if (!userName.trim()) { setError('Please enter your name'); return; }
                setError('');
                setAiSessionStage(aiSubMode === 'qa' ? 'technical' : aiSubMode);
                setSectionPhase('instructions');
                setSessionStarted(false);
                setStage('ai_interview');
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
              {aiSubMode === 'aptitude' ? ' Start Aptitude Test' : aiSubMode === 'coding' ? ' Start Coding Round' : '️ Start Technical Interview'}
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
                { id: 'student', label: ' Student / Candidate', desc: 'You are being interviewed' },
                { id: 'admin', label: ' HR / Interviewer', desc: 'You are conducting the interview' },
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
                 Create Room
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
  // RENDER: AI INTERVIEW (combined sequential flow with ProctoringGuard)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'ai_interview') {
    // 3-step progress bar
    const steps = [
      { id: 'aptitude',  label: 'Aptitude',      icon: '' },
      { id: 'coding',    label: 'Coding',         icon: '' },
      { id: 'technical', label: 'Technical Q&A',  icon: '️' },
    ];
    const stageOrder = { aptitude: 0, coding: 1, technical: 2, complete: 3 };
    const currentStepIdx = stageOrder[aiSessionStage] ?? 0;

    const AIProgress = () => (
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-gray-800">
        {steps.map((s, i) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: i < currentStepIdx ? '#10b981' : i === currentStepIdx ? '#6366f1' : 'rgba(255,255,255,0.06)',
              color: i <= currentStepIdx ? '#fff' : '#6b7280',
              border: i === currentStepIdx ? '1px solid #6366f1' : '1px solid transparent',
            }}>{i < currentStepIdx ? '✓ ' : ''}{s.icon} {s.label}</span>
            {i < steps.length - 1 && <span style={{ color: '#374151', fontSize: 12 }}>→</span>}
          </span>
        ))}
        {sessionViolations > 0 && !sessionDisqualified && (
          <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
            color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
             {sessionViolations}/3
          </span>
        )}
      </div>
    );

    // Combined results screen
    if (aiSessionStage === 'complete' || sessionDisqualified) {
      return (
        <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            {sessionDisqualified && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="text-red-400 font-bold text-base"> Session Disqualified</p>
                <p className="text-red-300 text-sm mt-1">Your session was terminated after {sessionViolations}/3 proctoring violations. Partial scores recorded.</p>
              </div>
            )}

            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.15))', border: '2px solid rgba(99,102,241,0.3)' }}>
                Email
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                AI Interview Complete!
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your interview session has ended. A detailed report with your scores has been sent to your registered email address.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl mx-auto"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold">
                Full report emailed to {user.email || 'your registered address'}
              </span>
            </div>

            <p className="text-gray-500 text-xs">
              Check your inbox (and spam folder) for the complete score breakdown including Aptitude, Coding, and Technical Q&A results.
            </p>

            <button onClick={resetAll} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
               Return to Setup
            </button>
          </div>
        </div>
      );
    }

    // --- INSTRUCTIONS PHASE ---
    if (sectionPhase === 'instructions') {
      const sectionInfo = aiSessionStage === 'aptitude' ? { title: 'Aptitude Test', icon: 'Test', desc: '20 multiple-choice questions testing logical reasoning.' }
        : aiSessionStage === 'coding' ? { title: 'Coding Round', icon: 'Code', desc: 'Write and execute code to solve algorithmic challenges.' }
        : { title: 'Technical Q&A', icon: 'Voice', desc: 'AI-driven voice interview based on your resume.' };

      return (
        <div className="min-h-screen bg-gray-950 p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-xl font-bold text-indigo-400"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.15))', border: '2px solid rgba(99,102,241,0.3)' }}>
                {sectionInfo.icon}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{sectionInfo.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{sectionInfo.desc}</p>
            </div>
            
            {aiSessionStage === 'technical' && (
              <div className="bg-gray-800 p-4 rounded-xl text-left border border-gray-700">
                <p className="text-gray-300 text-sm font-medium mb-2"> Upload Resume (Required for Tech Q&A)</p>
                <div onClick={() => document.getElementById('aiQaResumeUpload').click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors hover:border-indigo-500/50" style={{ borderColor: resumeFile ? '#10b981' : '#374151', background: resumeFile ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)' }}>
                  {resumeFile ? <p className="text-green-400 text-sm">{resumeFile.name}</p> : <p className="text-gray-400 text-sm">Click to browse (PDF)</p>}
                  <input id="aiQaResumeUpload" type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files[0]) setResumeFile(e.target.files[0]); }} />
                </div>
              </div>
            )}
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
              <p className="text-blue-400 text-sm font-semibold mb-2">Rules:</p>
              <ul className="text-blue-300/80 text-xs space-y-1 list-disc pl-4">
                <li>Fullscreen and Camera are required and will activate automatically.</li>
                <li>Do not switch tabs or exit fullscreen during the test.</li>
              </ul>
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button onClick={() => {
              if (aiSessionStage === 'technical' && !resumeFile) {
                setError('Please upload your resume to continue.');
                return;
              }
              setError('');
              setSectionPhase('active');
              setSessionStarted(false);
            }} className="w-full py-3.5 rounded-xl font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
              I'm Ready - Start Section
            </button>
            <button onClick={resetAll} className="block mx-auto text-gray-500 text-xs hover:text-gray-400">Exit to Dashboard</button>
          </div>
        </div>
      );
    }

    // --- RESULT PHASE ---
    if (sectionPhase === 'result') {
      if (aiSessionStage === 'aptitude') {
        const aptData = aptResultRef.current || aptResult;
        const correct = aptData?.correct || 0;
        const total = aptData?.total || 0;
        const percent = total ? Math.round((correct/total)*100) : 0;
        return (
          <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #111827)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2))', border: '2px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>&#129504;</div>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Aptitude Section Complete</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Your aptitude score has been calculated and emailed to you.</p>
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>✉️</span>
                  <p style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600 }}>Check Your Inbox</p>
                  <p style={{ color: '#a5b4fc', fontSize: '0.875rem', textAlign: 'center' }}>
                    We've hidden the scores here to keep you focused. Your detailed section report has been sent to your registered email.
                  </p>
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Result emailed to {user.email || 'you'}
              </div>
              <button onClick={() => { setAiSessionStage('coding'); setSectionPhase('instructions'); setCodingProblems([]); }} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #6366f1, #ef4444)', border: 'none', cursor: 'pointer', fontSize: '1rem', marginBottom: '0.75rem' }}>
                Proceed to Coding Round
              </button>
              <button onClick={resetAll} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem' }}>Exit to Dashboard</button>
            </div>
          </div>
        );
      }
      if (aiSessionStage === 'coding') {
        const codData = aiCodingResultRef.current || aiCodingResult;
        const solved = codData?.solved || 0;
        const total = codData?.total || 0;
        return (
          <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #111827)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>&#128187;</div>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Coding Section Complete</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Your coding scores have been evaluated and emailed to you.</p>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>✉️</span>
                  <p style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600 }}>Check Your Inbox</p>
                  <p style={{ color: '#fcd34d', fontSize: '0.875rem', textAlign: 'center' }}>
                    We've hidden the scores here to keep you focused. Your detailed section report has been sent to your registered email.
                  </p>
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Result emailed to {user.email || 'you'}
              </div>
              <button onClick={() => { setAiSessionStage('technical'); setSectionPhase('instructions'); setSocket(null); }} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #6366f1, #ef4444)', border: 'none', cursor: 'pointer', fontSize: '1rem', marginBottom: '0.75rem' }}>
                Proceed to Technical Q&A
              </button>
              <button onClick={resetAll} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem' }}>Exit to Dashboard</button>
            </div>
          </div>
        );
      }
    }

    // --- ACTIVE PHASE ---
    const showLoadingState = !sessionStarted || (aiSessionStage === 'aptitude' && aptitudeQuestions.length === 0);

    if (showLoadingState) {
      return (
        <ProctoringGuard
          testTitle={'AI Interview - ' + aiSessionStage}
          onSessionStart={(info) => { setSessionStarted(true); setAiSessionStream(info?.stream || null); }}
          onDisqualified={handleAIDisqualified}
        >
          {sessionStarted && (
            <div className="min-h-screen bg-gray-950 flex flex-col">
              <AIProgress />
              {aiSessionStage === 'aptitude' && aptitudeQuestions.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="text-white text-sm animate-pulse"> Loading aptitude questions...</div>
                    {error && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 max-w-sm">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button onClick={() => startAptitude()} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline">Retry</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {aiSessionStage === 'technical' && resumeAnalyzing && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-1.5 mb-4">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <p className="text-white text-sm"> Analysing resume, preparing questions...</p>
                  </div>
                </div>
              )}
              {aiSessionStage === 'technical' && !resumeAnalyzing && !socket && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <button onClick={startAiTechInterview} className="w-full max-w-xs py-3.5 px-6 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                       Begin Voice Interview
                    </button>
                  </div>
                </div>
              )}
              {aiSessionStage === 'technical' && !resumeAnalyzing && socket && stage !== 'interview' && (
                <div className="flex-1 flex items-center justify-center text-white text-sm animate-pulse">
                   Connecting to interview room...
                </div>
              )}
            </div>
          )}
        </ProctoringGuard>
      );
    }
    
    // Session is active and content is ready - fall through to dedicated render blocks below.
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: APTITUDE TEST
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'aptitude' || (stage === 'ai_interview' && aiSessionStage === 'aptitude' && aptitudeQuestions.length > 0)) {
    const currentSection = aptSections[currentSectionIdx];
    if (!currentSection) return null;

    const currentQuestion = currentSection.questions[currentAptQuestionIdx];
    if (!currentQuestion) return null;

    // Calculate total progress
    let globalIndex = 0;
    for (let sIdx = 0; sIdx < currentSectionIdx; sIdx++) {
      globalIndex += aptSections[sIdx].questions.length;
    }
    globalIndex += currentAptQuestionIdx;

    const answeredCount = Object.keys(aptAnswers).length;
    const progressPercent = Math.round((globalIndex / aptitudeQuestions.length) * 100);

    const isFirstQuestion = currentSectionIdx === 0 && currentAptQuestionIdx === 0;
    const isLastQuestion = currentSectionIdx === aptSections.length - 1 && currentAptQuestionIdx === currentSection.questions.length - 1;

    // Timer color styling (red if less than 5 minutes remain)
    const timerColor = aptTotalTimeLeft <= 300 ? '#ef4444' : aptTotalTimeLeft <= 900 ? '#f59e0b' : '#10b981';

    const totalDuration = TOTAL_TEST_DURATION_MS / 1000; // 75 min total
    const timePercentage = Math.min(100, Math.round((aptTotalTimeLeft / totalDuration) * 100));

    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      const hrsStr = hrs > 0 ? `${hrs}:` : '';
      const minsStr = mins < 10 ? `0${mins}` : mins;
      const secsStr = secs < 10 ? `0${secs}` : secs;
      return `${hrsStr}${minsStr}:${secsStr}`;
    };

    return (
      <>
        {stage === 'ai_interview' && sessionStarted && (
          <ProctoringGuard
            testTitle="AI Interview"
            onSessionStart={() => {}}
            onDisqualified={handleAIDisqualified}
            renderAsOverlay={true}
            existingStream={aiSessionStream}
          />
        )}
        {/* ── Section header for AI Interview mode ── */}
        {stage === 'ai_interview' && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-400 text-sm font-semibold"> Section 1 of 3 — Aptitude</span>
            </div>
            {sessionViolations > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                 {sessionViolations}/3 violations
              </span>
            )}
          </div>
        )}
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-start">
        <div className="w-full flex flex-row gap-0 items-start">
          
          {/* LEFT SIDEBAR: Question Navigation Console */}
          <div className="hidden lg:flex flex-col w-40 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto" style={{ minHeight: '100vh', maxHeight: '100vh', position: 'sticky', top: 0 }}>

            {/* Section label + numbered circles */}
            {(() => {
              const sec = aptSections[currentSectionIdx];
              if (!sec) return null;
              return (
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{sec.section}</span>
                  </div>

                  {/* 2-column grid of numbered boxes — medium fixed size */}
                  <div className="grid grid-cols-2 gap-2 px-3 pb-4 justify-items-center">
                    {sec.questions.map((q, qIdx) => {
                      let gIdx = 0;
                      for (let pIdx = 0; pIdx < currentSectionIdx; pIdx++) {
                        gIdx += aptSections[pIdx].questions.length;
                      }
                      gIdx += qIdx;

                      const isSelected = currentAptQuestionIdx === qIdx;
                      const isAnswered = aptAnswers[q.id] !== undefined;

                      let btnClass = '';
                      if (isSelected) {
                        btnClass = 'bg-indigo-600 border-2 border-indigo-400 text-white shadow-md shadow-indigo-500/20';
                      } else if (isAnswered) {
                        btnClass = 'bg-emerald-500 border-2 border-emerald-600 text-white shadow-sm';
                      } else {
                        btnClass = 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentAptQuestionIdx(qIdx)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:opacity-90 ${btnClass}`}
                        >
                          {gIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-auto border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold bg-indigo-600 text-white">1</span>
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold bg-emerald-500 text-white">2</span>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-500">3</span>
                      <span>Not Visited</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RIGHT MAIN COLUMN: Active Question panel */}
          <div className="flex-1 w-full space-y-6 p-4 md:p-8 overflow-y-auto" style={{ minHeight: '100vh' }}>
            
            {/* Header Dashboard Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">

              {/* LEFT: Section info + section timer */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: '#6366f120', border: '1px solid #6366f130' }}>
                  {currentSection.icon || ''}
                </div>
                <div>
                  <h2 className="text-gray-900 dark:text-white font-bold text-lg">{currentSection.section} Section</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    Question {currentAptQuestionIdx + 1} of {currentSection.questions.length} in this section
                  </p>
                </div>
                {/* Per-section timer pill */}
                <div className="ml-2 px-3 py-1.5 rounded-xl border flex flex-col items-center"
                  style={{
                    background: aptSectionTimeLeft <= 60 ? '#ef444415' : '#6366f110',
                    borderColor: aptSectionTimeLeft <= 60 ? '#ef444440' : '#6366f130'
                  }}>
                  <span className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: aptSectionTimeLeft <= 60 ? '#ef4444' : '#6366f1' }}>
                    Section Time
                  </span>
                  <span className="text-sm font-bold font-mono"
                    style={{ color: aptSectionTimeLeft <= 60 ? '#ef4444' : aptSectionTimeLeft <= 300 ? '#f59e0b' : '#6366f1' }}>
                    {formatTime(aptSectionTimeLeft)}
                  </span>
                </div>
              </div>

              {/* RIGHT: Total timer + Submit button */}
              <div className="flex items-center gap-3 self-end md:self-auto">
                {/* Total exam time */}
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Time</span>
                  <span className="text-base font-bold font-mono" style={{ color: timerColor }}>
                    {formatTime(aptTotalTimeLeft)}
                  </span>
                </div>
                {/* Thin ring for total */}
                <div className="relative w-10 h-10 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={aptTotalTimeLeft <= 300 ? '#ef444420' : '#1f293740'} strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={timerColor}
                      strokeWidth="3"
                      strokeDasharray={`${timePercentage} 100`}
                      style={{ transition: 'stroke-dasharray 1s linear' }}
                    />
                  </svg>
                </div>
                {/* Submit Section button */}
                <button
                  id="btn-submit-section"
                  onClick={() => { setShowSectionConfirm(true); setSectionConfirmInput(''); }}
                  disabled={aptSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
                  style={{
                    background: currentSectionIdx >= aptSections.length - 1
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: currentSectionIdx >= aptSections.length - 1
                      ? '0 4px 14px rgba(16,185,129,0.3)'
                      : '0 4px 14px rgba(245,158,11,0.3)'
                  }}
                >
                  {aptSubmitting
                    ? 'Submitting...'
                    : currentSectionIdx >= aptSections.length - 1
                      ? 'Submit Exam'
                      : 'Submit Section →'}
                </button>
              </div>
            </div>


            {/* Overall progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Overall Progress</span>
                <span>{answeredCount} / {aptitudeQuestions.length} answered ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-full h-2">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #6366f1, #ef4444)' }} />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Question {globalIndex + 1}
            </span>
                {aptAnswers[currentQuestion.id] !== undefined && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <span>✓ Answer Saved</span>
                  </span>
                )}
              </div>

              <p className="text-gray-900 dark:text-white text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, oi) => {
                  const isSelected = aptAnswers[currentQuestion.id] === oi;
                  return (
                    <button key={oi} id={`q-${currentQuestion.id}-opt-${oi}`}
                      onClick={() => setAptAnswers(prev => ({ ...prev, [currentQuestion.id]: oi }))}
                      className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                          : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                      <span className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                            : 'border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {isSelected && <span className="text-indigo-500 dark:text-indigo-400 text-xs font-bold">●</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button onClick={handlePrevAptQuestion} disabled={isFirstQuestion}
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                ← Previous
              </button>
              
              {isLastQuestion ? (
                <button id="apt-submit" onClick={submitAptitude} disabled={aptSubmitting}
                  className="px-8 py-3 rounded-xl font-bold text-white text-sm transition-all shadow-lg hover:shadow-emerald-500/20"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {aptSubmitting ? 'Submitting Test...' : ' Submit Exam'}
                </button>
              ) : (
                <button id="apt-next" onClick={handleNextAptQuestion}
                  className="px-8 py-3 rounded-xl font-bold text-white text-sm transition-all shadow-lg hover:shadow-indigo-500/20"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Next Question →
                </button>
              )}
            </div>

            <div className="text-center pt-2">
              <button onClick={resetAll} className="text-gray-600 text-xs hover:text-gray-400 transition-all font-medium">
                ← Exit and Back to Setup
              </button>
            </div>
          </div>
        </div>

        {/* ── Section Confirm Modal ── */}
        {showSectionConfirm && (() => {
          const isLastSection = currentSectionIdx >= aptSections.length - 1;
          const currentSecName = aptSections[currentSectionIdx]?.section || '';
          const nextSecName = !isLastSection ? aptSections[currentSectionIdx + 1]?.section : null;
          const isMatch = sectionConfirmInput.trim() === currentSecName;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            >
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ background: isLastSection ? '#10b98120' : '#f59e0b20', border: `1px solid ${isLastSection ? '#10b98140' : '#f59e0b40'}`, color: isLastSection ? '#10b981' : '#f59e0b' }}>
                      {isLastSection ? '#' : '>'}
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-bold text-base">
                        {isLastSection ? 'Submit Exam' : 'Submit Section & Continue'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        {isLastSection ? 'This will end your exam and submit all answers.' : `Next: ${nextSecName} section`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type <strong className="text-gray-900 dark:text-white font-bold">{currentSecName}</strong> to confirm:
                  </p>
                  <input
                    id="section-confirm-input"
                    type="text"
                    value={sectionConfirmInput}
                    onChange={e => setSectionConfirmInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && isMatch) { setShowSectionConfirm(false); setSectionConfirmInput(''); handleSubmitSection(); } }}
                    placeholder={`Type "${currentSecName}" here`}
                    autoFocus
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 ${
                      sectionConfirmInput.length === 0 ? 'border-gray-300 dark:border-gray-700'
                        : isMatch ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'border-red-400 ring-1 ring-red-400/30'
                    }`}
                  />
                  {sectionConfirmInput.length > 0 && !isMatch && (
                    <p className="text-xs text-red-500">Section name does not match. Please try again.</p>
                  )}
                  {isMatch && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Confirmed! Click the button below to proceed.</p>
                  )}
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => { setShowSectionConfirm(false); setSectionConfirmInput(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-section-submit"
                    disabled={!isMatch || aptSubmitting}
                    onClick={() => { setShowSectionConfirm(false); setSectionConfirmInput(''); handleSubmitSection(); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: isLastSection ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    {aptSubmitting ? 'Submitting...' : isLastSection ? 'Submit Exam' : `Go to ${nextSecName}`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: CODING ROUND
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'coding' || (stage === 'ai_interview' && aiSessionStage === 'coding' && codingProblems.length > 0)) {
    const prob = codingProblems[codingProblemIndex];
    if (!prob) {
      // Problems still loading
      return (
        <>
          {stage === 'ai_interview' && sessionStarted && (
            <ProctoringGuard testTitle="AI Interview" onSessionStart={() => {}} onDisqualified={handleAIDisqualified} renderAsOverlay={true} existingStream={aiSessionStream} />
          )}
          <div className="min-h-screen bg-gray-950 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-sm font-semibold"> Section 2 of 3 — Coding</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-white text-sm animate-pulse"> Loading coding problems...</div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        {stage === 'ai_interview' && sessionStarted && (
          <ProctoringGuard
            testTitle="AI Interview"
            onSessionStart={() => {}}
            onDisqualified={handleAIDisqualified}
            renderAsOverlay={true}
            existingStream={aiSessionStream}
          />
        )}
        {/* ── Section header for AI Interview mode ── */}
        {stage === 'ai_interview' && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400 text-sm font-semibold"> Section 2 of 3 — Coding</span>
            </div>
            {sessionViolations > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                 {sessionViolations}/3 violations
              </span>
            )}
          </div>
        )}
        <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold"> Coding Round</h2>
            <span className="text-gray-400 text-sm">Problem {codingProblemIndex + 1} of {codingProblems.length}</span>
            <span className="text-xs px-2.5 py-1 rounded-lg font-bold font-mono animate-pulse"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                backgroundColor: codingTimeLeft <= 180 ? '#ef444420' : 'rgba(245, 158, 11, 0.1)',
                color: codingTimeLeft <= 180 ? '#ef4444' : '#fbbf24',
                border: codingTimeLeft <= 180 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
              }}>
               {Math.floor(codingTimeLeft / 60)}:{codingTimeLeft % 60 < 10 ? `0${codingTimeLeft % 60}` : codingTimeLeft % 60}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {codingResults.length > 0 && (
              <span className="text-green-400 text-xs font-medium">{codingResults.length} solved</span>
            )}
            <button onClick={resetAll} className="text-gray-400 hover:text-gray-200 text-sm transition-all">Exit</button>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
          {/* Left: Problem statement */}
          <div className="w-2/5 border-r-2 border-indigo-500/30 overflow-y-auto p-5 space-y-4 bg-gray-900" style={{ borderRight: '2px solid rgba(99,102,241,0.4)' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-lg">{prob.title}</h3>
              <DiffBadge d={prob.difficulty} />
            </div>

            <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">{prob.description}</pre>

            {/* Problem progress */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-gray-400 text-xs mb-2">Progress</p>
              <div className="flex gap-2">
                {codingProblems.map((_, i) => {
                  const isSolved = codingResults.find(r => r.problemId === i);
                  const isCurrent = i === codingProblemIndex;
                  return (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: isSolved ? '#22c55e' : isCurrent ? '#6366f1' : (isDark ? '#374151' : '#e5e7eb'),
                        color: (isSolved || isCurrent) ? 'white' : (isDark ? '#9ca3af' : '#4b5563')
                      }}>{i + 1}</div>
                  );
                })}
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
                {codingEval.hints && <p className="text-blue-400 text-xs font-medium"> {codingEval.hints}</p>}
                {codingEval.timeComplexity && <p className="text-gray-500 text-xs"> Time: {codingEval.timeComplexity}</p>}

                <div className="flex gap-2 pt-1">
                  {codingProblemIndex < codingProblems.length - 1 ? (
                    <button id="btn-next-problem" onClick={nextCodingProblem}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      Next Problem →
                    </button>
                  ) : (
                    <button id="btn-finish-coding" onClick={() => { if (stage === 'ai_interview') { onCodingComplete(codingResults); } else { setStage('result'); setResult({ type: 'coding', results: codingResults }); } }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                       Finish Round
                    </button>
                  )}
                  <button onClick={() => setCodingEval(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-450 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Code editor + LeetCode drawer */}
          <div className="flex-grow flex flex-col relative overflow-hidden bg-white dark:bg-gray-950">
            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden relative transition-all duration-150">
              <CodeEditor language={codingLanguage} value={codingCode} onChange={setCodingCode} onLanguageChange={handleLanguageChange} />
            </div>

            {/* Collapsible Console Drawer */}
            {/* Collapsible Console Drawer */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-[#f9fafb] dark:bg-[#141414] flex flex-col transition-all duration-150" style={{ height: consoleOpen ? '300px' : 'auto' }}>
              {/* Drawer Header (Unified Action Bar) */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-gray-800 select-none">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-xs flex items-center gap-1 cursor-pointer" onClick={() => setConsoleOpen(!consoleOpen)}>
                    <span>Console</span>
                    <span className="text-[10px]">{consoleOpen ? '▼' : '▲'}</span>
                  </span>

                  {consoleOpen && (
                    <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-800 pl-4">
                      <button type="button" onClick={() => setConsoleTab('testcases')}
                        className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${consoleTab === 'testcases' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-300 dark:border-transparent' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        Testcase
                      </button>
                      <button type="button" onClick={() => setConsoleTab('result')}
                        className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${consoleTab === 'result' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-300 dark:border-transparent' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
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
                  {error && <p className="text-red-500 dark:text-red-400 text-xs truncate max-w-[200px]" title={error}>{error}</p>}
                  
                  <button type="button" onClick={runCode} disabled={codeRunning || codingSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-white dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#3d3d3d] text-gray-700 dark:text-gray-300 text-xs font-bold transition-all border border-gray-300 dark:border-gray-700 disabled:opacity-40">
                    Run Code
                  </button>

                  <button id="btn-submit-code" type="button" onClick={submitCode} disabled={codeRunning || codingSubmitting}
                    className="px-4 py-1.5 rounded-lg font-bold text-white text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    {codingSubmitting ? (
                      <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg> Submitting...</>
                    ) : ' Submit Code'}
                  </button>
                </div>
              </div>

              {/* Drawer Body (Content) */}
              {consoleOpen && (
                <div className="flex-1 p-4 overflow-y-auto min-h-0 text-sm text-gray-700 dark:text-gray-300 font-sans">
                  {consoleTab === 'testcases' ? (
                    <div className="space-y-4">
                      {/* Case Selectors */}
                      <div className="flex gap-2">
                        {prob.testCases?.map((_, idx) => (
                          <button key={idx} type="button" onClick={() => setActiveTestcaseIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTestcaseIdx === idx ? 'bg-white dark:bg-gray-800 text-indigo-650 dark:text-indigo-400 border border-indigo-450/30 dark:border-indigo-500/30' : 'bg-gray-200 dark:bg-[#242424] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      {prob.testCases?.[activeTestcaseIdx] && (
                        <div className="space-y-3 bg-white dark:bg-[#1c1c1c] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Input</div>
                            <pre className="bg-gray-50 dark:bg-[#111] p-2 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap border border-gray-150 dark:border-transparent">{prob.testCases[activeTestcaseIdx].input}</pre>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Expected Output</div>
                            <pre className="bg-gray-50 dark:bg-[#111] p-2 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap border border-gray-150 dark:border-transparent">{prob.testCases[activeTestcaseIdx].expected}</pre>
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
    </>
  );
}

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: RESULT (Aptitude or Coding)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'result' && (result?.type === 'aptitude' || aptResult)) {
    const feedbackQuestions = [
      "How was your overall experience with the assessment?",
      "How would you rate the difficulty level of the questions?",
      "Was the allocated time sufficient for the sections?",
      "How would you rate the interface and usability?",
      "How relevant were the questions to the specified skills?"
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 flex items-center justify-center transition-colors duration-300">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          {!feedbackSubmitted ? (
            <div className="relative z-10 space-y-8">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <span className="text-4xl"></span>
                </div>
                <h2 className="text-gray-900 dark:text-white text-3xl font-extrabold tracking-tight">Your assessment was successfully submitted!</h2>
                <p className="text-emerald-500 dark:text-emerald-400 font-medium text-sm px-4 py-2 bg-emerald-500/10 inline-block rounded-full border border-emerald-500/20">
                  Result will be published on your registered email.
                </p>
                <p className="text-gray-650 dark:text-gray-400 text-sm mt-2">
                  Please take a moment to provide your feedback before leaving.
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-4">Feedback</h3>
                {feedbackQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">{qIdx + 1}. {q}</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => {
                            const newRatings = [...feedbackRatings];
                            newRatings[qIdx] = star;
                            setFeedbackRatings(newRatings);
                          }}
                          className={`text-2xl transition-all hover:scale-110 ${
                            feedbackRatings[qIdx] >= star ? 'text-yellow-400' : 'text-gray-350 dark:text-gray-700'
                          }`}
                        >
                          
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setFeedbackSubmitted(true)}
                  disabled={feedbackRatings.includes(0)}
                  className="w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center space-y-6 py-12">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                <span className="text-5xl">️</span>
              </div>
              <h2 className="text-gray-900 dark:text-white text-3xl font-extrabold tracking-tight">Thank You!</h2>
              <p className="text-gray-650 dark:text-gray-400 text-base max-w-md mx-auto">
                Your feedback has been recorded. You can now safely close this window or return to the dashboard.
              </p>
              <div className="pt-8">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-850 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'result' && result?.type === 'coding') {
    const results = result.results || [];
    const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) : 0;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">{avg >= 70 ? '' : avg >= 40 ? '' : ''}</div>
            <h2 className="text-gray-900 dark:text-white text-2xl font-bold">Coding Round Complete!</h2>
            <div className="flex justify-center"><ScoreRing score={avg} size={140} /></div>
            <p className="text-gray-600 dark:text-gray-400">{results.length} problems attempted · Average score {avg}/100</p>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white font-medium">{r.title}</span>
                  <span className="font-bold text-lg" style={{ color: r.score >= 7 ? '#22c55e' : r.score >= 4 ? '#f59e0b' : '#ef4444' }}>{r.score}/10</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.verdict === 'Correct' ? '#22c55e20' : '#f59e0b20', color: r.verdict === 'Correct' ? '#4ade80' : '#fbbf24' }}>{r.verdict}</span>
                {r.feedback && <p className="text-gray-655 dark:text-gray-400 text-xs mt-2">{r.feedback}</p>}
              </div>
            ))}
          </div>
          <button id="btn-coding-retry" onClick={resetAll}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}>
             Try Again
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: WAITING ROOM
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'waiting') return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-2xl w-full mx-auto space-y-4">

        {/* Manual Interview candidate waiting — wrap with ProctoringGuard */}
        {role === 'student' && mainMode !== 'ai' ? (
          <ProctoringGuard
            testTitle="Manual Interview"
            onSessionStart={() => setSessionStarted(true)}
            onDisqualified={handleManualDisqualified}
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center space-y-6 shadow-xl">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl animate-bounce" style={{ background: 'linear-gradient(135deg, #6366f120, #ef444420)' }}></div>
              <div>
                <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-2">You've Joined!</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Waiting for the interviewer to start...</p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </ProctoringGuard>
        ) : role === 'student' ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center space-y-6 shadow-xl">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl animate-bounce" style={{ background: 'linear-gradient(135deg, #6366f120, #ef444420)' }}></div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-2">AI is Preparing Your Interview</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Generating personalized questions from your resume...</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-gray-500 dark:text-gray-600 text-xs">This will only take a moment...</p>
          </div>
        ) : (
          /* HR/Admin room: show Room ID sharing panel */
          <>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center space-y-5 relative shadow-xl">

              {/* ── Close / Exit button ── */}
              <button id="btn-close-room" onClick={resetAll}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-lg">
                ✕
              </button>

              {isRoomCreator ? (
                /* Admin who created the room */
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#ef444420' }}>️</div>
                  <h2 className="text-gray-900 dark:text-white font-bold text-xl">Interview Room Ready</h2>
                  <p className="text-gray-650 dark:text-gray-400 text-sm">Share the Room ID with the candidate to let them join</p>

                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Room ID</p>
                    <p className="text-gray-900 dark:text-white text-2xl font-bold font-mono tracking-wider">{roomId}</p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button id="btn-copy-room" onClick={handleCopyRoomId}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">
                      {copyText}
                    </button>
                    <a href={`https://wa.me/?text=Join my SmartHire AI interview. Room ID: ${roomId} — Go to the Interview page and click "Join Room"`} target="_blank" rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all">
                      WhatsApp 
                    </a>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-3 text-left text-xs text-gray-400 space-y-1">
                    <p className="text-gray-300 font-semibold mb-1"> How the candidate joins:</p>
                    <p>1. Open the <strong className="text-white">Interview</strong> page</p>
                    <p>2. Select <strong className="text-white">HR Live Interview</strong></p>
                    <p>3. Enter their name, choose <strong className="text-white">Student / Candidate</strong></p>
                    <p>4. Paste the Room ID → click <strong className="text-white">Join</strong></p>
                  </div>

                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-yellow-400 text-sm">Waiting for participants... ({participants.length} joined)</span>
                  </div>

                  <button id="btn-start-live-interview" onClick={startInterview}
                    className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                     Start Interview Session
                  </button>
                </>
              ) : (
                /* Candidate who joined via Room ID */
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl animate-pulse" style={{ background: '#22c55e20' }}></div>
                  <h2 className="text-white font-bold text-xl">You've Joined!</h2>
                  <p className="text-gray-400 text-sm">You are connected to room <span className="text-white font-mono font-bold">{roomId}</span></p>
                  <div className="flex justify-center gap-1.5 pt-2">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm">Waiting for the interviewer to start the session...</p>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''} in room</span>
                  </div>
                </>
              )}
            </div>

            {/* Email invite — only for room creator */}
            {isRoomCreator && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-md">
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm"> Email Invitation</h3>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Candidate name (optional)"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-350 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                <div className="flex gap-2">
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="candidate@email.com"
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-355 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                  <button id="btn-send-invite" onClick={handleSendEmailInvite} disabled={emailSending || !inviteEmail}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                    style={{ background: '#ef4444' }}>
                    {emailSending ? '...' : emailSent ? '' : 'Send'}
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
  if (stage === 'interview' || (stage === 'ai_interview' && aiSessionStage === 'technical')) {
    const isAdmin = role === 'admin';

    // ── AI Self-Practice Interview (no video, no chat, single user) ──
    if (mainMode === 'ai') {
      return (
        <>
          {/* Proctoring overlay continues during Tech Q&A inside AI Interview flow */}
          {stage === 'ai_interview' && sessionStarted && (
            <ProctoringGuard
              testTitle="AI Interview"
              onSessionStart={() => {}}
              onDisqualified={handleAIDisqualified}
              renderAsOverlay={true}
              existingStream={aiSessionStream}
            />
          )}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 dark:text-green-400 text-sm font-medium"> AI Interview</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: '#6366f120', color: '#818cf8', border: '1px solid #6366f130' }}>
                Q {questionNumber} / {totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={resetAll} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-all">✕ Exit</button>
            </div>
          </div>

          {/* Main layout wrapper */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar for Question Progress */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-5 overflow-y-auto hidden md:block">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-4 uppercase tracking-wider">Interview Progress</h3>
              <div className="space-y-2">
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const isPast = i < questionNumber - 1;
                  const isCurrent = i === questionNumber - 1;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isCurrent ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-sm' : 'border border-transparent'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${isPast ? 'bg-green-500/20 text-green-450' : isCurrent ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-450'}`}>
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${isPast ? 'text-gray-500 dark:text-gray-400' : isCurrent ? 'text-indigo-650 dark:text-indigo-400 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
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
                      
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-900 border border-indigo-500/30 rounded-2xl rounded-tl-none p-5 space-y-2 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                          Question {questionNumber}
                        </span>
                        {currentQuestion.topic && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                            {currentQuestion.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">{currentQuestion.question}</p>
                    </div>
                  </div>

                  {/* Answer box */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 mt-1"
                      style={{ background: isDark ? '#1f2937' : '#f3f4f6', border: `1px solid ${isDark ? '#374151' : '#d1d5db'}` }}>
                      
                    </div>
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={6}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <div className="flex gap-3">
                        <button id="btn-voice-toggle" onClick={toggleVoice}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
                          style={{ borderColor: isListening ? '#ef4444' : (isDark ? '#374151' : '#d1d5db'), background: isListening ? '#ef444420' : (isDark ? '#1f2937' : '#f3f4f6'), color: isListening ? '#f87171' : (isDark ? '#9ca3af' : '#4b5563') }}>
                          {isListening ? ' Stop' : '️ Voice'}
                        </button>
                        <button id="btn-submit-answer" onClick={handleSubmitAnswer} disabled={!answer.trim()}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                          style={{ background: answer.trim() ? 'linear-gradient(135deg, #6366f1, #ef4444)' : (isDark ? '#374151' : '#e5e7eb'), color: answer.trim() ? '#ffffff' : (isDark ? '#9ca3af' : '#9ca3af') }}>
                          Submit Answer →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show a subtle "loading next question" indicator after submit */}
                  {feedback && (
                    <div className="ml-16 flex items-center gap-2 text-gray-650 dark:text-gray-500 text-xs">
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
                    style={{ background: 'linear-gradient(135deg, #6366f120, #ef444420)' }}></div>
                  <p className="text-gray-650 dark:text-gray-400 text-sm">AI is preparing your next question...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      );
    }

    // ── HR Live Interview (video + chat + admin panel) ──
    return (
      <>
        {/* Proctoring overlay for student side of HR interview (Phase 4) */}
        {role === 'student' && sessionStarted && (
          <ProctoringGuard
            testTitle="Manual Interview"
            onSessionStart={() => {}}
            onDisqualified={handleManualDisqualified}
            renderAsOverlay={true}
          />
        )}
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
              <div className="w-2/3 p-3 border-r border-gray-800">
                <VideoCall socket={socket} roomId={roomId} userName={userName || user.name} isAiMode={false} />
                {!isAdmin && (
                  <div className="mt-3 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    <span className="text-indigo-400 text-xs">AI is passively monitoring this session for quality assurance</span>
                  </div>
                )}
              </div>

              {/* Question / Answer panel */}
              <div className="w-1/3 flex flex-col overflow-hidden">
                {isAdmin ? (
                  <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-4">
                    {candidateDisqualified && (
                      <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)' }}>
                        <p className="text-red-400 font-bold text-sm"> Candidate Disqualified</p>
                        <p className="text-red-300 text-xs mt-1">
                          Candidate was auto-disqualified after {candidateDisqualified.violations}/3 violations.
                          Reason: {candidateDisqualified.reason}
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-semibold text-sm"> Send Question</h3>
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
                        <h3 className="text-white font-semibold text-sm"> AI Monitor</h3>
                      </div>
                      {aiMonitorLog.length === 0 ? (
                        <p className="text-gray-600 text-xs text-center py-3">Waiting for student answers...</p>
                      ) : aiMonitorLog.map((log, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-2 text-xs text-gray-400">{log.message}</div>
                      ))}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-semibold text-sm"> Manual Evaluation</h3>
                      {Object.entries(evalScores).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <label className="text-gray-400 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                            <span className="text-yellow-400 text-xs font-bold">{val}/5 {''.repeat(val)}</span>
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
                            {isListening ? ' Stop' : '️ Voice'}
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
                        <div className="text-3xl mb-3"></div>
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
      </>
    );
  }


  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Q&A RESULT (from socket-based interview)
  // ══════════════════════════════════════════════════════════════════════════
  if (stage === 'result' && result?.type === 'qa') {
    return (
      <div className="min-h-screen bg-gray-950 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">{result.totalScore >= 70 ? '' : ''}</div>
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
          <button onClick={resetAll} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #ef4444)' }}> New Session</button>
        </div>
      </div>
    );
  }

  return null;
}
