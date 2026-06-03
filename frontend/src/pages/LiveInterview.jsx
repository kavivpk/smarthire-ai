import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';

const SOCKET_URL = 'http://localhost:5000';

export default function LiveInterview() {
  const [stage, setStage] = useState('setup'); // setup → waiting → interview → result
  const [mode, setMode] = useState('ai'); // 'ai' or 'admin'
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('student'); // student or admin
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [adminQuestion, setAdminQuestion] = useState('');
  const [adminTopic, setAdminTopic] = useState('General');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswer(prev => prev + ' ' + transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Connect socket
  const connectSocket = () => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('room_created', ({ roomId }) => {
      setRoomId(roomId);
      setStage('waiting');
    });

    newSocket.on('room_joined', ({ mode }) => {
      setStage('waiting');
    });

    newSocket.on('user_joined', ({ userName: name, participants: p, message }) => {
      setParticipants(p);
      setMessages(prev => [...prev, {
        id: Date.now(),
        userName: 'System',
        role: 'system',
        message,
        time: new Date().toLocaleTimeString()
      }]);
    });

    newSocket.on('new_question', ({ question, topic, questionNumber: qNum, totalQuestions: total }) => {
      setCurrentQuestion({ question, topic });
      setQuestionNumber(qNum);
      setTotalQuestions(total);
      setAnswer('');
      setFeedback(null);
      setStage('interview');
    });

    newSocket.on('answer_feedback', ({ score, feedback: fb, question }) => {
      setFeedback({ score, feedback: fb, question });
      setScores(prev => [...prev, { score, feedback: fb, question }]);
    });

    newSocket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('interview_complete', ({ totalScore, results, message }) => {
      setResult({ totalScore, results, message });
      setStage('result');
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    setSocket(newSocket);
    return newSocket;
  };

  // Create room
  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    const newSocket = connectSocket();
    const newRoomId = `ROOM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    setTimeout(() => {
      newSocket.emit('create_room', {
        roomId: newRoomId,
        userName: userName || user.name,
        mode
      });
    }, 500);
  };

  // Join room
  const handleJoinRoom = () => {
    if (!joinRoomId.trim() || !userName.trim()) {
      setError('Please enter room ID and your name');
      return;
    }
    const newSocket = connectSocket();
    setTimeout(() => {
      newSocket.emit('join_room', {
        roomId: joinRoomId,
        userName: userName || user.name,
        role
      });
      setRoomId(joinRoomId);
    }, 500);
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (!answer.trim() || !socket) return;
    socket.emit('submit_answer', {
      roomId,
      answer,
      questionIndex: questionNumber - 1
    });
  };

  // Send chat message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    socket.emit('send_message', {
      roomId,
      message: newMessage,
      userName: userName || user.name,
      role
    });
    setNewMessage('');
  };

  // Admin send question
  const handleAdminQuestion = () => {
    if (!adminQuestion.trim() || !socket) return;
    socket.emit('admin_send_question', {
      roomId,
      question: adminQuestion,
      topic: adminTopic
    });
    setAdminQuestion('');
  };

  // Voice toggle
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // End interview (admin)
  const handleEndInterview = () => {
    if (socket) {
      socket.emit('end_interview', { roomId });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 7) return '#22c55e';
    if (score >= 4) return '#f59e0b';
    return '#ef4444';
  };

  // ── Setup Stage ──
  if (stage === 'setup') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block"></span>
            Live Interview Room
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            AI auto-interview or Admin-led real-time interview
          </p>
        </div>

        {/* Your name */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 block">
            Your Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={user.name || 'Enter your name'}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Create Room */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
            Create New Room
          </h3>

          {/* Mode select */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setMode('ai')}
              className="p-4 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: mode === 'ai' ? '#ef4444' : '#374151',
                backgroundColor: mode === 'ai' ? '#ef444420' : 'transparent'
              }}
            >
              <div className="text-xl mb-1">🤖</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">AI Interview</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Auto questions + AI evaluation
              </div>
            </button>

            <button
              onClick={() => setMode('admin')}
              className="p-4 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: mode === 'admin' ? '#ef4444' : '#374151',
                backgroundColor: mode === 'admin' ? '#ef444420' : 'transparent'
              }}
            >
              <div className="text-xl mb-1">👤</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Admin Interview</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Real-time with interviewer
              </div>
            </button>
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full py-3 rounded-xl font-medium text-white transition-colors"
            style={{ backgroundColor: '#ef4444' }}
          >
            🚀 Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
            Join Existing Room
          </h3>
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            placeholder="Enter Room ID (e.g. ROOM-ABC123)"
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 mb-3"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setRole('student')}
              className="py-2 rounded-xl border text-sm transition-all"
              style={{
                borderColor: role === 'student' ? '#ef4444' : '#374151',
                color: role === 'student' ? '#ef4444' : '#9ca3af',
                backgroundColor: role === 'student' ? '#ef444410' : 'transparent'
              }}
            >
              Student
            </button>
            <button
              onClick={() => setRole('admin')}
              className="py-2 rounded-xl border text-sm transition-all"
              style={{
                borderColor: role === 'admin' ? '#ef4444' : '#374151',
                color: role === 'admin' ? '#ef4444' : '#9ca3af',
                backgroundColor: role === 'admin' ? '#ef444410' : 'transparent'
              }}
            >
              Interviewer
            </button>
          </div>

          <button
            onClick={handleJoinRoom}
            className="w-full py-3 rounded-xl font-medium transition-colors border"
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Join Room →
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-3 px-1">{error}</p>
        )}
      </div>
    );
  }

  // ── Waiting Stage ──
  if (stage === 'waiting') {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse block"></span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Room Ready!
          </h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Room ID</p>
            <p className="text-2xl font-bold text-red-500 tracking-widest">{roomId}</p>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {mode === 'ai'
              ? 'Waiting for participant to join...'
              : 'Share Room ID with the interviewer/student'}
          </p>

          {/* Participants */}
          {participants.length > 0 && (
            <div className="text-left">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                Participants ({participants.length})
              </p>
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-2">
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold">
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{p.name}</span>
                  <span className="text-xs text-gray-400 capitalize">({p.role})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Interview Stage ──
  if (stage === 'interview') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Main interview area */}
          <div className="lg:col-span-2 space-y-4">

            {/* Progress */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span>Live Interview — {roomId}</span>
                </div>
                <span>Q {questionNumber} / {totalQuestions || '?'}</span>
              </div>
              {totalQuestions > 0 && (
                <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
                  <div
                    className="h-1.5 rounded-full bg-red-500 transition-all"
                    style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                    Q{questionNumber}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {currentQuestion.topic}
                  </span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium text-base leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: `${getScoreColor(feedback.score)}10`,
                  borderColor: `${getScoreColor(feedback.score)}30`
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: getScoreColor(feedback.score) }}>
                    Score: {feedback.score}/10
                  </span>
                  <span className="text-xs text-gray-400">AI Feedback</span>
                </div>
                <p className="text-sm" style={{ color: getScoreColor(feedback.score) }}>
                  → {feedback.feedback}
                </p>
              </div>
            )}

            {/* Answer area — student only */}
            {role !== 'admin' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-500 dark:text-gray-400 text-sm">
                    Your Answer
                  </label>
                  <button
                    onClick={toggleVoice}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
                    style={{
                      borderColor: isListening ? '#ef4444' : '#374151',
                      color: isListening ? '#ef4444' : '#9ca3af',
                      backgroundColor: isListening ? '#ef444415' : 'transparent'
                    }}
                  >
                    {isListening ? (
                      <>
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Listening...
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                        Voice
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type or use voice to answer..."
                  rows={5}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 resize-none"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">{answer.length} chars</span>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim()}
                    className="px-6 py-2 rounded-xl font-medium text-white text-sm transition-colors disabled:opacity-40"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Submit Answer →
                  </button>
                </div>
              </div>
            )}

            {/* Admin controls */}
            {role === 'admin' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Ask Custom Question
                </h3>
                <select
                  value={adminTopic}
                  onChange={(e) => setAdminTopic(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
                >
                  {['General', 'JavaScript', 'React', 'Python', 'Backend', 'Database', 'HR', 'DSA'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <textarea
                  value={adminQuestion}
                  onChange={(e) => setAdminQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAdminQuestion}
                    disabled={!adminQuestion.trim()}
                    className="flex-1 py-2 rounded-xl font-medium text-white text-sm disabled:opacity-40"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Send Question
                  </button>
                  <button
                    onClick={handleEndInterview}
                    className="px-4 py-2 rounded-xl font-medium text-sm border border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    End
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat sidebar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col" style={{ height: '500px' }}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Live Chat
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{participants.length} participants</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`${msg.role === 'system' ? 'text-center' : ''}`}>
                  {msg.role === 'system' ? (
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                      {msg.message}
                    </span>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {msg.userName}
                        </span>
                        <span className="text-xs text-gray-400">({msg.role})</span>
                        <span className="text-xs text-gray-400 ml-auto">{msg.time}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {msg.message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="px-3 py-2 rounded-xl text-white text-xs"
                style={{ backgroundColor: '#ef4444' }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Result Stage ──
  if (stage === 'result') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">Live Interview Score</p>
          <div className="relative w-32 h-32 mx-auto mb-4">
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
          <p className="text-gray-500 dark:text-gray-400 text-sm">{result.message}</p>
        </div>

        {result.results?.map((r, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex justify-between mb-2">
              <p className="text-gray-900 dark:text-white font-medium text-sm flex-1 pr-4">
                {r.question}
              </p>
              <span className="font-bold text-sm flex-shrink-0"
                style={{ color: getScoreColor(r.score) }}>
                {r.score}/10
              </span>
            </div>
            <p className="text-gray-500 text-xs mb-2">
              Answer: {r.answer?.slice(0, 100)}...
            </p>
            <p className="text-xs p-2 rounded-lg"
              style={{ backgroundColor: `${getScoreColor(r.score)}10`, color: getScoreColor(r.score) }}>
              → {r.feedback}
            </p>
          </div>
        ))}

        <button
          onClick={() => {
            setStage('setup');
            setResult(null);
            setScores([]);
            setMessages([]);
            if (socket) socket.disconnect();
            setSocket(null);
          }}
          className="w-full py-3 rounded-xl font-medium text-white"
          style={{ backgroundColor: '#ef4444' }}
        >
          Start New Interview 🔄
        </button>
      </div>
    );
  }
}