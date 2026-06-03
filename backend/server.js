const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
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
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);

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

function evaluateAnswer(question, answer) {
  const answerLower = answer.toLowerCase();
  let score = 0;
  let feedback = '';

  const keywordMap = {
    'var, let, and const': ['scope', 'hoisting', 'block', 'function', 'reassign', 'const'],
    'closures': ['function', 'scope', 'variable', 'inner', 'outer', 'access'],
    'rest api': ['http', 'endpoint', 'get', 'post', 'request', 'response', 'json'],
    'virtual dom': ['virtual', 'real', 'diff', 'update', 'render', 'performance'],
    'sql and nosql': ['schema', 'flexible', 'document', 'relational', 'scale'],
    'git': ['version', 'control', 'commit', 'branch', 'merge', 'track'],
  };

  // Find matching keywords
  let keywords = ['good', 'understand', 'use', 'work', 'experience'];
  for (const [key, kws] of Object.entries(keywordMap)) {
    if (question.toLowerCase().includes(key)) {
      keywords = kws;
      break;
    }
  }

  const matched = keywords.filter(kw => answerLower.includes(kw));
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
  socket.on('create_room', ({ roomId, userName, mode }) => {
    rooms[roomId] = {
      id: roomId,
      mode, // 'ai' or 'admin'
      participants: [],
      questions: mode === 'ai' ? [...aiQuestions] : [],
      currentQuestion: 0,
      scores: [],
      status: 'waiting',
      chat: []
    };
    socket.join(roomId);
    rooms[roomId].participants.push({
      id: socket.id,
      name: userName,
      role: mode === 'admin' ? 'admin' : 'student'
    });

    socket.emit('room_created', { roomId, mode });
    console.log(`Room created: ${roomId}`);
  });

  // ── Join Room ──
  socket.on('join_room', ({ roomId, userName, role }) => {
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Room not found!' });
      return;
    }

    socket.join(roomId);
    rooms[roomId].participants.push({
      id: socket.id,
      name: userName,
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
  socket.on('submit_answer', ({ roomId, answer, questionIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    const question = room.questions[questionIndex];
    if (!question) return;

    // Evaluate answer
    const { score, feedback } = evaluateAnswer(question.q, answer);

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

  // ── End Interview ──
  socket.on('end_interview', ({ roomId }) => {
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

    room.status = 'completed';
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