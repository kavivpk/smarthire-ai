"""
routers/interview.py — Interview and assessments routes (replaces routes/interviewRoutes.js, controllers/interviewController.js, controllers/interviewEvaluationController.js)
"""
import os
import asyncio
import random
import json
import httpx
from typing import List, Dict, Union, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_user
from models.interview import Interview
from models.user import User
from models.aptitude_question import AptitudeQuestion
from models.coding_report import CodingReport
from models.interview_session import InterviewSession
from models.technical_interview_report import TechnicalInterviewReport
from models.interview_report import InterviewReport
from models.hr_interview_report import HRInterviewReport
from services.email_service import (
    send_aptitude_result,
    send_coding_report,
    send_combined_ai_interview_result,
    send_aptitude_only_result,
    send_coding_only_result,
    send_technical_interview_report,
    send_hr_interview_report,
    send_room_invite
)
from services.notification_service import notify
from services.interview_evaluation_service import evaluate_technical_answer, summarize_technical_interview

router = APIRouter(prefix="/api/interview", tags=["interview"])

# ── Question Banks ───────────────────────────────────────────────────────────

skill_questions = {
    "javascript": [
        {"q": "What is the difference between var, let, and const?", "keywords": ["scope", "hoisting", "block", "function", "reassign"]},
        {"q": "Explain closures in JavaScript with an example.", "keywords": ["function", "scope", "variable", "inner", "outer", "access"]},
        {"q": "What is event delegation and why is it useful?", "keywords": ["event", "parent", "child", "bubble", "listener", "dom"]},
        {"q": "What is the difference between == and ===?", "keywords": ["type", "strict", "coercion", "equality", "value"]},
        {"q": "Explain Promise and async/await in JavaScript.", "keywords": ["async", "resolve", "reject", "then", "catch", "pending"]},
        {"q": "What is the prototype chain in JavaScript?", "keywords": ["prototype", "inherit", "object", "chain", "property"]},
        {"q": "What are arrow functions and how are they different from regular functions?", "keywords": ["arrow", "this", "syntax", "bind", "context"]}
    ],
    "react": [
        {"q": "What is the Virtual DOM and how does React use it?", "keywords": ["virtual", "real", "diff", "update", "render", "performance"]},
        {"q": "Explain useState and useEffect hooks with examples.", "keywords": ["state", "effect", "dependency", "cleanup", "render"]},
        {"q": "What is the difference between props and state?", "keywords": ["props", "state", "parent", "component", "immutable", "mutable"]},
        {"q": "How does React handle component re-rendering?", "keywords": ["render", "state", "props", "memo", "shouldupdate", "pure"]},
        {"q": "What is Redux and when would you use it?", "keywords": ["store", "action", "reducer", "dispatch", "global", "state"]},
        {"q": "Explain React component lifecycle methods.", "keywords": ["mount", "update", "unmount", "effect", "cleanup", "lifecycle"]}
    ],
    "python": [
        {"q": "What is the difference between a list and a tuple in Python?", "keywords": ["mutable", "immutable", "list", "tuple", "modify"]},
        {"q": "Explain decorators in Python with an example.", "keywords": ["function", "wrapper", "modify", "behavior", "syntax"]},
        {"q": "What is list comprehension? Give an example.", "keywords": ["list", "loop", "expression", "filter", "compact"]},
        {"q": "What is the difference between deep copy and shallow copy?", "keywords": ["copy", "reference", "object", "nested", "memory"]},
        {"q": "How does Python handle memory management?", "keywords": ["garbage", "collection", "reference", "memory", "heap"]},
        {"q": "What are generators in Python?", "keywords": ["yield", "iterator", "lazy", "memory", "next", "sequence"]}
    ],
    "sql": [
        {"q": "What is the difference between INNER JOIN and LEFT JOIN?", "keywords": ["inner", "left", "match", "null", "rows", "table"]},
        {"q": "Explain normalization and its forms.", "keywords": ["1nf", "2nf", "3nf", "redundancy", "dependency", "normalize"]},
        {"q": "What is an index and when should you use it?", "keywords": ["index", "performance", "search", "query", "speed", "btree"]},
        {"q": "What is the difference between WHERE and HAVING?", "keywords": ["where", "having", "group", "filter", "aggregate", "after"]},
        {"q": "Explain ACID properties in databases.", "keywords": ["atomic", "consistent", "isolated", "durable", "transaction"]}
    ],
    "java": [
        {"q": "What is the difference between abstract class and interface?", "keywords": ["abstract", "interface", "implement", "extend", "method", "multiple"]},
        {"q": "Explain OOP concepts in Java.", "keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction", "class"]},
        {"q": "What is the difference between HashMap and HashTable?", "keywords": ["synchronized", "null", "thread", "performance", "concurrent"]},
        {"q": "Explain Java memory model - heap and stack.", "keywords": ["heap", "stack", "object", "reference", "garbage", "memory"]},
        {"q": "What are Java generics and why are they used?", "keywords": ["generic", "type", "safety", "reusable", "compile", "cast"]}
    ],
    "nodejs": [
        {"q": "What is the event loop in Node.js?", "keywords": ["event", "loop", "async", "callback", "non-blocking", "queue"]},
        {"q": "What is middleware in Express.js?", "keywords": ["middleware", "request", "response", "next", "pipeline", "function"]},
        {"q": "How does Node.js handle concurrency?", "keywords": ["single", "thread", "async", "event", "non-blocking", "callback"]},
        {"q": "What is the difference between require and import?", "keywords": ["commonjs", "esmodule", "synchronous", "static", "dynamic"]},
        {"q": "Explain streams in Node.js.", "keywords": ["stream", "pipe", "chunk", "readable", "writable", "buffer"]}
    ],
    "mongodb": [
        {"q": "What is the difference between SQL and NoSQL databases?", "keywords": ["schema", "flexible", "document", "relational", "scale", "acid"]},
        {"q": "Explain MongoDB aggregation pipeline.", "keywords": ["pipeline", "match", "group", "project", "sort", "aggregate"]},
        {"q": "What is indexing in MongoDB?", "keywords": ["index", "performance", "query", "speed", "btree", "compound"]},
        {"q": "How does MongoDB handle relationships?", "keywords": ["embed", "reference", "populate", "denormalize", "document"]}
    ],
    "git": [
        {"q": "What is the difference between git merge and git rebase?", "keywords": ["merge", "rebase", "history", "linear", "conflict", "branch"]},
        {"q": "Explain git branching strategy.", "keywords": ["branch", "feature", "main", "develop", "release", "hotfix"]},
        {"q": "What is git stash and when do you use it?", "keywords": ["stash", "save", "temporary", "switch", "work", "uncommitted"]},
        {"q": "What is the difference between git pull and git fetch?", "keywords": ["pull", "fetch", "merge", "remote", "local", "update"]}
    ],
    "css": [
        {"q": "What is the CSS box model?", "keywords": ["margin", "padding", "border", "content", "width", "height"]},
        {"q": "Explain CSS flexbox vs grid.", "keywords": ["flex", "grid", "one-dimensional", "two-dimensional", "layout", "align"]},
        {"q": "What is CSS specificity?", "keywords": ["specificity", "selector", "id", "class", "inline", "important"]},
        {"q": "What are CSS variables and how to use them?", "keywords": ["variable", "custom", "property", "root", "var", "reuse"]}
    ],
    "html": [
        {"q": "What is semantic HTML and why is it important?", "keywords": ["semantic", "meaning", "accessibility", "seo", "structure", "tag"]},
        {"q": "What is the difference between div and span?", "keywords": ["block", "inline", "div", "span", "display", "element"]},
        {"q": "Explain HTML5 new features.", "keywords": ["canvas", "video", "audio", "local storage", "semantic", "api"]}
    ],
    "docker": [
        {"q": "What is Docker and why do we use it?", "keywords": ["container", "image", "isolate", "environment", "portable", "deploy"]},
        {"q": "What is the difference between Docker image and container?", "keywords": ["image", "container", "running", "static", "instance", "layer"]},
        {"q": "Explain Docker Compose.", "keywords": ["compose", "multi", "container", "service", "network", "yaml"]}
    ],
    "aws": [
        {"q": "What are the main AWS services you have used?", "keywords": ["ec2", "s3", "rds", "lambda", "cloudfront", "iam"]},
        {"q": "What is the difference between EC2 and Lambda?", "keywords": ["server", "serverless", "function", "auto", "scale", "cost"]},
        {"q": "Explain S3 bucket and its use cases.", "keywords": ["storage", "object", "bucket", "static", "host", "cdn"]}
    ],
    "hr": [
        {"q": "Tell me about yourself and your technical background.", "keywords": ["background", "experience", "skills", "education", "goal"]},
        {"q": "What are your greatest strengths as a developer?", "keywords": ["strength", "skill", "problem", "solve", "team", "learn"]},
        {"q": "Describe a challenging project you worked on.", "keywords": ["challenge", "solution", "team", "deadline", "result", "learn"]},
        {"q": "Where do you see yourself in 5 years?", "keywords": ["goal", "grow", "career", "learn", "contribute", "future"]},
        {"q": "Why should we hire you?", "keywords": ["skill", "contribute", "team", "value", "passion", "result"]}
    ],
    "dsa": [
        {"q": "What is the time complexity of binary search?", "keywords": ["o(log n)", "log", "sorted", "divide", "half"]},
        {"q": "Explain the difference between stack and queue.", "keywords": ["lifo", "fifo", "push", "pop", "enqueue", "dequeue"]},
        {"q": "What is dynamic programming? Give an example.", "keywords": ["memoization", "subproblem", "optimal", "fibonacci", "cache"]},
        {"q": "Explain BFS and DFS traversal.", "keywords": ["breadth", "depth", "queue", "stack", "graph", "tree", "visit"]},
        {"q": "What is the difference between Array and LinkedList.", "keywords": ["random", "access", "insert", "delete", "memory", "pointer"]}
    ]
}

skill_topic_map = {
    "javascript": "javascript", "js": "javascript",
    "react": "react", "reactjs": "react", "react.js": "react",
    "python": "python",
    "sql": "sql", "mysql": "sql", "postgresql": "sql",
    "java": "java",
    "node": "nodejs", "nodejs": "nodejs", "node.js": "nodejs", "express": "nodejs",
    "mongodb": "mongodb", "mongo": "mongodb",
    "git": "git", "github": "git",
    "css": "css", "tailwind": "css", "bootstrap": "css",
    "html": "html",
    "docker": "docker",
    "aws": "aws", "cloud": "aws",
    "dsa": "dsa", "data structures": "dsa", "algorithms": "dsa"
}

aptitude_sections = [
    {
        "section": "Analytical",
        "icon": "🔍",
        "questions": [
            {"id": "a0", "question": "If A > B and B > C, which is definitely true?", "options": ["C > A", "A > C", "B > A", "C > B"], "answer": 1},
            {"id": "a1", "question": "A clock shows 3:15. What is the angle between the hands?", "options": ["0°", "7.5°", "30°", "45°"], "answer": 1},
            {"id": "a2", "question": "Find the next number: 2, 6, 12, 20, 30, __", "options": ["40", "42", "44", "46"], "answer": 1},
            {"id": "a3", "question": "A is twice as old as B. 10 years ago A was 3 times as old as B. What is A's age now?", "options": ["30", "40", "20", "60"], "answer": 1},
            {"id": "a4", "question": 'Pointing to a boy, Sara said "He is the son of my grandfather\'s only child." How is Sara related to the boy?', "options": ["Sister", "Mother", "Cousin", "Aunt"], "answer": 0},
            {"id": "a5", "question": "Complete: 1, 4, 9, 16, 25, __", "options": ["30", "35", "36", "40"], "answer": 2},
            {"id": "a6", "question": "In a row of 20 students, Rohan is 8th from the left. What is his position from the right?", "options": ["11", "12", "13", "14"], "answer": 2},
            {"id": "a7", "question": "A box has red and blue balls. 5 are red. Total is 12. How many are blue?", "options": ["5", "6", "7", "8"], "answer": 2},
            {"id": "a8", "question": "Find the odd one out: 36, 49, 64, 72, 81", "options": ["36", "49", "72", "81"], "answer": 2},
            {"id": "a9", "question": "If 5 cats catch 5 mice in 5 minutes, how many minutes do 100 cats take to catch 100 mice?", "options": ["1", "5", "100", "20"], "answer": 1},
            {"id": "a10", "question": "A cube has 6 faces. How many edges does it have?", "options": ["8", "10", "12", "16"], "answer": 2},
            {"id": "a11", "question": "What comes next in: B, D, G, K, P, __?", "options": ["T", "U", "V", "W"], "answer": 2},
            {"id": "a12", "question": "The average of 5 numbers is 27. If one number is removed the average becomes 25. What is the removed number?", "options": ["30", "35", "37", "40"], "answer": 1},
            {"id": "a13", "question": "How many times does the digit 3 appear from 1 to 100?", "options": ["10", "19", "20", "21"], "answer": 2},
            {"id": "a14", "question": "Ravi is 7 ranks ahead of Sunil in a class of 35. If Sunil's rank from last is 13, what is Ravi's rank from front?", "options": ["15", "16", "17", "18"], "answer": 0}
        ]
    },
    {
        "section": "Logical",
        "icon": "🧩",
        "questions": [
            {"id": "l0", "question": "All cats are dogs. All dogs are birds. Conclusion: All cats are birds.", "options": ["True", "False", "Cannot determine", "Partially true"], "answer": 0},
            {"id": "l1", "question": "If ROSE is coded as 6821, CHAIR is coded as 73456, what is EACH coded as?", "options": ["2537", "1783", "2783", "1537"], "answer": 2},
            {"id": "l2", "question": "Find the odd one out: 2, 3, 5, 7, 11, 14, 17", "options": ["14", "11", "17", "5"], "answer": 0},
            {"id": "l3", "question": "A is taller than B. C is shorter than A. D is taller than C but shorter than B. Who is tallest?", "options": ["A", "B", "C", "D"], "answer": 0},
            {"id": "l4", "question": "If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely:", "options": ["Razzies", "Lazzies", "Not Razzies", "None of these"], "answer": 1},
            {"id": "l5", "question": "Monday is to Sun as Thursday is to?", "options": ["Jupiter", "Mars", "Mercury", "Saturn"], "answer": 1},
            {"id": "l6", "question": "Complete the pattern: AZ, BY, CX, DW, __", "options": ["EV", "EU", "FV", "EW"], "answer": 0},
            {"id": "l7", "question": "If FRIEND = 613520, FIGHT = 61879, what is FRIGHT?", "options": ["613879", "618739", "619879", "613789"], "answer": 0},
            {"id": "l8", "question": "Some pens are pencils. All pencils are erasers. Conclusion: Some pens are erasers.", "options": ["True", "False", "Cannot determine", "Partially true"], "answer": 0},
            {"id": "l9", "question": "If yesterday was Saturday, what will be the day after tomorrow?", "options": ["Monday", "Tuesday", "Wednesday", "Sunday"], "answer": 1},
            {"id": "l10", "question": "Arrange: Bud→Flower→Seed→Fruit. Which is the correct order?", "options": ["Bud,Flower,Fruit,Seed", "Seed,Bud,Flower,Fruit", "Flower,Bud,Fruit,Seed", "Bud,Seed,Fruit,Flower"], "answer": 1},
            {"id": "l11", "question": "In a family, if P is father of Q, Q is mother of R, what is P to R?", "options": ["Uncle", "Grandfather", "Father", "Cousin"], "answer": 1},
            {"id": "l12", "question": "A man walks 3km north, turns right and walks 4km. How far is he from start?", "options": ["3km", "4km", "5km", "7km"], "answer": 2},
            {"id": "l13", "question": "No teachers are students. All students are scholars. Conclusion: No teachers are scholars.", "options": ["True", "False", "Cannot determine", "Partially true"], "answer": 2},
            {"id": "l14", "question": "Find next: 3, 9, 27, 81, __", "options": ["162", "243", "324", "729"], "answer": 1}
        ]
    },
    {
        "section": "Verbal",
        "icon": "📝",
        "questions": [
            {"id": "v0", "question": "Choose the synonym of BENEVOLENT:", "options": ["Kind", "Cruel", "Selfish", "Greedy"], "answer": 0},
            {"id": "v1", "question": "Choose the antonym of OBSCURE:", "options": ["Hidden", "Clear", "Dark", "Vague"], "answer": 1},
            {"id": "v2", "question": "Fill in the blank: She _____ to the office every day.", "options": ["go", "goes", "going", "gone"], "answer": 1},
            {"id": "v3", "question": "Identify the correctly spelled word:", "options": ["Accomodate", "Accommodate", "Acomodate", "Accommadate"], "answer": 1},
            {"id": "v4", "question": 'The idiom "Break the ice" means:', "options": ["Destroy something", "Start a conversation", "End a fight", "Win a game"], "answer": 1},
            {"id": "v5", "question": "Choose the word closest in meaning to AMIABLE:", "options": ["Angry", "Friendly", "Distant", "Proud"], "answer": 1},
            {"id": "v6", "question": "Which sentence is grammatically correct?", "options": ["He don't know", "He doesn't know", "He not know", "He knowing"], "answer": 1},
            {"id": "v7", "question": '"Bite the bullet" means:', "options": ["Shoot someone", "Endure pain", "Eat quickly", "Talk too much"], "answer": 1},
            {"id": "v8", "question": "Antonym of LOQUACIOUS:", "options": ["Talkative", "Quiet", "Loud", "Clever"], "answer": 1},
            {"id": "v9", "question": "Fill in: Neither John nor his brothers _____ attending.", "options": ["is", "are", "was", "be"], "answer": 1},
            {"id": "v10", "question": "Choose the synonym of OBSTINATE:", "options": ["Flexible", "Stubborn", "Kind", "Weak"], "answer": 1},
            {"id": "v11", "question": 'Correct the sentence: "He is more cleverer than you."', "options": ["He is more clever than you", "He is cleverer than you", "He is most clever than you", "No change needed"], "answer": 1},
            {"id": "v12", "question": '"A blessing in disguise" means:', "options": ["A hidden curse", "Something good that seemed bad", "A lie told kindly", "A secret kept well"], "answer": 1},
            {"id": "v13", "question": 'The plural of "phenomenon" is:', "options": ["Phenomenons", "Phenomenas", "Phenomena", "Phenomenon"], "answer": 2},
            {"id": "v14", "question": "Fill: I wish I _____ a millionaire.", "options": ["am", "are", "were", "was"], "answer": 2}
        ]
    },
    {
        "section": "Quantitative",
        "icon": "🔢",
        "questions": [
            {"id": "q0", "question": "A train 150m long passes a pole in 15 seconds. Its speed in km/h is:", "options": ["36", "40", "54", "60"], "answer": 0},
            {"id": "q1", "question": "The sum of first 20 natural numbers is:", "options": ["190", "200", "210", "220"], "answer": 2},
            {"id": "q2", "question": "If 8 workers build a wall in 10 days, how many days will 4 workers take?", "options": ["5", "15", "20", "25"], "answer": 2},
            {"id": "q3", "question": "A number increased by 20% then decreased by 20%. Net change is:", "options": ["0%", "4% decrease", "4% increase", "2% decrease"], "answer": 1},
            {"id": "q4", "question": "What is 15% of 480?", "options": ["62", "68", "72", "78"], "answer": 2},
            {"id": "q5", "question": "Simple interest on Rs.4000 at 10% per annum for 3 years is:", "options": ["Rs.1000", "Rs.1200", "Rs.1400", "Rs.1600"], "answer": 1},
            {"id": "q6", "question": "A tank is filled in 6 hours by pipe A alone. In 9 hours by pipe B alone. In how many hours both together?", "options": ["3.6", "4", "4.5", "5"], "answer": 0},
            {"id": "q7", "question": "If a product costs Rs.200 with 10% discount, what is MRP?", "options": ["Rs.220", "Rs.222", "Rs.250", "Rs.200"], "answer": 1},
            {"id": "q8", "question": "LCM of 12 and 18 is:", "options": ["6", "36", "24", "72"], "answer": 1},
            {"id": "q9", "question": "Profit percent if CP=Rs.400 and SP=Rs.500:", "options": ["20%", "25%", "30%", "15%"], "answer": 1},
            {"id": "q10", "question": "A can finish work in 20 days, B in 30 days. Together they finish in:", "options": ["10", "12", "15", "25"], "answer": 1},
            {"id": "q11", "question": "The HCF of 16, 24, 36 is:", "options": ["2", "4", "6", "8"], "answer": 1},
            {"id": "q12", "question": "Speed of a boat downstream is 18 km/h, upstream 12 km/h. Speed of stream is:", "options": ["2 km/h", "3 km/h", "6 km/h", "5 km/h"], "answer": 1},
            {"id": "q13", "question": "Compound interest on Rs.1000 at 10% per year for 2 years is:", "options": ["Rs.200", "Rs.210", "Rs.220", "Rs.230"], "answer": 1},
            {"id": "q14", "question": "A circle has diameter 14 cm. Its area is:", "options": ["154 cm²", "144 cm²", "196 cm²", "168 cm²"], "answer": 0}
        ]
    },
    {
        "section": "Technical",
        "icon": "💻",
        "questions": [
            {"id": "t0", "question": "What does CPU stand for?", "options": ["Central Processing Unit", "Control Processing Unit", "Central Program Unit", "Core Processing Unit"], "answer": 0},
            {"id": "t1", "question": "Which data structure works on LIFO principle?", "options": ["Queue", "Stack", "Array", "Tree"], "answer": 1},
            {"id": "t2", "question": "What is the time complexity of binary search?", "options": ["O(n)", "O(n²)", "O(log n)", "O(n log n)"], "answer": 2},
            {"id": "t3", "question": "Which of the following is NOT an OOP concept?", "options": ["Inheritance", "Polymorphism", "Compilation", "Encapsulation"], "answer": 2},
            {"id": "t4", "question": "What does HTTP stand for?", "options": ["HyperText Transfer Protocol", "High Text Transfer Protocol", "HyperText Transmission Protocol", "HyperText Transport Protocol"], "answer": 0},
            {"id": "t5", "question": "Which language is primarily used for Android app development?", "options": ["Swift", "Kotlin", "Python", "Ruby"], "answer": 1},
            {"id": "t6", "question": "What is the output of: print(2 ** 10) in Python?", "options": ["20", "100", "1024", "2048"], "answer": 2},
            {"id": "t7", "question": "What does SQL stand for?", "options": ["Structured Query Language", "Simple Query Language", "Sequential Query Language", "Standard Query Language"], "answer": 0},
            {"id": "t8", "question": "What is a primary key in a database?", "options": ["A key used to encrypt data", "A unique identifier for each record", "A foreign reference to another table", "A key that can be null"], "answer": 1},
            {"id": "t9", "question": "Which of these is a NoSQL database?", "options": ["MySQL", "PostgreSQL", "MongoDB", "SQLite"], "answer": 2},
            {"id": "t10", "question": "What is Git used for?", "options": ["Graphic design", "Version control", "Network management", "Database queries"], "answer": 1},
            {"id": "t11", "question": "What does RAM stand for?", "options": ["Read Access Memory", "Random Access Memory", "Read And Modify", "Rapid Access Module"], "answer": 1},
            {"id": "t12", "question": "Which protocol is used to send emails?", "options": ["HTTP", "FTP", "SMTP", "TCP"], "answer": 2},
            {"id": "t13", "question": "What is the binary equivalent of decimal 10?", "options": ["1001", "1010", "1100", "1110"], "answer": 1},
            {"id": "t14", "question": "Which sorting algorithm has O(n log n) average time complexity?", "options": ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], "answer": 2}
        ]
    }
]

coding_problems = [
    {
        "id": 0,
        "title": "Reverse a String",
        "difficulty": "Easy",
        "description": 'Write a function that takes a string and returns it reversed.\n\nExample:\nInput: "hello"\nOutput: "olleh"',
        "testCases": [
            {"input": '"hello"', "expected": '"olleh"'},
            {"input": '"a"', "expected": '"a"'},
            {"input": '"algorithm"', "expected": '"mhtirogla"'}
        ],
        "starterCode": {
            "python": "def reverse_string(s):\n    # Write your solution here\n    pass\n\nprint(reverse_string(\"hello\"))",
            "javascript": "function reverseString(s) {\n  // Write your solution here\n}\n\nconsole.log(reverseString(\"hello\"));",
            "java": "public class Solution {\n  public static String reverseString(String s) {\n    return \"\";\n  }\n  public static void main(String[] args) {\n    System.out.println(reverseString(\"hello\"));\n  }\n}",
            "cpp": "#include<iostream>\n#include<string>\nusing namespace std;\n\nstring reverseString(string s) {\n  return \"\";\n}\n\nint main() { cout << reverseString(\"hello\"); }",
            "c": "#include<stdio.h>\nvoid reverseString(char* s) { /* Write here */ }\nint main() { char s[]=\"hello\"; reverseString(s); printf(\"%s\",s); }",
            "go": "package main\nimport \"fmt\"\nfunc reverseString(s string) string { return \"\" }\nfunc main() { fmt.Println(reverseString(\"hello\")) }"
        }
    },
    {
        "id": 1,
        "title": "FizzBuzz",
        "difficulty": "Easy",
        "description": 'Print numbers 1 to n. Multiples of 3: "Fizz", multiples of 5: "Buzz", multiples of both: "FizzBuzz".\n\nExample: Input n=15 -> 1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz',
        "testCases": [
            {"input": "3", "expected": '"1 2 Fizz"'},
            {"input": "5", "expected": '"1 2 Fizz 4 Buzz"'},
            {"input": "15", "expected": '"1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz"'}
        ],
        "starterCode": {
            "python": "def fizzbuzz(n):\n    pass\n\nfizzbuzz(15)",
            "javascript": "function fizzbuzz(n) {\n  // Write here\n}\nfizzbuzz(15);",
            "java": "public class Solution {\n  public static void fizzbuzz(int n) { }\n  public static void main(String[] args) { fizzbuzz(15); }\n}",
            "cpp": "#include<iostream>\nusing namespace std;\nvoid fizzbuzz(int n) { }\nint main() { fizzbuzz(15); }",
            "c": "#include<stdio.h>\nvoid fizzbuzz(int n) { }\nint main() { fizzbuzz(15); }",
            "go": "package main\nfunc fizzbuzz(n int) { }\nfunc main() { fizzbuzz(15) }"
        }
    },
    {
        "id": 2,
        "title": "Two Sum",
        "difficulty": "Medium",
        "description": "Given an array of integers and a target, return indices of two numbers that add up to target.\n\nExample:\nInput: nums=[2,7,11,15], target=9\nOutput: [0,1]",
        "testCases": [
            {"input": "nums = [2,7,11,15], target = 9", "expected": "[0,1]"},
            {"input": "nums = [3,2,4], target = 6", "expected": "[1,2]"},
            {"input": "nums = [3,3], target = 6", "expected": "[0,1]"}
        ],
        "starterCode": {
            "python": "def two_sum(nums, target):\n    pass\n\nprint(two_sum([2,7,11,15], 9))",
            "javascript": "function twoSum(nums, target) {\n  // Write here\n}\nconsole.log(twoSum([2,7,11,15], 9));",
            "java": "public class Solution {\n  public static int[] twoSum(int[] nums, int target) { return new int[]{}; }\n  public static void main(String[] args) { int[] r=twoSum(new int[]{2,7,11,15},9); System.out.println(r[0]+\", \"+r[1]); }\n}",
            "cpp": "#include<iostream>\n#include<vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums,int target) { return {}; }\nint main() { vector<int> n={2,7,11,15}; auto r=twoSum(n,9); cout<<r[0]<<\",\"<<r[1]; }",
            "c": "#include<stdio.h>\nvoid twoSum(int* nums,int n,int target) { }\nint main() { int n[]={2,7,11,15}; twoSum(n,4,9); }",
            "go": "package main\nimport \"fmt\"\nfunc twoSum(nums []int,target int) []int { return nil }\nfunc main() { fmt.Println(twoSum([]int{2,7,11,15},9)) }"
        }
    },
    {
        "id": 3,
        "title": "Check Palindrome",
        "difficulty": "Easy",
        "description": "Write a function to check if a given string is a palindrome.\n\nExample:\nInput: \"racecar\" -> true\nInput: \"hello\" -> false",
        "testCases": [
            {"input": '"racecar"', "expected": "true"},
            {"input": '"hello"', "expected": "false"},
            {"input": '"abacaba"', "expected": "true"}
        ],
        "starterCode": {
            "python": "def is_palindrome(s):\n    pass\n\nprint(is_palindrome(\"racecar\"))",
            "javascript": "function isPalindrome(s) {\n  // Write here\n}\nconsole.log(isPalindrome(\"racecar\"));",
            "java": "public class Solution {\n  public static boolean isPalindrome(String s) { return false; }\n  public static void main(String[] args) { System.out.println(isPalindrome(\"racecar\")); }\n}",
            "cpp": "#include<iostream>\n#include<string>\nusing namespace std;\nbool isPalindrome(string s) { return false; }\nint main() { cout<<isPalindrome(\"racecar\"); }",
            "c": "#include<stdio.h>\nint isPalindrome(char* s) { return 0; }\nint main() { printf(\"%d\",isPalindrome(\"racecar\")); }",
            "go": "package main\nimport \"fmt\"\nfunc isPalindrome(s string) bool { return false }\nfunc main() { fmt.Println(isPalindrome(\"racecar\")) }"
        }
    },
    {
        "id": 4,
        "title": "Find Maximum in Array",
        "difficulty": "Easy",
        "description": "Write a function that returns the maximum element in an array.\n\nExample:\nInput: [3,1,4,1,5,9,2,6]\nOutput: 9",
        "testCases": [
            {"input": "[3,1,4,1,5,9,2,6]", "expected": "9"},
            {"input": "[-1,-5,-3]", "expected": "-1"},
            {"input": "[10]", "expected": "10"}
        ],
        "starterCode": {
            "python": "def find_max(arr):\n    pass\n\nprint(find_max([3,1,4,1,5,9,2,6]))",
            "javascript": "function findMax(arr) {\n  // Write here\n}\nconsole.log(findMax([3,1,4,1,5,9,2,6]));",
            "java": "public class Solution {\n  public static int findMax(int[] arr) { return 0; }\n  public static void main(String[] args) { System.out.println(findMax(new int[]{3,1,4,1,5,9,2,6})); }\n}",
            "cpp": "#include<iostream>\n#include<vector>\nusing namespace std;\nint findMax(vector<int>& arr) { return 0; }\nint main() { vector<int> a={3,1,4,1,5,9,2,6}; cout<<findMax(a); }",
            "c": "#include<stdio.h>\nint findMax(int* arr,int n) { return 0; }\nint main() { int a[]={3,1,4,1,5,9,2,6}; printf(\"%d\",findMax(a,8)); }",
            "go": "package main\nimport \"fmt\"\nfunc findMax(arr []int) int { return 0 }\nfunc main() { fmt.Println(findMax([]int{3,1,4,1,5,9,2,6})) }"
        }
    }
]

# ── Pydantic Request Models ───────────────────────────────────────────────────

class FromSkillsRequest(BaseModel):
    skills: List[str]
    questionCount: Optional[int] = 5

class SubmitInterviewRequest(BaseModel):
    topic: str = "mixed"
    answers: List[dict]  # list of {questionId, question, answer}
    questions: Union[List[dict], dict] = None

class AptitudeSubmitRequest(BaseModel):
    answers: dict  # {questionId: selected_index}
    questions: List[dict] = None

class EvaluateCodeRequest(BaseModel):
    code: str
    language: str
    problem: str
    runOnly: bool = False
    testCases: List[dict] = None

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    resume: str = None
    interviewId: str
    keywords: List[str] = None
    expectedAnswer: str = None

class CompleteTechnicalRequest(BaseModel):
    interviewId: str

class SaveSessionRequest(BaseModel):
    aptitudeResult: dict = None
    codingResult: dict = None
    technicalResult: dict = None
    overallScore: dict = None
    violations: int = 0
    disqualified: bool = False

class InviteRequest(BaseModel):
    toEmail: str
    roomId: str
    studentName: str = None

class AptitudeEmailRequest(BaseModel):
    aptitudeResult: dict

class CodingEmailRequest(BaseModel):
    codingResult: dict


# ── Helper for String evaluation ──────────────────────────────────────────────

def evaluate_answer_local(question: str, answer: str, custom_keywords: list = None) -> dict:
    answer_lower = answer.lower()
    score = 0
    feedback = ""

    keywords = custom_keywords
    if not keywords or not len(keywords):
        keyword_map = {
            "var, let, and const": ["scope", "hoisting", "block", "function", "reassign", "const"],
            "closures": ["function", "scope", "variable", "inner", "outer", "access"],
            "rest api": ["http", "endpoint", "get", "post", "request", "response", "json"],
            "virtual dom": ["virtual", "real", "diff", "update", "render", "performance"],
            "sql and nosql": ["schema", "flexible", "document", "relational", "scale"],
            "git": ["version", "control", "commit", "branch", "merge", "track"]
        }

        keywords = ["good", "understand", "use", "work", "experience"]
        for key, kws in keyword_map.items():
            if key in question.lower():
                keywords = kws
                break

    matched = [kw for kw in keywords if kw.lower() in answer_lower]
    score = min(10, round((len(matched) / len(keywords)) * 10) + 3) if keywords else 5

    if len(answer) < 20:
        score = 2
        feedback = "Answer too short. Please elaborate more."
    elif score >= 8:
        feedback = "Excellent answer! Very well explained."
    elif score >= 5:
        feedback = f"Good attempt! Try to also mention: {', '.join(keywords[:2])}"
    else:
        feedback = f"Needs improvement. Key concepts: {', '.join(keywords[:3])}"

    return {"score": score, "feedback": feedback, "matched": matched}

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/questions/from-skills")
def get_questions_from_skills(req: FromSkillsRequest, current_user: dict = Depends(get_current_user)):
    count = req.questionCount or 5
    all_questions = []
    used_topics = set()

    for skill in req.skills:
        topic = skill_topic_map.get(skill.lower())
        if topic and topic not in used_topics and topic in skill_questions:
            used_topics.add(topic)
            topic_qs = skill_questions[topic]
            for q in topic_qs:
                all_questions.append({"q": q["q"], "topic": topic, "keywords": q["keywords"]})

    for q in skill_questions["hr"]:
        all_questions.append({"q": q["q"], "topic": "hr", "keywords": q["keywords"]})

    for q in skill_questions["dsa"]:
        all_questions.append({"q": q["q"], "topic": "dsa", "keywords": q["keywords"]})

    # If we have less than required count, fill from other technical topics
    if len(all_questions) < count:
        for topic, qs in skill_questions.items():
            if topic not in ["hr", "dsa"] and topic not in used_topics:
                for q in qs:
                    all_questions.append({"q": q["q"], "topic": topic, "keywords": q["keywords"]})

    random.shuffle(all_questions)
    final_questions = all_questions[:count]

    result = []
    for i, q in enumerate(final_questions):
        result.append({
            "id": i,
            "question": q["q"],
            "topic": q["topic"],
            "keywords": q["keywords"]
        })

    return {
        "questions": result,
        "totalQuestions": len(result),
        "topicsCovered": list(used_topics)
    }


@router.get("/questions/{topic}")
def get_questions_by_topic(topic: str, current_user: dict = Depends(get_current_user)):
    questions = skill_questions.get(topic.lower())
    if not questions:
        raise HTTPException(status_code=404, detail="Topic not found")

    question_list = [{"id": i, "question": q["q"], "topic": topic} for i, q in enumerate(questions)]
    return {"topic": topic, "questions": question_list}


@router.post("/submit")
def submit_interview(req: SubmitInterviewRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    total_score = 0
    evaluated = []

    for ans in req.answers:
        q_id = ans.get("questionId", 0)
        q_text = ans.get("question", "Question")
        user_ans = ans.get("answer", "")

        keywords = []
        if req.questions and isinstance(req.questions, list) and q_id < len(req.questions):
            keywords = req.questions[q_id].get("keywords", [])
        elif req.questions and isinstance(req.questions, dict):
            # Questions passed as string/dict map
            keywords = req.questions.get(str(q_id), {}).get("keywords", [])
        else:
            # Fallback local lookup
            topic_key = req.topic if req.topic in skill_questions else "hr"
            q_bank = skill_questions.get(topic_key, skill_questions["hr"])
            matched_q = next((q for q in q_bank if q["q"] == q_text), None)
            if matched_q:
                keywords = matched_q.get("keywords", [])
            else:
                keywords = q_bank[q_id % len(q_bank)].get("keywords", [])

        user_answer_lower = user_ans.lower()
        matched_kws = [kw for kw in keywords if kw.lower() in user_answer_lower]

        score = round((len(matched_kws) / len(keywords)) * 10) if keywords else 5
        total_score += score

        feedback = ""
        if score >= 8:
            feedback = "Excellent answer! Well explained."
        elif score >= 5:
            feedback = f"Good attempt! Also mention: {', '.join(keywords[:2])}"
        elif score >= 2:
            feedback = f"Needs improvement. Key points: {', '.join(keywords[:3])}"
        else:
            feedback = f"Try again. Focus on: {', '.join(keywords[:3])}"

        evaluated.append({
            "question": q_text,
            "userAnswer": user_ans,
            "score": score,
            "maxScore": 10,
            "feedback": feedback,
            "matchedKeywords": matched_kws
        })

    avg_score = round(total_score / len(req.answers)) if req.answers else 0

    interview = Interview(
        user_id=current_user["id"],
        topic=req.topic,
        questions=evaluated,
        total_score=avg_score,
        total_questions=len(req.answers),
        completed_at=datetime.utcnow()
    )
    db.add(interview)
    db.commit()

    return {
        "message": "Interview completed!",
        "topic": req.topic,
        "totalScore": avg_score,
        "maxScore": 10,
        "totalQuestions": len(req.answers),
        "results": evaluated
    }


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user["id"])
        .order_by(Interview.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": i.id,
            "topic": i.topic,
            "questions": i.questions,
            "totalScore": i.total_score,
            "totalQuestions": i.total_questions,
            "completedAt": i.completed_at
        } for i in interviews
    ]


@router.post("/aptitude")
def generate_aptitude(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Read dynamic aptitude questions added by admin
    dynamic_qs = db.query(AptitudeQuestion).all()

    sections = []
    for sec in aptitude_sections:
        matching_dynamic = [
            {
                "id": str(dq.id),
                "question": dq.question,
                "options": dq.options,
                "answer": dq.answer,
                "section": dq.section
            }
            for dq in dynamic_qs if dq.section.lower() == sec["section"].lower()
        ]

        # Combine default local ones and dynamic DB ones
        static_formatted = [
            {
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "answer": q["answer"],
                "section": sec["section"]
            }
            for q in sec["questions"]
        ]

        combined = static_formatted + matching_dynamic
        random.shuffle(combined)

        sections.append({
            "section": sec["section"],
            "icon": sec["icon"],
            "questions": combined
        })

    total_qs = sum(len(sec["questions"]) for sec in sections)
    return {
        "sections": sections,
        "totalSections": len(sections),
        "totalQuestions": total_qs
    }


@router.post("/aptitude/submit")
def submit_aptitude(req: AptitudeSubmitRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    flat_qbank = []
    if req.questions and len(req.questions) > 0:
        flat_qbank = req.questions
    else:
        for sec in aptitude_sections:
            for q in sec["questions"]:
                flat_qbank.append({
                    "id": q["id"],
                    "question": q["question"],
                    "options": q["options"],
                    "answer": q["answer"],
                    "section": sec["section"]
                })

    correct = 0
    category_scores = {}
    results = []

    for q in flat_qbank:
        q_id_str = str(q["id"])
        selected = req.answers.get(q_id_str, -1)

        selected_num = int(selected)
        correct_num = int(q["answer"])
        is_correct = (selected_num != -1 and selected_num == correct_num)

        if is_correct:
            correct += 1

        cat = q.get("section", "General")
        if cat not in category_scores:
            category_scores[cat] = {"correct": 0, "total": 0}
        category_scores[cat]["total"] += 1
        if is_correct:
            category_scores[cat]["correct"] += 1

        results.append({
            "id": q["id"],
            "category": cat,
            "question": q["question"],
            "selected": selected_num,
            "correctAnswer": correct_num,
            "correctOption": q["options"][correct_num] if correct_num < len(q["options"]) else "",
            "isCorrect": is_correct
        })

    total_score = round((correct / len(flat_qbank)) * 100) if flat_qbank else 0

    # Save to history & trigger email notifications (fire-and-forget)
    user_db = db.query(User).filter(User.id == current_user["id"]).first()
    if user_db:
        # Save Interview topic=aptitude
        apt_interview = Interview(
            user_id=user_db.id,
            topic="Aptitude",
            questions=[],  # metadata
            total_score=total_score,
            total_questions=len(flat_qbank),
            completed_at=datetime.utcnow()
        )
        db.add(apt_interview)
        db.commit()

        # Send email and notify
        async def send_email_async():
            try:
                send_aptitude_result(user_db.email, user_db.name, {
                    "totalScore": total_score,
                    "correct": correct,
                    "total": len(flat_qbank),
                    "categoryScores": category_scores
                })
            except Exception as e:
                print("Failed to send aptitude email:", e)

        notify(
            db,
            user_db.id,
            "aptitude",
            "Aptitude Test Completed",
            f"You scored {total_score}% ({correct}/{len(flat_qbank)} correct) in the aptitude assessment.",
            send_email_async
        )

    return {
        "correct": correct,
        "total": len(flat_qbank),
        "totalScore": total_score,
        "categoryScores": category_scores,
        "results": results
    }


@router.get("/coding-problems")
def get_coding_problems(current_user: dict = Depends(get_current_user)):
    return {"problems": coding_problems}


@router.post("/evaluate-code")
async def evaluate_code(req: EvaluateCodeRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured in backend .env")

    # Call GROQ for Leetcode evaluation
    run_only = req.runOnly
    test_cases_str = json.dumps(req.testCases or [], indent=2)

    format_instruction = (
        "Respond ONLY with a valid JSON object (no markdown block, no explanation, no ```json wrapper), in this exact format:\n{\n  \"verdict\": \"Accepted\",\n  \"testCases\": [\n    { \"input\": \"input_val\", \"expected\": \"expected_val\", \"actual\": \"actual_val\", \"status\": \"Pass\" }\n  ]\n}"
        if run_only
        else
        "Respond ONLY with a valid JSON object (no markdown block, no explanation, no ```json wrapper), in this exact format:\n{\n  \"score\": 10,\n  \"verdict\": \"Accepted\",\n  \"testCases\": [\n    { \"input\": \"input_val\", \"expected\": \"expected_val\", \"actual\": \"actual_val\", \"status\": \"Pass\" }\n  ],\n  \"feedback\": \"2-3 sentence feedback explaining correctness and efficiency.\",\n  \"hints\": \"One actionable hint for improvement.\",\n  \"timeComplexity\": \"O(n)\"\n}"
    )

    prompt = f"""You are a LeetCode-style code executor and evaluator. You must evaluate the user's code against the provided test cases.

Problem Description:
{req.problem}

User Code:
```{req.language}
{req.code}
```

Test Cases to run:
{test_cases_str}

For each test case:
1. Trace the execution of the user's code with the given input.
2. Determine the actual output of the user's code.
3. Compare the actual output with the expected output (ignoring minor whitespace differences).
4. Mark it as 'Pass' or 'Fail'.

{format_instruction}"""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                },
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 2048
                }
            )

            if res.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Groq API error: {res.text}")

            groq_data = res.json()
            raw = groq_data["choices"][0]["message"]["content"].strip()
            # Strip markdown code fences
            import re as _re
            raw = _re.sub(r'^```json\s*', '', raw, flags=_re.IGNORECASE)
            raw = _re.sub(r'^```\s*', '', raw)
            raw = _re.sub(r'```\s*$', '', raw).strip()

            # Attempt to extract the first complete JSON object if Groq adds trailing text
            try:
                evaluation = json.loads(raw)
            except Exception:
                # Try extracting just the JSON object portion
                json_match = _re.search(r'\{.*\}', raw, _re.DOTALL)
                if json_match:
                    try:
                        evaluation = json.loads(json_match.group())
                    except Exception:
                        evaluation = {
                            "score": 5,
                            "verdict": "Partial",
                            "testCases": [{"input": tc.get("input"), "expected": tc.get("expected"), "actual": "N/A", "status": "Pass"} for tc in (req.testCases or [])],
                            "feedback": raw[:500],
                            "hints": "",
                            "timeComplexity": "N/A"
                        }
                else:
                    evaluation = {
                        "score": 5,
                        "verdict": "Reviewed",
                        "testCases": [{"input": tc.get("input"), "expected": tc.get("expected"), "actual": "N/A", "status": "Pass"} for tc in (req.testCases or [])],
                        "feedback": raw[:500],
                        "hints": "",
                        "timeComplexity": "N/A"
                    }

        # Persist report if not just dry run
        if not run_only:
            passed = len([tc for tc in evaluation.get("testCases", []) if tc.get("status") == "Pass"])
            total_tc = len(evaluation.get("testCases", []))

            # Match title
            matched = next((p for p in coding_problems if p["description"] == req.problem), None)
            problem_title = matched["title"] if matched else "Unknown"
            problem_id = matched["id"] if matched else -1

            report = CodingReport(
                user_id=current_user["id"],
                problem_id=problem_id,
                problem_title=problem_title,
                language=req.language,
                code=req.code,
                score=evaluation.get("score", 0),
                verdict=evaluation.get("verdict", ""),
                test_cases_passed=passed,
                test_cases_total=total_tc,
                test_case_results=evaluation.get("testCases", []),
                feedback=evaluation.get("feedback", ""),
                hints=evaluation.get("hints", ""),
                time_complexity=evaluation.get("timeComplexity", "")
            )
            db.add(report)
            db.commit()

            # Email notification
            user_db = db.query(User).filter(User.id == current_user["id"]).first()
            if user_db:
                async def coding_email_async():
                    try:
                        send_coding_report(user_db.email, user_db.name, {
                            "problemTitle": problem_title,
                            "language": req.language,
                            "score": evaluation.get("score", 0),
                            "verdict": evaluation.get("verdict", ""),
                            "testCasesPassed": passed,
                            "testCasesTotal": total_tc,
                            "testCaseResults": evaluation.get("testCases", []),
                            "feedback": evaluation.get("feedback", ""),
                            "hints": evaluation.get("hints", ""),
                            "timeComplexity": evaluation.get("timeComplexity", "")
                        })
                    except Exception as e:
                        print("Failed to send coding report email:", e)

                notify(
                    db,
                    user_db.id,
                    "coding",
                    "Coding Assessment Completed",
                    f"{problem_title} evaluated. Score: {evaluation.get('score', 0)}/10. Verdict: {evaluation.get('verdict', 'N/A')}.",
                    coding_email_async
                )

        return evaluation
    except HTTPException:
        raise
    except Exception as e:
        print(f"[evaluate-code] Unexpected error: {e}")
        # Return a safe fallback so the frontend doesn't show a generic error
        return {
            "score": 0,
            "verdict": "Error",
            "testCases": [{"input": tc.get("input", ""), "expected": tc.get("expected", ""), "actual": "Execution error", "status": "Fail"} for tc in (req.testCases or [])],
            "feedback": f"Code evaluation encountered an error: {str(e)}",
            "hints": "Check your syntax and try again.",
            "timeComplexity": "N/A"
        }


@router.post("/evaluate")
async def evaluate_interview_answer_route(req: EvaluateAnswerRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        evaluation = await evaluate_technical_answer({
            "question": req.question,
            "answer": req.answer,
            "resume": req.resume,
            "interviewId": req.interviewId,
            "userId": current_user["id"],
            "keywords": req.keywords or [],
            "expectedAnswer": req.expectedAnswer
        })

        def norm(val):
            try:
                num = float(val)
                return max(0.0, min(10.0, round(num * 10) / 10))
            except Exception:
                return 0.0

        report = TechnicalInterviewReport(
            user_id=current_user["id"],
            interview_id=req.interviewId,
            question=req.question,
            answer=req.answer,
            technical_score=norm(evaluation.get("technicalScore", 0)),
            communication_score=norm(evaluation.get("communicationScore", 0)),
            grammar_score=norm(evaluation.get("grammarScore", 0)),
            confidence_score=norm(evaluation.get("confidenceScore", 0)),
            keyword_score=norm(evaluation.get("keywordScore", 0)),
            overall_score=norm(evaluation.get("overallScore", 0)),
            feedback=evaluation.get("feedback", ""),
            strength=evaluation.get("strength", ""),
            weakness=evaluation.get("weakness", ""),
            recommendation=evaluation.get("recommendation", "")
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return {
            "reportId": report.id,
            "interviewId": report.interview_id,
            "technicalScore": report.technical_score,
            "communicationScore": report.communication_score,
            "grammarScore": report.grammar_score,
            "confidenceScore": report.confidence_score,
            "keywordScore": report.keyword_score,
            "keywordMatch": evaluation.get("keywordMatch", round(report.keyword_score * 10)),
            "overallScore": report.overall_score,
            "feedback": report.feedback,
            "strength": report.strength,
            "weakness": report.weakness,
            "recommendation": report.recommendation,
            "matchedKeywords": evaluation.get("matchedKeywords", []),
            "missingKeywords": evaluation.get("missingKeywords", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Technical evaluation failed: {str(e)}")


@router.post("/evaluate/complete")
async def complete_technical_interview_route(req: CompleteTechnicalRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        reports = (
            db.query(TechnicalInterviewReport)
            .filter(
                TechnicalInterviewReport.user_id == current_user["id"],
                TechnicalInterviewReport.interview_id == req.interviewId
            )
            .order_by(TechnicalInterviewReport.created_at.asc())
            .all()
        )

        if not reports:
            raise HTTPException(status_code=400, detail="No answers found for this session")

        evaluations = [
            {
                "technicalScore": r.technical_score,
                "communicationScore": r.communication_score,
                "grammarScore": r.grammar_score,
                "confidenceScore": r.confidence_score,
                "keywordScore": r.keyword_score,
                "overallScore": r.overall_score
            }
            for r in reports
        ]

        summary = await summarize_technical_interview(evaluations)

        # Standalone technical email
        user_db = db.query(User).filter(User.id == current_user["id"]).first()
        if user_db:
            async def tech_email_async():
                try:
                    send_technical_interview_report(user_db.email, user_db.name, {
                        **summary,
                        "reports": reports
                    })
                except Exception as e:
                    print("Failed to send technical report email:", e)

            # Save consolidated InterviewReport
            def avg_val(field):
                vals = [getattr(r, field) for r in reports if getattr(r, field) is not None]
                return round((sum(vals) / len(vals)) * 10) / 10 if vals else 0.0

            recom = summary.get("recommendations", "")
            if isinstance(recom, list):
                recom = " ".join(recom)

            consolidated = InterviewReport(
                user_id=current_user["id"],
                interview_id=req.interviewId,
                interview_type="Technical",
                questions=[r.question for r in reports],
                answers=[r.answer for r in reports],
                ai_feedback=[r.feedback for r in reports if r.feedback],
                strengths=[r.strength for r in reports if r.strength],
                weaknesses=[r.weakness for r in reports if r.weakness],
                technical_score=avg_val("technical_score"),
                problem_solving_score=avg_val("technical_score"),
                communication_score=avg_val("communication_score"),
                overall_score=avg_val("overall_score"),
                recommendation=recom,
                duration=0,
                created_by_ai=True
            )
            db.add(consolidated)
            db.commit()

            notify(
                db,
                user_db.id,
                "technical_interview",
                "Technical Interview Completed",
                f"You completed a technical interview session ({len(reports)} questions). Overall score: {summary.get('overallScore', 0)}/10.",
                tech_email_async
            )

        return {
            "interviewId": req.interviewId,
            "totalQuestions": len(reports),
            "summary": summary,
            "reports": [
                {
                    "question": r.question,
                    "answer": r.answer,
                    "overallScore": r.overall_score,
                    "feedback": r.feedback
                }
                for r in reports
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/technical-stats")
def get_technical_stats(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = (
        db.query(TechnicalInterviewReport)
        .filter(TechnicalInterviewReport.user_id == current_user["id"])
        .order_by(TechnicalInterviewReport.created_at.desc())
        .all()
    )

    interview_map = {}
    for r in reports:
        if r.interview_id not in interview_map:
            interview_map[r.interview_id] = []
        interview_map[r.interview_id].append(r)

    interviews = []
    for int_id, items in interview_map.items():
        avg = sum(i.overall_score for i in items) / len(items)
        last_date = max(i.created_at for i in items)
        interviews.append({
            "interviewId": int_id,
            "overallScore": round(avg * 10) / 10,
            "questionCount": len(items),
            "lastInterviewDate": last_date
        })

    interviews.sort(key=lambda x: x["lastInterviewDate"], reverse=True)
    avg_score = sum(i["overallScore"] for i in interviews) / len(interviews) if interviews else 0.0

    return {
        "recent": interviews[0] if interviews else None,
        "averageScore": round(avg_score * 10) / 10,
        "totalInterviews": len(interviews)
    }


@router.get("/coding-stats")
def get_coding_stats(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = (
        db.query(CodingReport)
        .filter(CodingReport.user_id == current_user["id"])
        .order_by(CodingReport.created_at.desc())
        .all()
    )

    if not reports:
        return {"recent": None, "averageScore": 0, "totalTests": 0}

    total_score = sum(r.score for r in reports)
    avg_score = round((total_score / len(reports)) * 10) / 10
    recent = reports[0]

    return {
        "recent": {
            "problemTitle": recent.problem_title,
            "language": recent.language,
            "score": recent.score,
            "verdict": recent.verdict,
            "testCasesPassed": recent.test_cases_passed,
            "testCasesTotal": recent.test_cases_total,
            "lastSubmissionDate": recent.created_at
        },
        "averageScore": avg_score,
        "totalTests": len(reports)
    }


@router.post("/session/save")
def save_interview_session(req: SaveSessionRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    apt = req.aptitudeResult or {}
    cod = req.codingResult or {}
    tech = req.technicalResult or {}
    overall = req.overallScore or {"score": 0, "outOf": 150, "percent": 0}

    session = InterviewSession(
        user_id=current_user["id"],
        aptitude_result=apt,
        coding_result=cod,
        technical_result=tech,
        overall_score=overall,
        violations=req.violations,
        disqualified=req.disqualified,
        completed_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Fire email combined result
    user_db = db.query(User).filter(User.id == current_user["id"]).first()
    if user_db and user_db.email:
        async def combined_email_async():
            try:
                send_combined_ai_interview_result(user_db.email, user_db.name, {
                    "aptitude": apt,
                    "coding": cod,
                    "technical": tech,
                    "overall": overall,
                    "violations": req.violations,
                    "disqualified": req.disqualified
                })
            except Exception as e:
                print("Failed to send combined result email:", e)

        asyncio.ensure_future(combined_email_async())

    return {"message": "Session saved", "sessionId": session.id}


@router.post("/send-invite")
def send_invite_route(req: InviteRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    inviter = db.query(User).filter(User.id == current_user["id"]).first()
    inviter_name = inviter.name if inviter else "Interviewer"

    async def invite_email_async():
        try:
            send_room_invite(
                req.toEmail,
                req.roomId,
                req.studentName or req.toEmail,
                inviter_name
            )
        except Exception as e:
            print("Failed to send invite email:", e)

    asyncio.ensure_future(invite_email_async())
    return {"message": "Invitation sent successfully!"}


@router.post("/aptitude/email")
def send_aptitude_email_route(req: AptitudeEmailRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_db = db.query(User).filter(User.id == current_user["id"]).first()
    if not user_db or not user_db.email:
        raise HTTPException(status_code=400, detail="No email found for user")

    async def run_email():
        try:
            send_aptitude_only_result(user_db.email, user_db.name, req.aptitudeResult)
        except Exception as e:
            print("Failed to send aptitude only email:", e)

    asyncio.ensure_future(run_email())
    return {"message": "Aptitude email queued"}


@router.post("/coding/email")
def send_coding_email_route(req: CodingEmailRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_db = db.query(User).filter(User.id == current_user["id"]).first()
    if not user_db or not user_db.email:
        raise HTTPException(status_code=400, detail="No email found for user")

    async def run_email():
        try:
            send_coding_only_result(user_db.email, user_db.name, req.codingResult)
        except Exception as e:
            print("Failed to send coding only email:", e)

    asyncio.ensure_future(run_email())
    return {"message": "Coding email queued"}
