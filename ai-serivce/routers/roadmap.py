from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: List[str]

ROADMAPS = {
    'Frontend Developer': {
        'required_skills': ['html', 'css', 'javascript', 'react', 'typescript', 'git', 'tailwind', 'rest api'],
        'weeks': [
            {'week': 1, 'title': 'HTML & CSS Fundamentals',
             'topics': ['Semantic HTML5', 'CSS Flexbox & Grid', 'Responsive Design', 'CSS Variables'],
             'resources': ['MDN Web Docs', 'CSS-Tricks', 'freeCodeCamp'],
             'project': 'Build a responsive portfolio landing page'},
            {'week': 2, 'title': 'JavaScript Core',
             'topics': ['ES6+ Features', 'DOM Manipulation', 'Events', 'Promises & Async/Await'],
             'resources': ['javascript.info', 'Eloquent JavaScript', 'You Don\'t Know JS'],
             'project': 'Build a todo app with localStorage'},
            {'week': 3, 'title': 'React Basics',
             'topics': ['Components & Props', 'useState & useEffect', 'Event Handling', 'Conditional Rendering'],
             'resources': ['React Official Docs', 'Scrimba React Course', 'Bob Ziroll React'],
             'project': 'Build a weather app using React'},
            {'week': 4, 'title': 'React Advanced',
             'topics': ['React Router', 'Context API', 'Custom Hooks', 'Performance Optimization'],
             'resources': ['React Router Docs', 'Kent C. Dodds Blog', 'Epic React'],
             'project': 'Build a multi-page e-commerce UI'},
            {'week': 5, 'title': 'TypeScript',
             'topics': ['Types & Interfaces', 'Generics', 'TypeScript with React', 'Type Guards'],
             'resources': ['TypeScript Handbook', 'Total TypeScript', 'Matt Pocock Tutorials'],
             'project': 'Convert your React app to TypeScript'},
            {'week': 6, 'title': 'State Management & APIs',
             'topics': ['Redux Toolkit', 'React Query', 'REST API Integration', 'Axios'],
             'resources': ['Redux Toolkit Docs', 'TanStack Query Docs', 'Postman Learning'],
             'project': 'Build a GitHub profile finder app'},
            {'week': 7, 'title': 'Testing & Git',
             'topics': ['Jest Basics', 'React Testing Library', 'Git Branching', 'CI/CD Basics'],
             'resources': ['Jest Docs', 'Testing Library Docs', 'GitHub Actions'],
             'project': 'Add tests to your existing projects'},
            {'week': 8, 'title': 'Deployment & Portfolio',
             'topics': ['Vercel Deployment', 'Netlify', 'Performance Audit', 'SEO Basics'],
             'resources': ['Vercel Docs', 'Lighthouse Docs', 'web.dev'],
             'project': 'Deploy all projects + polish portfolio'},
        ]
    },
    'Backend Developer': {
        'required_skills': ['nodejs', 'express', 'mongodb', 'postgresql', 'rest api', 'docker', 'git'],
        'weeks': [
            {'week': 1, 'title': 'Node.js Fundamentals',
             'topics': ['Node.js Architecture', 'Modules & NPM', 'File System', 'Event Loop'],
             'resources': ['Node.js Docs', 'The Odin Project', 'Traversy Media'],
             'project': 'Build a CLI tool using Node.js'},
            {'week': 2, 'title': 'Express.js & REST APIs',
             'topics': ['Express Setup', 'Routing', 'Middleware', 'Error Handling'],
             'resources': ['Express Docs', 'REST API Design Guide', 'Postman Docs'],
             'project': 'Build a REST API for a blog'},
            {'week': 3, 'title': 'MongoDB & Mongoose',
             'topics': ['MongoDB CRUD', 'Mongoose Schema', 'Relationships', 'Aggregation'],
             'resources': ['MongoDB University', 'Mongoose Docs', 'Atlas Docs'],
             'project': 'Add database to your blog API'},
            {'week': 4, 'title': 'Authentication & Security',
             'topics': ['JWT Auth', 'bcrypt', 'OAuth Basics', 'Rate Limiting'],
             'resources': ['JWT.io', 'OWASP Top 10', 'Passport.js Docs'],
             'project': 'Add auth system to blog API'},
            {'week': 5, 'title': 'PostgreSQL & SQL',
             'topics': ['SQL Basics', 'Joins & Indexes', 'Transactions', 'Sequelize ORM'],
             'resources': ['PostgreSQL Docs', 'SQLZoo', 'Sequelize Docs'],
             'project': 'Build an inventory management API'},
            {'week': 6, 'title': 'Docker & DevOps',
             'topics': ['Docker Basics', 'Dockerfile', 'Docker Compose', 'Environment Variables'],
             'resources': ['Docker Docs', 'Play with Docker', 'TechWorld with Nana'],
             'project': 'Dockerize your Node.js API'},
            {'week': 7, 'title': 'Testing & Performance',
             'topics': ['Jest & Supertest', 'API Testing', 'Caching with Redis', 'Load Testing'],
             'resources': ['Jest Docs', 'k6 Docs', 'Redis University'],
             'project': 'Add tests + Redis caching to API'},
            {'week': 8, 'title': 'Deployment & Cloud',
             'topics': ['AWS EC2 / Render', 'CI/CD Pipeline', 'Monitoring', 'API Documentation'],
             'resources': ['AWS Free Tier', 'Render Docs', 'Swagger/OpenAPI'],
             'project': 'Deploy full API with CI/CD pipeline'},
        ]
    },
    'Full Stack Developer': {
        'required_skills': ['react', 'nodejs', 'mongodb', 'javascript', 'html', 'css', 'git', 'rest api'],
        'weeks': [
            {'week': 1, 'title': 'HTML, CSS & JavaScript',
             'topics': ['Semantic HTML', 'CSS Grid/Flexbox', 'ES6+ JS', 'DOM APIs'],
             'resources': ['MDN Docs', 'javascript.info', 'CSS-Tricks'],
             'project': 'Build a responsive landing page'},
            {'week': 2, 'title': 'React Frontend',
             'topics': ['React Components', 'Hooks', 'React Router', 'State Management'],
             'resources': ['React Docs', 'Scrimba', 'Jack Herrington YouTube'],
             'project': 'Build a React dashboard UI'},
            {'week': 3, 'title': 'Node.js + Express Backend',
             'topics': ['Express APIs', 'Middleware', 'JWT Auth', 'File Uploads'],
             'resources': ['Express Docs', 'Traversy Media', 'Academind'],
             'project': 'Build REST API with authentication'},
            {'week': 4, 'title': 'MongoDB Database',
             'topics': ['Mongoose ODM', 'CRUD Operations', 'Data Modeling', 'Aggregation'],
             'resources': ['MongoDB University', 'Mongoose Docs'],
             'project': 'Connect React + Express + MongoDB'},
            {'week': 5, 'title': 'Full Stack Integration',
             'topics': ['Axios API calls', 'CORS Setup', 'Error Handling', 'Loading States'],
             'resources': ['Axios Docs', 'React Query', 'SWR'],
             'project': 'Build a full stack blog application'},
            {'week': 6, 'title': 'TypeScript + Testing',
             'topics': ['TypeScript Basics', 'React TypeScript', 'Jest', 'API Testing'],
             'resources': ['TypeScript Docs', 'Testing Library', 'Vitest'],
             'project': 'Add TypeScript + tests to project'},
            {'week': 7, 'title': 'Docker + DevOps',
             'topics': ['Docker Compose', 'Multi-container Setup', 'Nginx', 'Environment Config'],
             'resources': ['Docker Docs', 'TechWorld Nana', 'Nginx Docs'],
             'project': 'Dockerize full stack app'},
            {'week': 8, 'title': 'Deployment + Portfolio',
             'topics': ['Vercel + Render Deploy', 'CI/CD', 'Performance', 'GitHub README'],
             'resources': ['Vercel Docs', 'Render Docs', 'GitHub Actions'],
             'project': 'Deploy + publish portfolio'},
        ]
    },
    'Data Scientist': {
        'required_skills': ['python', 'pandas', 'numpy', 'machine learning', 'sql', 'tensorflow', 'scikit-learn'],
        'weeks': [
            {'week': 1, 'title': 'Python for Data Science',
             'topics': ['Python Basics', 'NumPy Arrays', 'Pandas DataFrames', 'Matplotlib'],
             'resources': ['Kaggle Python Course', 'Real Python', 'Corey Schafer YouTube'],
             'project': 'Analyze a public dataset'},
            {'week': 2, 'title': 'Data Analysis & Visualization',
             'topics': ['Seaborn', 'Plotly', 'Data Cleaning', 'EDA Techniques'],
             'resources': ['Kaggle EDA Course', 'Seaborn Docs', 'Towards Data Science'],
             'project': 'Complete EDA on Kaggle dataset'},
            {'week': 3, 'title': 'SQL for Data Science',
             'topics': ['Advanced SQL', 'Window Functions', 'CTEs', 'Query Optimization'],
             'resources': ['Mode SQL Tutorial', 'LeetCode SQL', 'SQLZoo'],
             'project': 'Solve 20 SQL problems on LeetCode'},
            {'week': 4, 'title': 'Machine Learning Basics',
             'topics': ['Scikit-learn', 'Linear/Logistic Regression', 'Decision Trees', 'Model Evaluation'],
             'resources': ['Scikit-learn Docs', 'Andrew Ng ML Course', 'StatQuest YouTube'],
             'project': 'Build a classification model'},
            {'week': 5, 'title': 'Advanced ML Models',
             'topics': ['Random Forest', 'XGBoost', 'Cross Validation', 'Feature Engineering'],
             'resources': ['Kaggle ML Course', 'XGBoost Docs', 'Feature Engineering Book'],
             'project': 'Kaggle competition submission'},
            {'week': 6, 'title': 'Deep Learning',
             'topics': ['Neural Networks', 'TensorFlow/Keras', 'CNN Basics', 'Transfer Learning'],
             'resources': ['TensorFlow Docs', 'Fast.ai', 'deeplearning.ai'],
             'project': 'Build image classification model'},
            {'week': 7, 'title': 'NLP Basics',
             'topics': ['Text Processing', 'NLTK/spaCy', 'Sentiment Analysis', 'Transformers'],
             'resources': ['Hugging Face Course', 'spaCy Docs', 'NLP with Python Book'],
             'project': 'Build sentiment analysis model'},
            {'week': 8, 'title': 'MLOps & Deployment',
             'topics': ['Model Deployment', 'FastAPI for ML', 'Docker for ML', 'Model Monitoring'],
             'resources': ['MLflow Docs', 'FastAPI Docs', 'Made With ML'],
             'project': 'Deploy ML model as REST API'},
        ]
    },
    'DevOps Engineer': {
        'required_skills': ['docker', 'kubernetes', 'aws', 'linux', 'git', 'ci/cd', 'terraform'],
        'weeks': [
            {'week': 1, 'title': 'Linux & Shell Scripting',
             'topics': ['Linux Commands', 'Shell Scripting', 'File Permissions', 'Process Management'],
             'resources': ['Linux Journey', 'The Linux Command Line Book', 'OverTheWire'],
             'project': 'Automate system tasks with bash scripts'},
            {'week': 2, 'title': 'Git & Version Control',
             'topics': ['Git Advanced', 'Branching Strategy', 'GitHub Actions Intro', 'Code Review'],
             'resources': ['Pro Git Book', 'Atlassian Git Tutorials', 'GitHub Docs'],
             'project': 'Set up Git workflow for a team project'},
            {'week': 3, 'title': 'Docker Containerization',
             'topics': ['Docker Architecture', 'Dockerfile Best Practices', 'Docker Compose', 'Registry'],
             'resources': ['Docker Docs', 'Play with Docker', 'TechWorld with Nana'],
             'project': 'Containerize a full stack application'},
            {'week': 4, 'title': 'CI/CD Pipelines',
             'topics': ['GitHub Actions', 'Jenkins Basics', 'Pipeline as Code', 'Automated Testing'],
             'resources': ['GitHub Actions Docs', 'Jenkins Docs', 'DevOps with GitLab'],
             'project': 'Build CI/CD pipeline for Node.js app'},
            {'week': 5, 'title': 'AWS Cloud',
             'topics': ['EC2, S3, RDS', 'IAM & Security', 'Load Balancers', 'CloudWatch'],
             'resources': ['AWS Free Tier', 'AWS Skill Builder', 'A Cloud Guru'],
             'project': 'Deploy app on AWS EC2 with S3'},
            {'week': 6, 'title': 'Kubernetes',
             'topics': ['K8s Architecture', 'Pods & Deployments', 'Services & Ingress', 'Helm Charts'],
             'resources': ['Kubernetes Docs', 'KodeKloud', 'Nana K8s Course'],
             'project': 'Deploy app on Minikube cluster'},
            {'week': 7, 'title': 'Infrastructure as Code',
             'topics': ['Terraform Basics', 'AWS with Terraform', 'Ansible Basics', 'State Management'],
             'resources': ['Terraform Docs', 'HashiCorp Learn', 'Ansible Docs'],
             'project': 'Provision AWS infra with Terraform'},
            {'week': 8, 'title': 'Monitoring & Security',
             'topics': ['Prometheus & Grafana', 'Log Management', 'Security Scanning', 'Cost Optimization'],
             'resources': ['Prometheus Docs', 'Grafana Docs', 'Trivy Security'],
             'project': 'Set up monitoring dashboard'},
        ]
    },
}

def generate_roadmap(target_role: str, current_skills: list) -> dict:
    current_lower = [s.lower() for s in current_skills]
    roadmap_data = ROADMAPS.get(target_role, ROADMAPS['Full Stack Developer'])
    required = roadmap_data['required_skills']
    missing_skills = [s for s in required if s.lower() not in current_lower]
    already_known = [s for s in required if s.lower() in current_lower]
    completion_percentage = round((len(already_known) / len(required)) * 100) if required else 0

    return {
        'target_role': target_role,
        'total_weeks': len(roadmap_data['weeks']),
        'completion_percentage': completion_percentage,
        'already_known': already_known,
        'missing_skills': missing_skills,
        'weeks': roadmap_data['weeks'],
        'message': f'Your personalized {target_role} roadmap is ready!'
    }

@router.post("/generate")
def generate_roadmap_endpoint(data: RoadmapRequest):
    result = generate_roadmap(data.target_role, data.current_skills)
    return result