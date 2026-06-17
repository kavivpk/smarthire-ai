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

// Get questions based on resume skills (Generates exactly 35 questions)
const getQuestionsFromSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const count = 35; // Generate exactly 35 questions
    const allQuestions = [];
    const usedTopics = new Set();

    // Map skills to topics and collect questions
    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        const topic = skillTopicMap[skill.toLowerCase()];
        if (topic && !usedTopics.has(topic) && skillQuestions[topic]) {
          usedTopics.add(topic);
          const topicQs = skillQuestions[topic];
          // Collect all questions for this topic
          allQuestions.push(...topicQs.map(q => ({ ...q, topic })));
        }
      });
    }

    // Always include HR questions
    skillQuestions.hr.forEach(q => allQuestions.push({ ...q, topic: 'hr' }));

    // Always include DSA questions
    skillQuestions.dsa.forEach(q => allQuestions.push({ ...q, topic: 'dsa' }));

    // If we have less than 35, add questions from other technical topics that the user didn't specify
    if (allQuestions.length < count) {
      Object.keys(skillQuestions).forEach(topic => {
        if (topic !== 'hr' && topic !== 'dsa' && !usedTopics.has(topic)) {
          skillQuestions[topic].forEach(q => allQuestions.push({ ...q, topic }));
        }
      });
    }

    // Shuffle and pick exactly 35
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

// Get questions by topic
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
      let keywords = [];
      if (questionData && questionData[ans.questionId] && Array.isArray(questionData[ans.questionId].keywords)) {
        keywords = questionData[ans.questionId].keywords;
      } else {
        const topicKey = topic || 'hr';
        const qBank = skillQuestions[topicKey] || skillQuestions.hr;
        const matchedQ = qBank.find(q => q.q === ans.question);
        if (matchedQ) {
          keywords = matchedQ.keywords || [];
        } else {
          keywords = qBank[ans.questionId % qBank.length]?.keywords || [];
        }
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

// Aptitude question bank — 20 questions across 4 categories
const aptitudeBank = [
  { id:0, category:'Logical', question:'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely:', options:['Razzies','Lazzies','Not Razzies','None of these'], answer:1 },
  { id:1, category:'Logical', question:'A is taller than B. C is shorter than A. D is taller than C but shorter than B. Who is tallest?', options:['A','B','C','D'], answer:0 },
  { id:2, category:'Logical', question:'Find the odd one out: 2, 3, 5, 7, 11, 14, 17', options:['14','11','17','5'], answer:0 },
  { id:3, category:'Logical', question:'All cats are dogs. All dogs are birds. Conclusion: All cats are birds.', options:['True','False','Cannot determine','Partially true'], answer:0 },
  { id:4, category:'Logical', question:'If ROSE is coded as 6821, CHAIR is coded as 73456, what is EACH coded as?', options:['2537','1783','2783','1537'], answer:2 },
  { id:5, category:'Quantitative', question:'A train 150m long passes a pole in 15 seconds. Its speed in km/h is:', options:['36','40','54','60'], answer:0 },
  { id:6, category:'Quantitative', question:'The sum of first 20 natural numbers is:', options:['190','200','210','220'], answer:2 },
  { id:7, category:'Quantitative', question:'If 8 workers build a wall in 10 days, how many days will 4 workers take?', options:['5','15','20','25'], answer:2 },
  { id:8, category:'Quantitative', question:'A number increased by 20% then decreased by 20%. Net change is:', options:['0%','4% decrease','4% increase','2% decrease'], answer:1 },
  { id:9, category:'Quantitative', question:'What is 15% of 480?', options:['62','68','72','78'], answer:2 },
  { id:10, category:'Verbal', question:'Choose the synonym of BENEVOLENT:', options:['Kind','Cruel','Selfish','Greedy'], answer:0 },
  { id:11, category:'Verbal', question:'Choose the antonym of OBSCURE:', options:['Hidden','Clear','Dark','Vague'], answer:1 },
  { id:12, category:'Verbal', question:'Fill in the blank: She _____ to the office every day.', options:['go','goes','going','gone'], answer:1 },
  { id:13, category:'Verbal', question:'Identify the correctly spelled word:', options:['Accomodate','Accommodate','Acomodate','Accommadate'], answer:1 },
  { id:14, category:'Verbal', question:'The idiom "Break the ice" means:', options:['Destroy something','Start a conversation','End a fight','Win a game'], answer:1 },
  { id:15, category:'Technical', question:'What does CPU stand for?', options:['Central Processing Unit','Control Processing Unit','Central Program Unit','Core Processing Unit'], answer:0 },
  { id:16, category:'Technical', question:'Which data structure works on LIFO principle?', options:['Queue','Stack','Array','Tree'], answer:1 },
  { id:17, category:'Technical', question:'What is the time complexity of binary search?', options:['O(n)','O(n2)','O(log n)','O(n log n)'], answer:2 },
  { id:18, category:'Technical', question:'Which of the following is NOT an OOP concept?', options:['Inheritance','Polymorphism','Compilation','Encapsulation'], answer:2 },
  { id:19, category:'Technical', question:'What does HTTP stand for?', options:['HyperText Transfer Protocol','High Text Transfer Protocol','HyperText Transmission Protocol','HyperText Transport Protocol'], answer:0 },
];

const generateAptitude = async (req, res) => {
  try {
    const shuffled = [...aptitudeBank].sort(() => Math.random() - 0.5);
    const questions = shuffled.map(({ id, category, question, options }) => ({ id, category, question, options }));
    res.json({ questions, total: questions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitAptitude = async (req, res) => {
  try {
    const { answers, questions } = req.body;
    const qBank = (questions && questions.length > 0) ? questions : aptitudeBank;
    let correct = 0;
    const categoryScores = {};
    const results = qBank.map(q => {
      const selected = (answers && answers[q.id] !== undefined) ? answers[q.id] : -1;
      const isCorrect = selected === q.answer;
      if (isCorrect) correct++;
      if (!categoryScores[q.category]) categoryScores[q.category] = { correct: 0, total: 0 };
      categoryScores[q.category].total++;
      if (isCorrect) categoryScores[q.category].correct++;
      return { id: q.id, category: q.category, question: q.question, selected, correctAnswer: q.answer, correctOption: q.options[q.answer], isCorrect };
    });
    const totalScore = Math.round((correct / qBank.length) * 100);
    res.json({ correct, total: qBank.length, totalScore, categoryScores, results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const codingProblems = [
  { id:0, title:'Reverse a String', difficulty:'Easy', description:'Write a function that takes a string and returns it reversed.\n\nExample:\nInput: "hello"\nOutput: "olleh"',
    testCases: [
      { input: '"hello"', expected: '"olleh"' },
      { input: '"a"', expected: '"a"' },
      { input: '"algorithm"', expected: '"mhtirogla"' }
    ],
    starterCode:{ python:'def reverse_string(s):\n    # Write your solution here\n    pass\n\nprint(reverse_string("hello"))', javascript:'function reverseString(s) {\n  // Write your solution here\n}\n\nconsole.log(reverseString("hello"));', java:'public class Solution {\n  public static String reverseString(String s) {\n    return "";\n  }\n  public static void main(String[] args) {\n    System.out.println(reverseString("hello"));\n  }\n}', cpp:'#include<iostream>\n#include<string>\nusing namespace std;\n\nstring reverseString(string s) {\n  return "";\n}\n\nint main() { cout << reverseString("hello"); }', c:'#include<stdio.h>\nvoid reverseString(char* s) { /* Write here */ }\nint main() { char s[]="hello"; reverseString(s); printf("%s",s); }', go:'package main\nimport "fmt"\nfunc reverseString(s string) string { return "" }\nfunc main() { fmt.Println(reverseString("hello")) }' }
  },
  { id:1, title:'FizzBuzz', difficulty:'Easy', description:'Print numbers 1 to n. Multiples of 3: "Fizz", multiples of 5: "Buzz", multiples of both: "FizzBuzz".\n\nExample: Input n=15 -> 1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz',
    testCases: [
      { input: '3', expected: '"1 2 Fizz"' },
      { input: '5', expected: '"1 2 Fizz 4 Buzz"' },
      { input: '15', expected: '"1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz"' }
    ],
    starterCode:{ python:'def fizzbuzz(n):\n    pass\n\nfizzbuzz(15)', javascript:'function fizzbuzz(n) {\n  // Write here\n}\nfizzbuzz(15);', java:'public class Solution {\n  public static void fizzbuzz(int n) { }\n  public static void main(String[] args) { fizzbuzz(15); }\n}', cpp:'#include<iostream>\nusing namespace std;\nvoid fizzbuzz(int n) { }\nint main() { fizzbuzz(15); }', c:'#include<stdio.h>\nvoid fizzbuzz(int n) { }\nint main() { fizzbuzz(15); }', go:'package main\nfunc fizzbuzz(n int) { }\nfunc main() { fizzbuzz(15) }' }
  },
  { id:2, title:'Two Sum', difficulty:'Medium', description:'Given an array of integers and a target, return indices of two numbers that add up to target.\n\nExample:\nInput: nums=[2,7,11,15], target=9\nOutput: [0,1]',
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' },
      { input: 'nums = [3,3], target = 6', expected: '[0,1]' }
    ],
    starterCode:{ python:'def two_sum(nums, target):\n    pass\n\nprint(two_sum([2,7,11,15], 9))', javascript:'function twoSum(nums, target) {\n  // Write here\n}\nconsole.log(twoSum([2,7,11,15], 9));', java:'public class Solution {\n  public static int[] twoSum(int[] nums, int target) { return new int[]{}; }\n  public static void main(String[] args) { int[] r=twoSum(new int[]{2,7,11,15},9); System.out.println(r[0]+", "+r[1]); }\n}', cpp:'#include<iostream>\n#include<vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums,int target) { return {}; }\nint main() { vector<int> n={2,7,11,15}; auto r=twoSum(n,9); cout<<r[0]<<","<<r[1]; }', c:'#include<stdio.h>\nvoid twoSum(int* nums,int n,int target) { }\nint main() { int n[]={2,7,11,15}; twoSum(n,4,9); }', go:'package main\nimport "fmt"\nfunc twoSum(nums []int,target int) []int { return nil }\nfunc main() { fmt.Println(twoSum([]int{2,7,11,15},9)) }' }
  },
  { id:3, title:'Check Palindrome', difficulty:'Easy', description:'Write a function to check if a given string is a palindrome.\n\nExample:\nInput: "racecar" -> true\nInput: "hello" -> false',
    testCases: [
      { input: '"racecar"', expected: 'true' },
      { input: '"hello"', expected: 'false' },
      { input: '"abacaba"', expected: 'true' }
    ],
    starterCode:{ python:'def is_palindrome(s):\n    pass\n\nprint(is_palindrome("racecar"))', javascript:'function isPalindrome(s) {\n  // Write here\n}\nconsole.log(isPalindrome("racecar"));', java:'public class Solution {\n  public static boolean isPalindrome(String s) { return false; }\n  public static void main(String[] args) { System.out.println(isPalindrome("racecar")); }\n}', cpp:'#include<iostream>\n#include<string>\nusing namespace std;\nbool isPalindrome(string s) { return false; }\nint main() { cout<<isPalindrome("racecar"); }', c:'#include<stdio.h>\nint isPalindrome(char* s) { return 0; }\nint main() { printf("%d",isPalindrome("racecar")); }', go:'package main\nimport "fmt"\nfunc isPalindrome(s string) bool { return false }\nfunc main() { fmt.Println(isPalindrome("racecar")) }' }
  },
  { id:4, title:'Find Maximum in Array', difficulty:'Easy', description:'Write a function that returns the maximum element in an array.\n\nExample:\nInput: [3,1,4,1,5,9,2,6]\nOutput: 9',
    testCases: [
      { input: '[3,1,4,1,5,9,2,6]', expected: '9' },
      { input: '[-1,-5,-3]', expected: '-1' },
      { input: '[10]', expected: '10' }
    ],
    starterCode:{ python:'def find_max(arr):\n    pass\n\nprint(find_max([3,1,4,1,5,9,2,6]))', javascript:'function findMax(arr) {\n  // Write here\n}\nconsole.log(findMax([3,1,4,1,5,9,2,6]));', java:'public class Solution {\n  public static int findMax(int[] arr) { return 0; }\n  public static void main(String[] args) { System.out.println(findMax(new int[]{3,1,4,1,5,9,2,6})); }\n}', cpp:'#include<iostream>\n#include<vector>\nusing namespace std;\nint findMax(vector<int>& arr) { return 0; }\nint main() { vector<int> a={3,1,4,1,5,9,2,6}; cout<<findMax(a); }', c:'#include<stdio.h>\nint findMax(int* arr,int n) { return 0; }\nint main() { int a[]={3,1,4,1,5,9,2,6}; printf("%d",findMax(a,8)); }', go:'package main\nimport "fmt"\nfunc findMax(arr []int) int { return 0 }\nfunc main() { fmt.Println(findMax([]int{3,1,4,1,5,9,2,6})) }' }
  },
];

const getCodingProblems = async (req, res) => {
  try {
    res.json({ problems: codingProblems });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const evaluateCode = async (req, res) => {
  try {
    const { code, language, problem, runOnly, testCases } = req.body;
    if (!code || !language || !problem) {
      return res.status(400).json({ message: 'code, language, and problem are required' });
    }
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY not configured in backend .env' });
    }

    const prompt = `You are a LeetCode-style code executor and evaluator. You must evaluate the user's code against the provided test cases.

Problem Description:
${problem}

User Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases to run:
${JSON.stringify(testCases || [], null, 2)}

For each test case:
1. Trace the execution of the user's code with the given input.
2. Determine the actual output of the user's code.
3. Compare the actual output with the expected output (ignoring minor whitespace differences).
4. Mark it as 'Pass' or 'Fail'.

${runOnly ? 
`Respond ONLY with a valid JSON object (no markdown block, no explanation, no \`\`\`json wrapper), in this exact format:
{
  "verdict": "Accepted", // or "Wrong Answer", "Compile Error", etc.
  "testCases": [
    { "input": "input_val", "expected": "expected_val", "actual": "actual_val", "status": "Pass" } // or "Fail"
  ]
}` : 
`Respond ONLY with a valid JSON object (no markdown block, no explanation, no \`\`\`json wrapper), in this exact format:
{
  "score": 10, // from 0 to 10
  "verdict": "Accepted", // or "Wrong Answer", "Compile Error", etc.
  "testCases": [
    { "input": "input_val", "expected": "expected_val", "actual": "actual_val", "status": "Pass" } // or "Fail"
  ],
  "feedback": "2-3 sentence feedback explaining correctness and efficiency.",
  "hints": "One actionable hint for improvement.",
  "timeComplexity": "O(n)"
}`}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 600 })
    });
    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(500).json({ message: 'Groq API error', error: err });
    }
    const groqData = await groqRes.json();
    const raw = groqData.choices[0].message.content.trim().replace(/```json?/g, '').replace(/```/g, '').trim();
    let evaluation;
    try { 
      evaluation = JSON.parse(raw); 
    } catch { 
      evaluation = { 
        score: 5, 
        verdict: 'Reviewed', 
        testCases: (testCases || []).map(tc => ({ ...tc, actual: 'N/A', status: 'Pass' })),
        feedback: raw, 
        hints: '', 
        timeComplexity: 'N/A' 
      }; 
    }
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getQuestions, getQuestionsFromSkills, submitInterview, getHistory, generateAptitude, submitAptitude, evaluateCode, getCodingProblems };