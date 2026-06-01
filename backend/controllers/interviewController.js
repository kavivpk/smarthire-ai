const Interview = require('../models/Interview');

// Question Bank
const questionBank = {
  javascript: [
    { q: 'What is the difference between var, let, and const?', keywords: ['scope', 'hoisting', 'block', 'function', 'reassign'] },
    { q: 'Explain what a Promise is in JavaScript.', keywords: ['async', 'resolve', 'reject', 'then', 'catch', 'pending'] },
    { q: 'What is closure in JavaScript?', keywords: ['function', 'scope', 'variable', 'inner', 'outer', 'access'] },
    { q: 'What is the difference between == and ===?', keywords: ['type', 'strict', 'coercion', 'equality', 'value'] },
    { q: 'What is event delegation?', keywords: ['event', 'parent', 'child', 'bubble', 'listener', 'dom'] },
  ],
  react: [
    { q: 'What is the Virtual DOM in React?', keywords: ['virtual', 'real', 'diff', 'update', 'render', 'performance'] },
    { q: 'What are React Hooks? Name some common ones.', keywords: ['usestate', 'useeffect', 'functional', 'state', 'lifecycle'] },
    { q: 'What is the difference between props and state?', keywords: ['props', 'state', 'parent', 'component', 'immutable', 'mutable'] },
    { q: 'What is useEffect used for?', keywords: ['side effect', 'lifecycle', 'mount', 'unmount', 'dependency', 'cleanup'] },
    { q: 'What is Redux and when would you use it?', keywords: ['state', 'store', 'action', 'reducer', 'global', 'management'] },
  ],
  python: [
    { q: 'What is the difference between a list and a tuple?', keywords: ['mutable', 'immutable', 'list', 'tuple', 'modify'] },
    { q: 'What are decorators in Python?', keywords: ['function', 'wrapper', 'modify', 'behavior', 'syntax', '@'] },
    { q: 'Explain list comprehension with an example.', keywords: ['list', 'loop', 'expression', 'filter', 'compact'] },
    { q: 'What is the difference between deep copy and shallow copy?', keywords: ['copy', 'reference', 'object', 'nested', 'memory'] },
    { q: 'What is a generator in Python?', keywords: ['yield', 'iterator', 'lazy', 'memory', 'next', 'sequence'] },
  ],
  hr: [
    { q: 'Tell me about yourself.', keywords: ['background', 'experience', 'skills', 'education', 'goal'] },
    { q: 'What are your strengths and weaknesses?', keywords: ['strength', 'weakness', 'improve', 'skill', 'working'] },
    { q: 'Where do you see yourself in 5 years?', keywords: ['goal', 'grow', 'career', 'learn', 'contribute', 'future'] },
    { q: 'Why do you want to join this company?', keywords: ['culture', 'growth', 'opportunity', 'product', 'mission', 'team'] },
    { q: 'How do you handle pressure or stressful situations?', keywords: ['calm', 'priority', 'deadline', 'manage', 'focus', 'plan'] },
  ],
  dsa: [
    { q: 'What is the time complexity of binary search?', keywords: ['o(log n)', 'log', 'sorted', 'divide', 'half', 'search'] },
    { q: 'Explain the difference between stack and queue.', keywords: ['lifo', 'fifo', 'push', 'pop', 'enqueue', 'dequeue'] },
    { q: 'What is a hash table and how does it work?', keywords: ['hash', 'key', 'value', 'collision', 'bucket', 'function'] },
    { q: 'What is recursion? Give an example.', keywords: ['base case', 'function', 'call itself', 'factorial', 'stack'] },
    { q: 'What is the difference between BFS and DFS?', keywords: ['breadth', 'depth', 'queue', 'stack', 'graph', 'tree'] },
  ]
};

// Get questions by topic
const getQuestions = async (req, res) => {
  try {
    const { topic } = req.params;
    const questions = questionBank[topic];

    if (!questions) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Return only question text (not keywords)
    const questionList = questions.map((q, i) => ({
      id: i,
      question: q.q
    }));

    res.json({ topic, questions: questionList });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit answers + evaluate
const submitInterview = async (req, res) => {
  try {
    const { topic, answers } = req.body;
    // answers = [{ questionId: 0, answer: "..." }, ...]

    const questions = questionBank[topic];
    if (!questions) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    let totalScore = 0;
    const evaluated = answers.map((ans) => {
      const qData = questions[ans.questionId];
      const userAnswer = ans.answer.toLowerCase();

      // Score based on keyword matching
      const matchedKeywords = qData.keywords.filter(kw =>
        userAnswer.includes(kw.toLowerCase())
      );

      const score = Math.round(
        (matchedKeywords.length / qData.keywords.length) * 10
      );
      totalScore += score;

      // Feedback
      let feedback = '';
      if (score >= 8) feedback = 'Excellent answer! Well explained.';
      else if (score >= 5) feedback = `Good attempt! Also mention: ${qData.keywords.slice(0, 2).join(', ')}`;
      else if (score >= 2) feedback = `Needs improvement. Key points: ${qData.keywords.slice(0, 3).join(', ')}`;
      else feedback = `Try again. Focus on: ${qData.keywords.slice(0, 3).join(', ')}`;

      return {
        question: qData.q,
        userAnswer: ans.answer,
        score,
        maxScore: 10,
        feedback,
        matchedKeywords
      };
    });

    const avgScore = Math.round(totalScore / answers.length);

    // Save to DB
    await Interview.create({
      userId: req.user.id,
      topic,
      questions: evaluated,
      totalScore: avgScore,
      totalQuestions: answers.length,
      completedAt: new Date()
    });

    res.json({
      message: 'Interview completed!',
      topic,
      totalScore: avgScore,
      maxScore: 10,
      totalQuestions: answers.length,
      results: evaluated
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get interview history
const getHistory = async (req, res) => {
  try {
    const history = await Interview.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getQuestions, submitInterview, getHistory };
