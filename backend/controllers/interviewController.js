const Interview = require('../models/Interview');

// Skill-based question bank
const skillQuestions = {
  javascript: [
    { q: 'What is the difference between var, let, and const?', keywords: ['scope', 'hoisting', 'block', 'function', 'reassign'] },
    { q: 'Explain closures in JavaScript with an example.', keywords: ['function', 'scope', 'variable', 'inner', 'outer', 'access'] },
    { q: 'What is event delegation and why is it useful?', keywords: ['event', 'parent', 'child', 'bubble', 'listener', 'dom'] },
    { q: 'What is the difference between == and ===?', keywords: ['type', 'strict', 'coercion', 'equality', 'value'] },
    { q: 'Explain Promise and async/await in JavaScript.', keywords: ['async', 'resolve', 'reject', 'then', 'catch', 'pending'] },
    { q: 'What is the prototype chain in JavaScript?', keywords: ['prototype', 'inherit', 'object', 'chain', 'property'] },
    { q: 'What are arrow functions and how are they different from regular functions?', keywords: ['arrow', 'this', 'syntax', 'bind', 'context'] },
  ],
  react: [
    { q: 'What is the Virtual DOM and how does React use it?', keywords: ['virtual', 'real', 'diff', 'update', 'render', 'performance'] },
    { q: 'Explain useState and useEffect hooks with examples.', keywords: ['state', 'effect', 'dependency', 'cleanup', 'render'] },
    { q: 'What is the difference between props and state?', keywords: ['props', 'state', 'parent', 'component', 'immutable', 'mutable'] },
    { q: 'How does React handle component re-rendering?', keywords: ['render', 'state', 'props', 'memo', 'shouldupdate', 'pure'] },
    { q: 'What is Redux and when would you use it?', keywords: ['store', 'action', 'reducer', 'dispatch', 'global', 'state'] },
    { q: 'Explain React component lifecycle methods.', keywords: ['mount', 'update', 'unmount', 'effect', 'cleanup', 'lifecycle'] },
  ],
  python: [
    { q: 'What is the difference between a list and a tuple in Python?', keywords: ['mutable', 'immutable', 'list', 'tuple', 'modify'] },
    { q: 'Explain decorators in Python with an example.', keywords: ['function', 'wrapper', 'modify', 'behavior', 'syntax'] },
    { q: 'What is list comprehension? Give an example.', keywords: ['list', 'loop', 'expression', 'filter', 'compact'] },
    { q: 'What is the difference between deep copy and shallow copy?', keywords: ['copy', 'reference', 'object', 'nested', 'memory'] },
    { q: 'How does Python handle memory management?', keywords: ['garbage', 'collection', 'reference', 'memory', 'heap'] },
    { q: 'What are generators in Python?', keywords: ['yield', 'iterator', 'lazy', 'memory', 'next', 'sequence'] },
  ],
  sql: [
    { q: 'What is the difference between INNER JOIN and LEFT JOIN?', keywords: ['inner', 'left', 'match', 'null', 'rows', 'table'] },
    { q: 'Explain normalization and its forms.', keywords: ['1nf', '2nf', '3nf', 'redundancy', 'dependency', 'normalize'] },
    { q: 'What is an index and when should you use it?', keywords: ['index', 'performance', 'search', 'query', 'speed', 'btree'] },
    { q: 'What is the difference between WHERE and HAVING?', keywords: ['where', 'having', 'group', 'filter', 'aggregate', 'after'] },
    { q: 'Explain ACID properties in databases.', keywords: ['atomic', 'consistent', 'isolated', 'durable', 'transaction'] },
  ],
  java: [
    { q: 'What is the difference between abstract class and interface?', keywords: ['abstract', 'interface', 'implement', 'extend', 'method', 'multiple'] },
    { q: 'Explain OOP concepts in Java.', keywords: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'class'] },
    { q: 'What is the difference between HashMap and HashTable?', keywords: ['synchronized', 'null', 'thread', 'performance', 'concurrent'] },
    { q: 'Explain Java memory model - heap and stack.', keywords: ['heap', 'stack', 'object', 'reference', 'garbage', 'memory'] },
    { q: 'What are Java generics and why are they used?', keywords: ['generic', 'type', 'safety', 'reusable', 'compile', 'cast'] },
  ],
  nodejs: [
    { q: 'What is the event loop in Node.js?', keywords: ['event', 'loop', 'async', 'callback', 'non-blocking', 'queue'] },
    { q: 'What is middleware in Express.js?', keywords: ['middleware', 'request', 'response', 'next', 'pipeline', 'function'] },
    { q: 'How does Node.js handle concurrency?', keywords: ['single', 'thread', 'async', 'event', 'non-blocking', 'callback'] },
    { q: 'What is the difference between require and import?', keywords: ['commonjs', 'esmodule', 'synchronous', 'static', 'dynamic'] },
    { q: 'Explain streams in Node.js.', keywords: ['stream', 'pipe', 'chunk', 'readable', 'writable', 'buffer'] },
  ],
  mongodb: [
    { q: 'What is the difference between SQL and NoSQL databases?', keywords: ['schema', 'flexible', 'document', 'relational', 'scale', 'acid'] },
    { q: 'Explain MongoDB aggregation pipeline.', keywords: ['pipeline', 'match', 'group', 'project', 'sort', 'aggregate'] },
    { q: 'What is indexing in MongoDB?', keywords: ['index', 'performance', 'query', 'speed', 'btree', 'compound'] },
    { q: 'How does MongoDB handle relationships?', keywords: ['embed', 'reference', 'populate', 'denormalize', 'document'] },
  ],
  git: [
    { q: 'What is the difference between git merge and git rebase?', keywords: ['merge', 'rebase', 'history', 'linear', 'conflict', 'branch'] },
    { q: 'Explain git branching strategy.', keywords: ['branch', 'feature', 'main', 'develop', 'release', 'hotfix'] },
    { q: 'What is git stash and when do you use it?', keywords: ['stash', 'save', 'temporary', 'switch', 'work', 'uncommitted'] },
    { q: 'What is the difference between git pull and git fetch?', keywords: ['pull', 'fetch', 'merge', 'remote', 'local', 'update'] },
  ],
  css: [
    { q: 'What is the CSS box model?', keywords: ['margin', 'padding', 'border', 'content', 'width', 'height'] },
    { q: 'Explain CSS flexbox vs grid.', keywords: ['flex', 'grid', 'one-dimensional', 'two-dimensional', 'layout', 'align'] },
    { q: 'What is CSS specificity?', keywords: ['specificity', 'selector', 'id', 'class', 'inline', 'important'] },
    { q: 'What are CSS variables and how to use them?', keywords: ['variable', 'custom', 'property', 'root', 'var', 'reuse'] },
  ],
  html: [
    { q: 'What is semantic HTML and why is it important?', keywords: ['semantic', 'meaning', 'accessibility', 'seo', 'structure', 'tag'] },
    { q: 'What is the difference between div and span?', keywords: ['block', 'inline', 'div', 'span', 'display', 'element'] },
    { q: 'Explain HTML5 new features.', keywords: ['canvas', 'video', 'audio', 'local storage', 'semantic', 'api'] },
  ],
  docker: [
    { q: 'What is Docker and why do we use it?', keywords: ['container', 'image', 'isolate', 'environment', 'portable', 'deploy'] },
    { q: 'What is the difference between Docker image and container?', keywords: ['image', 'container', 'running', 'static', 'instance', 'layer'] },
    { q: 'Explain Docker Compose.', keywords: ['compose', 'multi', 'container', 'service', 'network', 'yaml'] },
  ],
  aws: [
    { q: 'What are the main AWS services you have used?', keywords: ['ec2', 's3', 'rds', 'lambda', 'cloudfront', 'iam'] },
    { q: 'What is the difference between EC2 and Lambda?', keywords: ['server', 'serverless', 'function', 'auto', 'scale', 'cost'] },
    { q: 'Explain S3 bucket and its use cases.', keywords: ['storage', 'object', 'bucket', 'static', 'host', 'cdn'] },
  ],
  hr: [
    { q: 'Tell me about yourself and your technical background.', keywords: ['background', 'experience', 'skills', 'education', 'goal'] },
    { q: 'What are your greatest strengths as a developer?', keywords: ['strength', 'skill', 'problem', 'solve', 'team', 'learn'] },
    { q: 'Describe a challenging project you worked on.', keywords: ['challenge', 'solution', 'team', 'deadline', 'result', 'learn'] },
    { q: 'Where do you see yourself in 5 years?', keywords: ['goal', 'grow', 'career', 'learn', 'contribute', 'future'] },
    { q: 'Why should we hire you?', keywords: ['skill', 'contribute', 'team', 'value', 'passion', 'result'] },
  ],
  dsa: [
    { q: 'What is the time complexity of binary search?', keywords: ['o(log n)', 'log', 'sorted', 'divide', 'half'] },
    { q: 'Explain the difference between stack and queue.', keywords: ['lifo', 'fifo', 'push', 'pop', 'enqueue', 'dequeue'] },
    { q: 'What is dynamic programming? Give an example.', keywords: ['memoization', 'subproblem', 'optimal', 'fibonacci', 'cache'] },
    { q: 'Explain BFS and DFS traversal.', keywords: ['breadth', 'depth', 'queue', 'stack', 'graph', 'tree', 'visit'] },
    { q: 'What is the difference between Array and LinkedList?', keywords: ['random', 'access', 'insert', 'delete', 'memory', 'pointer'] },
  ],
};

// Map skills to question topics
const skillTopicMap = {
  'javascript': 'javascript', 'js': 'javascript',
  'react': 'react', 'reactjs': 'react', 'react.js': 'react',
  'python': 'python',
  'sql': 'sql', 'mysql': 'sql', 'postgresql': 'sql',
  'java': 'java',
  'node': 'nodejs', 'nodejs': 'nodejs', 'node.js': 'nodejs', 'express': 'nodejs',
  'mongodb': 'mongodb', 'mongo': 'mongodb',
  'git': 'git', 'github': 'git',
  'css': 'css', 'tailwind': 'css', 'bootstrap': 'css',
  'html': 'html',
  'docker': 'docker',
  'aws': 'aws', 'cloud': 'aws',
  'dsa': 'dsa', 'data structures': 'dsa', 'algorithms': 'dsa',
};

// Get questions based on resume skills
const getQuestionsFromSkills = async (req, res) => {
  try {
    const { skills, questionCount } = req.body;
    // skills = ['javascript', 'react', 'python', ...]
    // questionCount = how many questions (default 5)

    const count = questionCount || 5;
    const allQuestions = [];

    // Map skills to topics and collect questions
    const usedTopics = new Set();

    skills.forEach(skill => {
      const topic = skillTopicMap[skill.toLowerCase()];
      if (topic && !usedTopics.has(topic) && skillQuestions[topic]) {
        usedTopics.add(topic);
        const topicQs = skillQuestions[topic];
        // Take 1-2 questions per skill
        const take = Math.min(2, topicQs.length);
        const shuffled = topicQs.sort(() => Math.random() - 0.5).slice(0, take);
        allQuestions.push(...shuffled.map(q => ({ ...q, topic })));
      }
    });

    // Always add 1 HR question
    const hrQ = skillQuestions.hr[Math.floor(Math.random() * skillQuestions.hr.length)];
    allQuestions.push({ ...hrQ, topic: 'hr' });

    // Shuffle and limit
    const finalQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map((q, i) => ({
        id: i,
        question: q.q,
        topic: q.topic,
        keywords: q.keywords
      }));

    res.json({
      questions: finalQuestions,
      totalQuestions: finalQuestions.length,
      topicsCovered: [...usedTopics]
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get questions by topic (existing)
const getQuestions = async (req, res) => {
  try {
    const { topic } = req.params;
    const questions = skillQuestions[topic];

    if (!questions) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const questionList = questions.map((q, i) => ({
      id: i,
      question: q.q,
      topic
    }));

    res.json({ topic, questions: questionList });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit answers
const submitInterview = async (req, res) => {
  try {
    const { topic, answers, questions: questionData } = req.body;

    let totalScore = 0;
    const evaluated = answers.map((ans) => {
      // Find question keywords
      let keywords = [];
      if (questionData && questionData[ans.questionId]) {
        keywords = questionData[ans.questionId].keywords || [];
      } else {
        // Fallback
        const topicKey = topic || 'hr';
        const qBank = skillQuestions[topicKey] || skillQuestions.hr;
        keywords = qBank[ans.questionId % qBank.length]?.keywords || [];
      }

      const userAnswer = ans.answer.toLowerCase();
      const matchedKeywords = keywords.filter(kw =>
        userAnswer.includes(kw.toLowerCase())
      );

      const score = keywords.length > 0
        ? Math.round((matchedKeywords.length / keywords.length) * 10)
        : 5;

      totalScore += score;

      let feedback = '';
      if (score >= 8) feedback = 'Excellent answer! Well explained.';
      else if (score >= 5) feedback = `Good attempt! Also mention: ${keywords.slice(0, 2).join(', ')}`;
      else if (score >= 2) feedback = `Needs improvement. Key points: ${keywords.slice(0, 3).join(', ')}`;
      else feedback = `Try again. Focus on: ${keywords.slice(0, 3).join(', ')}`;

      return {
        question: ans.question || 'Question',
        userAnswer: ans.answer,
        score,
        maxScore: 10,
        feedback,
        matchedKeywords
      };
    });

    const avgScore = Math.round(totalScore / answers.length);

    await Interview.create({
      userId: req.user.id,
      topic: topic || 'mixed',
      questions: evaluated,
      totalScore: avgScore,
      totalQuestions: answers.length,
      completedAt: new Date()
    });

    res.json({
      message: 'Interview completed!',
      topic: topic || 'mixed',
      totalScore: avgScore,
      maxScore: 10,
      totalQuestions: answers.length,
      results: evaluated
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

module.exports = { getQuestions, getQuestionsFromSkills, submitInterview, getHistory };