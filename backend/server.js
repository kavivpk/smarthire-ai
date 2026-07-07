const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Interview = require('./models/Interview');
const HRInterviewReport = require('./models/HRInterviewReport');
require('./models/Notification'); // ensure Notification model is registered on startup
const { sendHRInterviewReport } = require('./utils/emailService');
const { notify } = require('./services/notificationService');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Dynamic CORS: allow any localhost port in dev, plus explicitly configured origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    // Allow any localhost origin (any port) for development
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    // Allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
  }
});

app.use(cors(corsOptions));
app.use(express.json());

// Uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const placementRecommendationRoutes = require('./routes/placementRecommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const bulkScreeningRoutes = require('./routes/bulkScreeningRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/placement-recommendation', placementRecommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/bulk-screening', bulkScreeningRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'SmartHire AI Backend running!' });
});

// ── Socket.io Logic ──
const rooms = {}; // Active interview rooms

const aiQuestions = [
  { q: 'Tell me about yourself and your technical background.', topic: 'HR' },
  { q: 'What is the difference between var, let, and const in JavaScript?', topic: 'JavaScript' },
  { q: 'Explain the concept of closures in JavaScript.', topic: 'JavaScript' },
  { q: 'What is REST API? How does it work?', topic: 'Backend' },
  { q: 'What is the Virtual DOM in React?', topic: 'React' },
  { q: 'Explain the difference between SQL and NoSQL databases.', topic: 'Database' },
  { q: 'What is Git and why do we use version control?', topic: 'Tools' },
  { q: 'Describe a challenging project you have worked on.', topic: 'HR' },
  { q: 'What are your strengths and weaknesses as a developer?', topic: 'HR' },
  { q: 'Where do you see yourself in 5 years?', topic: 'HR' },
];

function evaluateAnswer(question, answer, customKeywords) {
  const answerLower = answer.toLowerCase();
  let score = 0;
  let feedback = '';

  let keywords = customKeywords;
  if (!keywords || !keywords.length) {
    const keywordMap = {
      'var, let, and const': ['scope', 'hoisting', 'block', 'function', 'reassign', 'const'],
      'closures': ['function', 'scope', 'variable', 'inner', 'outer', 'access'],
      'rest api': ['http', 'endpoint', 'get', 'post', 'request', 'response', 'json'],
      'virtual dom': ['virtual', 'real', 'diff', 'update', 'render', 'performance'],
      'sql and nosql': ['schema', 'flexible', 'document', 'relational', 'scale'],
      'git': ['version', 'control', 'commit', 'branch', 'merge', 'track'],
    };

    // Find matching keywords
    keywords = ['good', 'understand', 'use', 'work', 'experience'];
    for (const [key, kws] of Object.entries(keywordMap)) {
      if (question.toLowerCase().includes(key)) {
        keywords = kws;
        break;
      }
    }
  }

  const matched = keywords.filter(kw => answerLower.includes(kw.toLowerCase()));
  score = Math.min(10, Math.round((matched.length / keywords.length) * 10) + 3);

  if (answer.length < 20) {
    score = 2;
    feedback = 'Answer too short. Please elaborate more.';
  } else if (score >= 8) {
    feedback = 'Excellent answer! Very well explained.';
  } else if (score >= 5) {
    feedback = `Good attempt! Try to also mention: ${keywords.slice(0, 2).join(', ')}`;
  } else {
    feedback = `Needs improvement. Key concepts: ${keywords.slice(0, 3).join(', ')}`;
  }

  return { score, feedback };
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ── Create Room ──
  socket.on('create_room', ({ roomId, userName, userId, mode, customQuestions, role }) => {
    // Use customQuestions if provided (from resume-based AI), else default aiQuestions
    const questions = customQuestions && customQuestions.length > 0
      ? customQuestions
      : (mode === 'ai' ? [...aiQuestions] : []);

    rooms[roomId] = {
      id: roomId,
      mode, // 'ai' or 'admin'
      participants: [],
      questions,
      currentQuestion: 0,
      scores: [],
      status: 'waiting',
      chat: []
    };
    socket.join(roomId);
    
    const creatorRole = role || (mode === 'admin' ? 'admin' : 'student');
    rooms[roomId].participants.push({
      id: socket.id,
      name: userName,
      userId: userId || null,
      role: creatorRole
    });

    socket.emit('room_created', { roomId, mode });
    console.log(`Room created: ${roomId} with role ${creatorRole}`);

    if (mode === 'ai') {
      if (creatorRole === 'admin') {
        rooms[roomId].status = 'waiting';
      } else {
        rooms[roomId].status = 'active';
        setTimeout(() => {
          if (!rooms[roomId]) return;
          const firstQ = rooms[roomId].questions[0];
          socket.emit('new_question', {
            question: firstQ.q,
            topic: firstQ.topic,
            questionNumber: 1,
            totalQuestions: rooms[roomId].questions.length
          });
        }, 1500);
      }
    }
  });

  // ── Join Room ──
  socket.on('join_room', ({ roomId, userName, userId, role, customQuestions }) => {
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Room not found!' });
      return;
    }

    if (customQuestions && customQuestions.length > 0) {
      rooms[roomId].questions = customQuestions;
    }

    socket.join(roomId);
    rooms[roomId].participants.push({
      id: socket.id,
      name: userName,
      userId: userId || null,
      role: role || 'student'
    });

    // Notify all in room
    io.to(roomId).emit('user_joined', {
      userName,
      participants: rooms[roomId].participants,
      message: `${userName} joined the interview room`
    });

    // If AI mode — start interview
    if (rooms[roomId].mode === 'ai' && rooms[roomId].status === 'waiting') {
      rooms[roomId].status = 'active';
      setTimeout(() => {
        const firstQ = rooms[roomId].questions[0];
        io.to(roomId).emit('new_question', {
          question: firstQ.q,
          topic: firstQ.topic,
          questionNumber: 1,
          totalQuestions: rooms[roomId].questions.length
        });
      }, 1500);
    }

    socket.emit('room_joined', {
      roomId,
      mode: rooms[roomId].mode,
      participants: rooms[roomId].participants
    });
  });

  // ── Student submits answer ──
  socket.on('submit_answer', async ({ roomId, answer, questionIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    const question = room.questions[questionIndex];
    if (!question) return;

    // Evaluate answer — use question.keywords if available (from resume-based questions)
    const { score, feedback } = evaluateAnswer(question.q, answer, question.keywords);

    room.scores.push({
      question: question.q,
      topic: question.topic,
      answer,
      score,
      feedback
    });

    // Send feedback to student
    io.to(roomId).emit('answer_feedback', {
      score,
      feedback,
      questionIndex,
      question: question.q
    });

    // Next question or finish
    const nextIndex = questionIndex + 1;
    if (nextIndex < room.questions.length && room.mode === 'ai') {
      setTimeout(() => {
        room.currentQuestion = nextIndex;
        io.to(roomId).emit('new_question', {
          question: room.questions[nextIndex].q,
          topic: room.questions[nextIndex].topic,
          questionNumber: nextIndex + 1,
          totalQuestions: room.questions.length
        });
      }, 2000);
    } else if (nextIndex >= room.questions.length) {
      // Interview complete
      const totalScore = Math.round(
        room.scores.reduce((sum, s) => sum + s.score, 0) / room.scores.length
      );

      io.to(roomId).emit('interview_complete', {
        totalScore,
        results: room.scores,
        message: 'Interview completed!'
      });

      // Save to database
      const student = room.participants.find(p => p.role === 'student');
      const studentUserId = student ? student.userId : null;

      if (studentUserId) {
        try {
          await Interview.create({
            userId: studentUserId,
            topic: room.mode === 'ai' ? 'AI Live' : 'Admin Live',
            questions: room.scores.map(s => ({
              question: s.question,
              userAnswer: s.answer,
              score: s.score,
              feedback: s.feedback
            })),
            totalScore,
            totalQuestions: room.questions.length,
            completedAt: new Date()
          });
          console.log(`Saved completed live interview to DB for user: ${studentUserId}`);
        } catch (err) {
          console.error('Failed to save completed live interview:', err);
        }

        // Save HR Interview Report (fire-and-forget, never breaks the interview flow)
        HRInterviewReport.create({
          userId: studentUserId,
          interviewId: roomId,
          interviewType: 'HR',
          questions: room.scores.map(s => s.question),
          answers: room.scores.map(s => s.answer),
          aiFeedback: room.scores.map(s => s.feedback).filter(Boolean),
          strengths: [],
          weaknesses: [],
          communicationScore: totalScore,
          confidenceScore: totalScore,
          professionalismScore: totalScore,
          overallScore: totalScore,
          recommendation: totalScore >= 7
            ? 'Strong candidate. Recommended for next round.'
            : totalScore >= 4
              ? 'Average performance. Further assessment recommended.'
              : 'Needs improvement before proceeding.',
          duration: 0,
          createdByAI: true
        }).catch(err => console.error('Failed to save HRInterviewReport:', err));

        // Notification — email + store history
        notify(studentUserId, {
          type: 'hr_interview',
          title: 'HR Interview Completed',
          message: `Your live HR interview is complete. Overall score: ${totalScore}/10.`,
          emailFn: async () => {
            const User = require('./models/User');
            const user = await User.findById(studentUserId).select('email name');
            if (user && user.email) {
              await sendHRInterviewReport(user.email, user.name, {
                overallScore: totalScore,
                communicationScore: totalScore,
                confidenceScore: totalScore,
                professionalismScore: totalScore,
                recommendation: totalScore >= 7
                  ? 'Strong candidate. Recommended for next round.'
                  : totalScore >= 4
                    ? 'Average performance. Further assessment recommended.'
                    : 'Needs improvement before proceeding.'
              });
            }
          }
        });
      }

      room.status = 'completed';
    }
  });

  // ── Admin sends question (Admin mode) ──
  socket.on('admin_send_question', ({ roomId, question, topic }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.questions.push({ q: question, topic });
    room.currentQuestion = room.questions.length - 1;

    io.to(roomId).emit('new_question', {
      question,
      topic,
      questionNumber: room.questions.length,
      totalQuestions: room.questions.length,
      fromAdmin: true
    });
  });

  // ── Chat message ──
  socket.on('send_message', ({ roomId, message, userName, role }) => {
    const room = rooms[roomId];
    if (!room) return;

    const chatMsg = {
      id: Date.now(),
      userName,
      role,
      message,
      time: new Date().toLocaleTimeString()
    };

    room.chat.push(chatMsg);
    io.to(roomId).emit('new_message', chatMsg);
  });

  // ── Start Interview ──
  socket.on('start_interview', ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].status = 'active';
    }
    io.to(roomId).emit('interview_started');
  });

  // ── End Interview ──
  socket.on('end_interview', async ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const totalScore = room.scores.length > 0
      ? Math.round(room.scores.reduce((sum, s) => sum + s.score, 0) / room.scores.length)
      : 0;

    io.to(roomId).emit('interview_complete', {
      totalScore,
      results: room.scores,
      message: 'Interview ended by admin'
    });

    // Save to database if scores exist
    if (room.scores.length > 0) {
      const student = room.participants.find(p => p.role === 'student');
      const studentUserId = student ? student.userId : null;

      if (studentUserId) {
        try {
          await Interview.create({
            userId: studentUserId,
            topic: room.mode === 'ai' ? 'AI Live' : 'Admin Live',
            questions: room.scores.map(s => ({
              question: s.question,
              userAnswer: s.answer,
              score: s.score,
              feedback: s.feedback
            })),
            totalScore,
            totalQuestions: room.scores.length,
            completedAt: new Date()
          });
          console.log(`Saved ended live interview to DB for user: ${studentUserId}`);
        } catch (err) {
          console.error('Failed to save ended live interview:', err);
        }

        // Save HR Interview Report (fire-and-forget, never breaks the interview flow)
        HRInterviewReport.create({
          userId: studentUserId,
          interviewId: roomId,
          interviewType: 'HR',
          questions: room.scores.map(s => s.question),
          answers: room.scores.map(s => s.answer),
          aiFeedback: room.scores.map(s => s.feedback).filter(Boolean),
          strengths: [],
          weaknesses: [],
          communicationScore: totalScore,
          confidenceScore: totalScore,
          professionalismScore: totalScore,
          overallScore: totalScore,
          recommendation: totalScore >= 7
            ? 'Strong candidate. Recommended for next round.'
            : totalScore >= 4
              ? 'Average performance. Further assessment recommended.'
              : 'Needs improvement before proceeding.',
          duration: 0,
          createdByAI: true
        }).catch(err => console.error('Failed to save HRInterviewReport (end_interview):', err));

        // Notification — email + store history
        notify(studentUserId, {
          type: 'hr_interview',
          title: 'HR Interview Ended',
          message: `Your live HR interview has ended. Overall score: ${totalScore}/10.`,
          emailFn: async () => {
            const User = require('./models/User');
            const user = await User.findById(studentUserId).select('email name');
            if (user && user.email) {
              await sendHRInterviewReport(user.email, user.name, {
                overallScore: totalScore,
                communicationScore: totalScore,
                confidenceScore: totalScore,
                professionalismScore: totalScore,
                recommendation: totalScore >= 7
                  ? 'Strong candidate. Recommended for next round.'
                  : totalScore >= 4
                    ? 'Average performance. Further assessment recommended.'
                    : 'Needs improvement before proceeding.'
              });
            }
          }
        });
      }
    }

    room.status = 'completed';
  });
  // ── Candidate Disqualification Relay ──
  // Broadcast to all other participants in the room so the interviewer sees it
  socket.on('candidate_disqualified', (data) => {
    if (data && data.roomId) {
      socket.to(data.roomId).emit('candidate_disqualified', data);
    }
  });

// ── WebRTC Signaling ──
  socket.on('webrtc_offer', ({ roomId, offer, to }) => {
    socket.to(to).emit('webrtc_offer', {
      offer,
      from: socket.id
    });
  });

  socket.on('webrtc_answer', ({ roomId, answer, to }) => {
    socket.to(to).emit('webrtc_answer', {
      answer,
      from: socket.id
    });
  });

  socket.on('webrtc_ice_candidate', ({ roomId, candidate, to }) => {
    socket.to(to).emit('webrtc_ice_candidate', {
      candidate,
      from: socket.id
    });
  });

  socket.on('webrtc_ready', ({ roomId }) => {
    socket.to(roomId).emit('webrtc_peer_ready', {
      from: socket.id
    });
  });
  
  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove from rooms
    Object.keys(rooms).forEach(roomId => {
      if (rooms[roomId]) {
        rooms[roomId].participants = rooms[roomId].participants.filter(
          p => p.id !== socket.id
        );
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
