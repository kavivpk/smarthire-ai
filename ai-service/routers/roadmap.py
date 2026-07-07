from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: List[str]

# ── Helper to build a week entry ─────────────────────────────────────────────
def w(week, title, topics, resources, project):
    return {'week': week, 'title': title, 'topics': topics, 'resources': resources, 'project': project}

# ── ROADMAPS dictionary ───────────────────────────────────────────────────────
ROADMAPS = {}

# ── SOFTWARE DEVELOPMENT ─────────────────────────────────────────────────────
ROADMAPS['Frontend Developer'] = {
    'required_skills': ['html','css','javascript','react','typescript','git','tailwind','rest api'],
    'weeks': [
        w(1,'HTML & CSS Fundamentals',['Semantic HTML5','CSS Flexbox & Grid','Responsive Design','CSS Variables'],['MDN Web Docs','CSS-Tricks','freeCodeCamp'],'Build a responsive portfolio landing page'),
        w(2,'JavaScript Core',['ES6+ Features','DOM Manipulation','Events','Promises & Async/Await'],['javascript.info','Eloquent JavaScript','You Don\'t Know JS'],'Build a todo app with localStorage'),
        w(3,'React Basics',['Components & Props','useState & useEffect','Event Handling','Conditional Rendering'],['React Official Docs','Scrimba React Course','Bob Ziroll React'],'Build a weather app using React'),
        w(4,'React Advanced',['React Router','Context API','Custom Hooks','Performance Optimization'],['React Router Docs','Kent C. Dodds Blog','Epic React'],'Build a multi-page e-commerce UI'),
        w(5,'TypeScript',['Types & Interfaces','Generics','TypeScript with React','Type Guards'],['TypeScript Handbook','Total TypeScript','Matt Pocock Tutorials'],'Convert your React app to TypeScript'),
        w(6,'State Management & APIs',['Redux Toolkit','React Query','REST API Integration','Axios'],['Redux Toolkit Docs','TanStack Query Docs','Postman Learning'],'Build a GitHub profile finder app'),
        w(7,'Testing & Git',['Jest Basics','React Testing Library','Git Branching','CI/CD Basics'],['Jest Docs','Testing Library Docs','GitHub Actions'],'Add tests to your existing projects'),
        w(8,'Deployment & Portfolio',['Vercel Deployment','Netlify','Performance Audit','SEO Basics'],['Vercel Docs','Lighthouse Docs','web.dev'],'Deploy all projects + polish portfolio'),
    ]
}
ROADMAPS['Backend Developer'] = {
    'required_skills': ['nodejs','express','mongodb','postgresql','rest api','docker','git'],
    'weeks': [
        w(1,'Node.js Fundamentals',['Node.js Architecture','Modules & NPM','File System','Event Loop'],['Node.js Docs','The Odin Project','Traversy Media'],'Build a CLI tool using Node.js'),
        w(2,'Express.js & REST APIs',['Express Setup','Routing','Middleware','Error Handling'],['Express Docs','REST API Design Guide','Postman Docs'],'Build a REST API for a blog'),
        w(3,'MongoDB & Mongoose',['MongoDB CRUD','Mongoose Schema','Relationships','Aggregation'],['MongoDB University','Mongoose Docs','Atlas Docs'],'Add database to your blog API'),
        w(4,'Authentication & Security',['JWT Auth','bcrypt','OAuth Basics','Rate Limiting'],['JWT.io','OWASP Top 10','Passport.js Docs'],'Add auth system to blog API'),
        w(5,'PostgreSQL & SQL',['SQL Basics','Joins & Indexes','Transactions','Sequelize ORM'],['PostgreSQL Docs','SQLZoo','Sequelize Docs'],'Build an inventory management API'),
        w(6,'Docker & DevOps',['Docker Basics','Dockerfile','Docker Compose','Environment Variables'],['Docker Docs','Play with Docker','TechWorld with Nana'],'Dockerize your Node.js API'),
        w(7,'Testing & Performance',['Jest & Supertest','API Testing','Caching with Redis','Load Testing'],['Jest Docs','k6 Docs','Redis University'],'Add tests + Redis caching to API'),
        w(8,'Deployment & Cloud',['AWS EC2/Render','CI/CD Pipeline','Monitoring','API Documentation'],['AWS Free Tier','Render Docs','Swagger/OpenAPI'],'Deploy full API with CI/CD pipeline'),
    ]
}
ROADMAPS['Full Stack Developer'] = {
    'required_skills': ['react','nodejs','mongodb','javascript','html','css','git','rest api'],
    'weeks': [
        w(1,'HTML, CSS & JavaScript',['Semantic HTML','CSS Grid/Flexbox','ES6+ JS','DOM APIs'],['MDN Docs','javascript.info','CSS-Tricks'],'Build a responsive landing page'),
        w(2,'React Frontend',['React Components','Hooks','React Router','State Management'],['React Docs','Scrimba','Jack Herrington YouTube'],'Build a React dashboard UI'),
        w(3,'Node.js + Express Backend',['Express APIs','Middleware','JWT Auth','File Uploads'],['Express Docs','Traversy Media','Academind'],'Build REST API with authentication'),
        w(4,'MongoDB Database',['Mongoose ODM','CRUD Operations','Data Modeling','Aggregation'],['MongoDB University','Mongoose Docs'],'Connect React + Express + MongoDB'),
        w(5,'Full Stack Integration',['Axios API calls','CORS Setup','Error Handling','Loading States'],['Axios Docs','React Query','SWR'],'Build a full stack blog application'),
        w(6,'TypeScript + Testing',['TypeScript Basics','React TypeScript','Jest','API Testing'],['TypeScript Docs','Testing Library','Vitest'],'Add TypeScript + tests to project'),
        w(7,'Docker + DevOps',['Docker Compose','Multi-container Setup','Nginx','Environment Config'],['Docker Docs','TechWorld Nana','Nginx Docs'],'Dockerize full stack app'),
        w(8,'Deployment + Portfolio',['Vercel + Render Deploy','CI/CD','Performance','GitHub README'],['Vercel Docs','Render Docs','GitHub Actions'],'Deploy + publish portfolio'),
    ]
}

ROADMAPS['Java Developer'] = {
    'required_skills': ['java','oop','collections','multithreading','jdbc','spring boot','rest api','mysql','git','docker'],
    'weeks': [
        w(1,'Java Fundamentals',['JDK Setup','OOP Concepts','Data Types & Arrays','Control Flow'],['Java Brains','Telusko Java','Official Java Docs'],'Build a student management console app'),
        w(2,'Collections & Generics',['List/Map/Set','Generics','Iterator','Comparable & Comparator'],['Baeldung Java','Java T Point','HackerRank Java'],'Solve 20 Java collections problems'),
        w(3,'Multithreading & Concurrency',['Threads','Runnable','Executor Service','synchronized'],['Java Concurrency in Practice Book','Baeldung Concurrency','Jenkov Tutorials'],'Build a multi-threaded file processor'),
        w(4,'JDBC & MySQL',['JDBC Drivers','PreparedStatement','Transactions','Connection Pooling'],['JDBC Tutorial W3Schools','MySQL Docs','HikariCP Docs'],'Build CRUD app with JDBC'),
        w(5,'Spring Boot Basics',['Spring Initializr','REST Controllers','JPA & Hibernate','Application Properties'],['Spring Official Docs','Amigoscode Spring Boot','Baeldung Spring'],'Build a REST API with Spring Boot'),
        w(6,'Spring Boot Advanced',['Spring Security','JWT','Spring Data','Exception Handling'],['Spring Security Docs','Daily Code Buffer','Java Techie'],'Add security + DB to Spring Boot API'),
        w(7,'Docker & Testing',['JUnit 5','Mockito','Docker for Java','Integration Tests'],['JUnit 5 Docs','Mockito Docs','Testcontainers'],'Add tests + Docker to Spring project'),
        w(8,'Microservices & Deploy',['Microservices Architecture','Eureka','API Gateway','Cloud Deploy'],['Spring Cloud Docs','Microservices.io','AWS Elastic Beanstalk'],'Deploy microservice to cloud'),
    ]
}
ROADMAPS['Python Developer'] = {
    'required_skills': ['python','oop','django','flask','rest api','sql','git','docker'],
    'weeks': [
        w(1,'Python Fundamentals',['Variables & Data Types','Functions','OOP','List Comprehensions'],['Python.org Docs','Corey Schafer YouTube','Real Python'],'Build a contact book CLI app'),
        w(2,'Advanced Python',['Decorators','Generators','Context Managers','Type Hints'],['Fluent Python Book','Real Python Advanced','ArjanCodes YouTube'],'Build a task scheduler with decorators'),
        w(3,'Flask Web Framework',['Flask Routing','Templates','Forms','Blueprint'],['Flask Docs','Corey Schafer Flask','Miguel Grinberg Blog'],'Build a Flask blog with authentication'),
        w(4,'Django Framework',['Django ORM','Views & Templates','Admin Panel','Django REST Framework'],['Django Docs','Dennis Ivy YouTube','DRF Docs'],'Build a Django REST API'),
        w(5,'Database & SQL',['SQLAlchemy','PostgreSQL','Migrations','Query Optimization'],['SQLAlchemy Docs','PostgreSQL Tutorial','Alembic Docs'],'Add PostgreSQL to Django project'),
        w(6,'Async Python',['asyncio','aiohttp','FastAPI','WebSockets'],['FastAPI Docs','Python Asyncio Docs','Sebastián Ramírez Talks'],'Build an async API with FastAPI'),
        w(7,'Testing & CI/CD',['pytest','unittest','Coverage.py','GitHub Actions'],['pytest Docs','Test-Driven Development Python','Coverage.py Docs'],'Write tests for all your projects'),
        w(8,'Docker & Deployment',['Docker for Python','Gunicorn/Uvicorn','Nginx','Heroku/Render'],['Docker Docs','Gunicorn Docs','Render Deployment Guide'],'Dockerize and deploy Python app'),
    ]
}
ROADMAPS['C++ Developer'] = {
    'required_skills': ['c++','oop','stl','pointers','data structures','algorithms','cmake','git'],
    'weeks': [
        w(1,'C++ Foundations',['Variables & Types','Pointers & References','Functions','OOP Classes'],['cppreference.com','LearnCpp.com','CS50 C Course'],'Build a bank account simulation'),
        w(2,'Memory Management',['new/delete','Smart Pointers','RAII','Move Semantics'],['CppCon Talks','Modern C++ Book','learncpp.com Memory'],'Build a custom string class'),
        w(3,'STL Deep Dive',['vector/map/set','Algorithms','Iterators','Function Objects'],['STL Docs','Stroustrup C++ Tour','HackerRank C++'],'Solve 25 STL-based problems'),
        w(4,'Templates & Metaprogramming',['Function Templates','Class Templates','Variadic Templates','constexpr'],['C++ Templates Book','CppCon 2019 Talks','foonathan.net'],'Build a generic data structure library'),
        w(5,'Data Structures',['Linked List','Trees','Graphs','Hash Tables'],['CLRS Algorithms Book','CP-Algorithms.com','GeeksForGeeks C++'],'Implement 10 data structures from scratch'),
        w(6,'Competitive Programming',['Dynamic Programming','Graph Algorithms','Binary Search','Greedy'],['Codeforces','AtCoder','Competitive Programmer\'s Handbook'],'Solve 50 problems on Codeforces'),
        w(7,'Systems Programming',['File I/O','Multithreading','Sockets','CMake Build System'],['POSIX Docs','Beej\'s Network Guide','CMake Docs'],'Build a multi-threaded TCP server'),
        w(8,'Projects & Portfolio',['Game Engine Basics','CLI Tools','Performance Profiling','GitHub Portfolio'],['SFML Docs','Perf Tools','Open Source C++ Projects'],'Build a 2D game or systems tool'),
    ]
}
ROADMAPS['.NET Developer'] = {
    'required_skills': ['c#','asp.net','entity framework','sql server','rest api','azure','git','docker'],
    'weeks': [
        w(1,'C# Fundamentals',['C# Syntax','OOP in C#','LINQ','Async/Await'],['Microsoft C# Docs','Tim Corey YouTube','C# in Depth Book'],'Build a task manager console app'),
        w(2,'ASP.NET Core Basics',['MVC Pattern','Controllers & Views','Routing','Middleware'],['ASP.NET Core Docs','Les Jackson YouTube','Nick Chapsas YouTube'],'Build a simple web app with ASP.NET'),
        w(3,'Entity Framework Core',['Code First Migrations','CRUD Operations','Relationships','Query Optimization'],['EF Core Docs','Kudvenkat EF Tutorials','Tim Corey EF'],'Add database to ASP.NET project'),
        w(4,'REST API with .NET',['Web API Controllers','DTOs','AutoMapper','Swagger'],['ASP.NET Web API Docs','Clean Architecture .NET','Jason Taylor Template'],'Build a complete REST API'),
        w(5,'Authentication & Security',['ASP.NET Identity','JWT Bearer','Role-based Auth','HTTPS'],['Microsoft Identity Docs','Nick Chapsas Auth','OWASP .NET'],'Add JWT auth to your API'),
        w(6,'Azure Cloud',['Azure App Service','Azure SQL','Azure Blob Storage','Azure DevOps'],['Microsoft Learn Azure','ACloudGuru Azure','Azure Docs'],'Deploy .NET app to Azure'),
        w(7,'Testing',['xUnit','Moq','Integration Testing','TDD in .NET'],['xUnit Docs','Moq Docs','Microsoft Testing Docs'],'Write unit and integration tests'),
        w(8,'Microservices & Deploy',['Docker for .NET','gRPC','Service Bus','Kubernetes'],['.NET Microservices Book','DAPR Docs','eShopOnContainers'],'Build and deploy a .NET microservice'),
    ]
}
ROADMAPS['Mobile App Developer'] = {
    'required_skills': ['react native','javascript','typescript','rest api','git','firebase','expo'],
    'weeks': [
        w(1,'React Native Basics',['Setup Expo','Components','StyleSheet','Navigation Basics'],['React Native Docs','Expo Docs','William Candillon YouTube'],'Build a Hello World mobile app'),
        w(2,'Navigation & State',['React Navigation','Stack/Tab/Drawer','useState/useReducer','Context'],['React Navigation Docs','Laith Academy RN','Code With Mosh RN'],'Build a multi-screen notes app'),
        w(3,'APIs & Networking',['Fetch/Axios in RN','Loading States','Error Handling','AsyncStorage'],['RN Networking Docs','Axios Docs','MMKV Storage'],'Build a movie browser app'),
        w(4,'Firebase Integration',['Firestore CRUD','Firebase Auth','Cloud Functions','Push Notifications'],['Firebase Docs','Firebase React Native','Notifee Docs'],'Add auth + Firestore to app'),
        w(5,'Native Features',['Camera & Gallery','Location Services','Permissions','Animations'],['Expo Camera Docs','React Native Maps','Reanimated Docs'],'Build a photo sharing app'),
        w(6,'Performance',['FlatList Optimization','Memoization','Hermes Engine','Profiler'],['RN Performance Docs','Flipper Docs','React DevTools'],'Optimize your app for 60fps'),
        w(7,'Testing & TypeScript',['Jest for RN','React Native Testing Library','TypeScript in RN','E2E with Detox'],['Detox Docs','RNTL Docs','TS + RN Guide'],'Add TypeScript and tests'),
        w(8,'Deployment',['Android Build','iOS Build','App Store / Play Store','EAS Build'],['EAS Docs','App Store Guidelines','Play Store Guidelines'],'Publish app to stores'),
    ]
}
ROADMAPS['Android Developer'] = {
    'required_skills': ['kotlin','java','android sdk','jetpack compose','room','retrofit','git','firebase'],
    'weeks': [
        w(1,'Kotlin Fundamentals',['Kotlin Syntax','Data Classes','Coroutines Intro','Null Safety'],['Kotlin Docs','Android Kotlin Bootcamp','Philipp Lackner YouTube'],'Build a Kotlin calculator app'),
        w(2,'Android Basics',['Activities & Fragments','Intents','Layouts','RecyclerView'],['Android Developers Docs','Google Codelabs','Coding in Flow YouTube'],'Build a contacts list app'),
        w(3,'Jetpack Compose',['Composables','State in Compose','Navigation Compose','Theming'],['Compose Docs','Compose Pathway','Philipp Lackner Compose'],'Rebuild app in Jetpack Compose'),
        w(4,'MVVM Architecture',['ViewModel','LiveData/StateFlow','Repository Pattern','Hilt DI'],['Android Architecture Docs','Brainstorming MVVM','Dagger Hilt Docs'],'Refactor app to MVVM + Hilt'),
        w(5,'Local Database & Network',['Room Database','Retrofit + Coroutines','Kotlin Serialization','Paging 3'],['Room Docs','Retrofit Docs','Coil Image Loading'],'Build an offline-first news app'),
        w(6,'Firebase & Auth',['Firebase Auth','Firestore','Cloud Messaging','Analytics'],['Firebase Android Docs','Firebase Codelab','Google Play Services'],'Add Firebase auth + notifications'),
        w(7,'Testing',['JUnit 4/5','Espresso','MockK','UI Automator'],['Android Testing Docs','Espresso Docs','MockK Docs'],'Write UI and unit tests'),
        w(8,'Publish & CI/CD',['App Signing','Play Store Console','GitHub Actions for Android','ProGuard'],['Play Console Help','Android Fastlane','Firebase App Distribution'],'Publish app to Play Store'),
    ]
}
ROADMAPS['iOS Developer'] = {
    'required_skills': ['swift','swiftui','uikit','xcode','core data','combine','rest api','git'],
    'weeks': [
        w(1,'Swift Fundamentals',['Swift Syntax','Optionals','Closures','Protocols & Extensions'],['Swift.org Docs','Hacking with Swift','Sean Allen YouTube'],'Build a tip calculator app'),
        w(2,'SwiftUI Basics',['Views & Modifiers','State & Binding','Navigation','Lists'],['SwiftUI Tutorials Apple','Paul Hudson SwiftUI','Stewart Lynch YouTube'],'Build a todo app in SwiftUI'),
        w(3,'UIKit Essentials',['UIViewController','Auto Layout','Table Views','Storyboards'],['UIKit Docs Apple','Ray Wenderlich','Mark Moeykens YouTube'],'Build an app with UIKit'),
        w(4,'Networking & APIs',['URLSession','Codable','async/await in Swift','Error Handling'],['URLSession Docs','Swift by Sundell','Donny Wals Blog'],'Build a movie browser app'),
        w(5,'Core Data & Local Storage',['Core Data Stack','NSFetchRequest','UserDefaults','Keychain'],['Core Data Docs','Donny Wals Core Data Book','SwiftData Docs'],'Add offline storage to app'),
        w(6,'Combine & Architecture',['Combine Framework','MVVM in Swift','Dependency Injection','Coordinator'],['Combine Docs','Clean Swift','Pointfree.co'],'Refactor app to MVVM + Combine'),
        w(7,'Testing',['XCTest','UI Testing','TDD in Swift','Snapshot Testing'],['XCTest Docs','Hacking With Swift Testing','SnapshotTesting Library'],'Write tests for your app'),
        w(8,'App Store & CI/CD',['TestFlight','App Store Connect','Fastlane','Instruments Profiling'],['App Store Guidelines','Fastlane Docs','Xcode Cloud'],'Submit app to App Store'),
    ]
}
ROADMAPS['Software Engineer'] = {
    'required_skills': ['data structures','algorithms','system design','oop','git','sql','rest api','docker'],
    'weeks': [
        w(1,'DSA Foundations',['Arrays & Strings','Linked Lists','Stacks & Queues','Big-O Notation'],['NeetCode.io','LeetCode','Grokking Algorithms Book'],'Solve 30 Easy LeetCode problems'),
        w(2,'DSA Intermediate',['Trees & Graphs','Recursion','Sorting Algorithms','Binary Search'],['CS Dojo YouTube','Abdul Bari Algorithms','CP-Algorithms.com'],'Solve 20 Medium LeetCode problems'),
        w(3,'OOP & Design Patterns',['SOLID Principles','Factory/Singleton/Observer','DRY & KISS','Refactoring'],['Refactoring.guru','Head First Design Patterns','Clean Code Book'],'Apply patterns to a real project'),
        w(4,'System Design Basics',['Scalability Concepts','Load Balancing','Caching','Databases'],['System Design Primer','ByteByteGo','Designing Data-Intensive Apps'],'Design a URL shortener system'),
        w(5,'Database & SQL',['Advanced SQL','Indexing','Transactions','NoSQL vs SQL'],['Use The Index Luke','PostgreSQL Docs','MongoDB University'],'Build an optimized database schema'),
        w(6,'REST APIs & Microservices',['REST Best Practices','API Design','Microservices Intro','Message Queues'],['REST API Design Rulebook','Martin Fowler Blog','RabbitMQ Docs'],'Build a microservice-based API'),
        w(7,'Cloud & DevOps Basics',['Docker Basics','AWS/GCP Intro','CI/CD','Monitoring'],['Docker Docs','AWS Cloud Practitioner','GitHub Actions'],'Deploy project with CI/CD'),
        w(8,'Interview Prep',['Behavioral Questions','Mock Interviews','Resume Polish','Open Source'],['Interviewing.io','Pramp','Blind 75'],'Complete 75 LeetCode problems'),
    ]
}
ROADMAPS['Software Architect'] = {
    'required_skills': ['system design','microservices','cloud','docker','kubernetes','event driven','ddd','rest api'],
    'weeks': [
        w(1,'Architecture Fundamentals',['Architecture Styles','Monolith vs Microservices','CAP Theorem','12-Factor App'],['Fundamentals of Software Architecture Book','Martin Fowler Blog','Mark Richards Talks'],'Design a monolith-to-microservices migration'),
        w(2,'Domain Driven Design',['Bounded Contexts','Aggregates','Domain Events','CQRS'],['Domain-Driven Design Book','DDD Community','Vaughn Vernon Book'],'Model a domain for an e-commerce system'),
        w(3,'Microservices Patterns',['Service Discovery','Circuit Breaker','Saga Pattern','API Gateway'],['Microservices.io','Chris Richardson Blog','Sam Newman Book'],'Design a microservices architecture'),
        w(4,'Event-Driven Architecture',['Event Sourcing','Kafka/RabbitMQ','Pub-Sub','Eventual Consistency'],['Confluent Kafka Docs','Event Sourcing Pattern','Greg Young Talks'],'Build an event-driven order system'),
        w(5,'Cloud Architecture',['Multi-Region Deployment','Serverless','IaC with Terraform','Cost Optimization'],['AWS Well-Architected Framework','GCP Architecture','Azure CAF'],'Design a cloud-native system on AWS'),
        w(6,'Security Architecture',['Zero Trust Model','OAuth 2.0 / OIDC','API Security','Secret Management'],['OWASP Top 10','Vault Docs','Auth0 Docs'],'Implement security in your architecture'),
        w(7,'Observability & Reliability',['Distributed Tracing','SLO/SLA/SLI','Chaos Engineering','Incident Response'],['OpenTelemetry Docs','SRE Book Google','Chaos Monkey'],'Add observability to your system'),
        w(8,'Architecture Documentation',['ADRs','C4 Model Diagrams','RFC Process','Technical Writing'],['C4 Model Site','arc42','GitHub ADR Examples'],'Document architecture with C4 model'),
    ]
}

# ── ARTIFICIAL INTELLIGENCE ───────────────────────────────────────────────────
ROADMAPS['AI Engineer'] = {
    'required_skills': ['python','machine learning','deep learning','pytorch','transformers','rest api','docker','cloud'],
    'weeks': [
        w(1,'Python & Math for AI',['Python OOP','NumPy/Pandas','Linear Algebra','Probability & Statistics'],['3Blue1Brown Linear Algebra','Khan Academy Stats','Python Docs'],'Build a statistics analysis notebook'),
        w(2,'ML Fundamentals',['Supervised Learning','Scikit-learn','Model Evaluation','Feature Engineering'],['Andrew Ng ML Course','Kaggle ML Micro-course','StatQuest YouTube'],'Build a classification model on Kaggle'),
        w(3,'Deep Learning',['Neural Networks','PyTorch Basics','Backpropagation','Regularization'],['PyTorch Docs','fast.ai','Andrej Karpathy YouTube'],'Build an image classifier with PyTorch'),
        w(4,'NLP & Transformers',['BERT/GPT Architecture','Hugging Face Transformers','Fine-tuning','Tokenization'],['Hugging Face Course','Jay Alammar Blog','Illustrated Transformer'],'Fine-tune a text classifier'),
        w(5,'Generative AI',['LLM APIs','Prompt Engineering','RAG Pipeline','LangChain'],['OpenAI Docs','LangChain Docs','Andrej Karpathy Talks'],'Build a RAG-based Q&A chatbot'),
        w(6,'MLOps',['MLflow','Model Registry','Data Versioning','CI/CD for ML'],['MLflow Docs','DVC Docs','Made With ML'],'Set up MLOps pipeline for a model'),
        w(7,'Deployment & Scaling',['FastAPI for ML','Docker for AI','Model Optimization','TensorRT'],['FastAPI Docs','ONNX Docs','BentoML Docs'],'Deploy ML model as production API'),
        w(8,'Projects & Portfolio',['End-to-End AI Project','Kaggle Competition','Research Paper Reading','GitHub Portfolio'],['Papers With Code','Arxiv.org','Kaggle'],'Complete and publish an AI project'),
    ]
}
ROADMAPS['Machine Learning Engineer'] = {
    'required_skills': ['python','scikit-learn','pytorch','tensorflow','sql','docker','mlflow','aws'],
    'weeks': [
        w(1,'ML Fundamentals',['Supervised/Unsupervised','Model Selection','Bias-Variance','Cross Validation'],['Andrew Ng Coursera','Scikit-learn Docs','StatQuest'],'Build and evaluate 5 ML models'),
        w(2,'Feature Engineering',['Missing Values','Encoding','Scaling','Feature Selection'],['Kaggle FE Course','Feature Engineering Book','Towards Data Science'],'Clean and engineer a real dataset'),
        w(3,'Advanced ML',['Ensemble Methods','XGBoost','Hyperparameter Tuning','Bayesian Optimization'],['XGBoost Docs','Optuna Docs','Kaggle Competitions'],'Win a Kaggle getting started competition'),
        w(4,'Deep Learning',['PyTorch Pipeline','Custom Datasets','Transfer Learning','Model Debugging'],['PyTorch Docs','fast.ai','TensorFlow Hub'],'Build a computer vision model'),
        w(5,'Data Pipelines',['Pandas Profiling','Apache Spark Intro','Airflow Basics','Data Quality'],['Airflow Docs','PySpark Docs','Great Expectations Docs'],'Build an automated data pipeline'),
        w(6,'MLOps Fundamentals',['MLflow Tracking','Model Versioning','DVC','A/B Testing'],['MLflow Docs','DVC Docs','Neptune.ai'],'Track experiments with MLflow'),
        w(7,'Cloud ML',['AWS SageMaker','GCP Vertex AI','Model Monitoring','Drift Detection'],['SageMaker Docs','Vertex AI Docs','Evidently AI'],'Deploy model on SageMaker'),
        w(8,'Production & Scale',['Kubeflow','Ray Serve','Feature Store','Real-time Inference'],['Kubeflow Docs','Feast Docs','Ray Docs'],'Build a scalable ML production system'),
    ]
}
ROADMAPS['Deep Learning Engineer'] = {
    'required_skills': ['python','pytorch','tensorflow','cuda','cnn','transformers','numpy','docker'],
    'weeks': [
        w(1,'Math for Deep Learning',['Calculus & Gradients','Linear Algebra','Probability','Information Theory'],['3Blue1Brown','Deep Learning Book','Gilbert Strang MIT'],'Implement gradient descent from scratch'),
        w(2,'Neural Networks',['Perceptron','Activation Functions','Backpropagation','Weight Init'],['deeplearning.ai','Andrej Karpathy NN Zero to Hero','CS231n Stanford'],'Build a neural net without frameworks'),
        w(3,'CNNs',['Conv Layers','Pooling','BatchNorm','ResNet/VGG Architecture'],['CS231n Slides','PyTorch CNN Tutorial','Papers With Code ImageNet'],'Build an image classifier beating 90% accuracy'),
        w(4,'RNNs & Sequence Models',['LSTM/GRU','Sequence-to-Sequence','Attention Mechanism','CTC Loss'],['CS224n Stanford','Colah\'s Blog','d2l.ai'],'Build a text generation model'),
        w(5,'Transformers',['Self-Attention','Multi-Head Attention','BERT/GPT','Vision Transformers'],['Illustrated Transformer','Hugging Face Course','Annotated Transformer'],'Fine-tune BERT for text classification'),
        w(6,'Generative Models',['GANs','VAEs','Diffusion Models','Stable Diffusion'],['GAN Paper','Diffusion Model Tutorial','Hugging Face Diffusers'],'Generate synthetic images with a GAN'),
        w(7,'Optimization & GPU',['Mixed Precision Training','Gradient Checkpointing','CUDA Basics','Multi-GPU'],['PyTorch Performance Docs','NVIDIA CUDA Tutorial','DeepSpeed Docs'],'Speed up training with mixed precision'),
        w(8,'Research & Deploy',['Reading Papers','Experiment Tracking','ONNX Export','TensorRT'],['Arxiv.org','Weights & Biases','TensorRT Docs'],'Reproduce a recent DL paper'),
    ]
}
ROADMAPS['Generative AI Engineer'] = {
    'required_skills': ['python','llm apis','langchain','prompt engineering','rag','vector databases','fastapi','docker'],
    'weeks': [
        w(1,'LLM Fundamentals',['GPT Architecture','Tokenization','Temperature & Sampling','Context Windows'],['OpenAI Docs','Andrej Karpathy Talks','LLM Visualization'],'Explore GPT-4 capabilities with API'),
        w(2,'Prompt Engineering',['Zero/Few-Shot','Chain of Thought','ReAct Pattern','System Prompts'],['Prompt Engineering Guide','OpenAI Cookbook','DAIR.AI PE Course'],'Build a prompt library for 5 use cases'),
        w(3,'LangChain Framework',['Chains','Agents','Memory','Tools'],['LangChain Docs','LangChain YouTube','Harrison Chase Talks'],'Build a conversational Q&A bot'),
        w(4,'RAG Pipeline',['Document Loaders','Text Splitters','Embeddings','Vector Databases'],['LangChain RAG Tutorial','Pinecone Docs','Chroma Docs'],'Build a PDF Q&A system with RAG'),
        w(5,'Fine-tuning & PEFT',['LoRA/QLoRA','Hugging Face Trainer','Dataset Preparation','Evaluation'],['Hugging Face PEFT Docs','Sebastian Raschka Tutorials','Alpaca Dataset'],'Fine-tune Llama on custom dataset'),
        w(6,'AI Agents',['Tool Use','Function Calling','Multi-Agent Systems','LangGraph'],['LangGraph Docs','AutoGPT Concepts','CrewAI Docs'],'Build a multi-agent research assistant'),
        w(7,'Production GenAI',['Guardrails','Content Filtering','Cost Optimization','Streaming'],['NeMo Guardrails','LiteLLM Docs','Langsmith Docs'],'Add guardrails to a production chatbot'),
        w(8,'Deploy & Scale',['FastAPI + LangChain','Docker for GenAI','Modal/Replicate','Monitoring'],['Modal Docs','Replicate Docs','LangSmith'],'Deploy a production GenAI application'),
    ]
}
ROADMAPS['Prompt Engineer'] = {
    'required_skills': ['llm apis','prompt engineering','python','langchain','rag','json','technical writing'],
    'weeks': [
        w(1,'LLM Landscape',['GPT-4/Claude/Gemini','Model Comparisons','Tokens & Pricing','API Basics'],['OpenAI Docs','Anthropic Docs','Google AI Studio'],'Compare 3 LLMs on the same 10 prompts'),
        w(2,'Core Prompting Techniques',['Zero-Shot','Few-Shot','Chain of Thought','Self-Consistency'],['Prompt Engineering Guide','Google PE Course','Learn Prompting'],'Build a benchmark for prompt quality'),
        w(3,'Advanced Prompting',['Tree of Thought','ReAct','Meta-Prompting','Prompt Chaining'],['DAIR.AI','Lilian Weng Blog','Papers With Code Prompting'],'Create a complex multi-step reasoning prompt'),
        w(4,'Structured Outputs',['JSON Mode','Function Calling','Pydantic Validation','Schema Design'],['OpenAI Function Calling Docs','Instructor Library','Marvin Library'],'Build a structured data extractor'),
        w(5,'RAG & Retrieval',['Embeddings','Semantic Search','Context Window Management','Chunking'],['LangChain RAG','OpenAI Embeddings','Weaviate Blog'],'Build a document Q&A system'),
        w(6,'System Design for LLMs',['System Prompts','Multi-turn Conversation','Persona Design','Safety Filters'],['OpenAI System Prompt Guide','Anthropic Safety Docs','NeMo Guardrails'],'Design a production chatbot system'),
        w(7,'Evaluation',['Evals Framework','RAGAS','LLM-as-Judge','Human Evaluation'],['OpenAI Evals','RAGAS Docs','Promptfoo'],'Build an evaluation suite for your prompts'),
        w(8,'Portfolio & Specialization',['Prompt Portfolio','Domain Specialization','API Wrappers','Blog Writing'],['Promptbase','PromptHero','Towards Data Science'],'Publish a prompt engineering case study'),
    ]
}
ROADMAPS['LLM Engineer'] = {
    'required_skills': ['python','transformers','pytorch','fine-tuning','rag','vector databases','langchain','docker'],
    'weeks': [
        w(1,'Transformer Architecture',['Attention Mechanism','Positional Encoding','Encoder-Decoder','Pre-training'],['Illustrated Transformer','Annotated Transformer','d2l.ai Transformers'],'Implement attention from scratch'),
        w(2,'Hugging Face Ecosystem',['Tokenizers','AutoModel','Datasets Library','Trainer API'],['Hugging Face Course','HF Docs','Philipp Schmid Blog'],'Fine-tune BERT for NER task'),
        w(3,'Efficient Fine-tuning',['LoRA/QLoRA','PEFT Library','Quantization','Instruction Tuning'],['PEFT Docs','QLoRA Paper','Axolotl Docs'],'Fine-tune Llama-3 with LoRA on 8GB GPU'),
        w(4,'RAG Systems',['Dense Retrieval','Hybrid Search','Re-ranking','Evaluation Metrics'],['LangChain RAG','LlamaIndex Docs','RAGAS'],'Build a production-grade RAG system'),
        w(5,'LLM Serving',['vLLM','Ollama','TGI','Model Quantization (GGUF)'],['vLLM Docs','Ollama Docs','TGI Docs'],'Self-host Llama-3 with vLLM'),
        w(6,'Agents & Tool Use',['Function Calling','Multi-Agent Frameworks','Memory Systems','LangGraph'],['LangGraph Docs','Autogen Docs','Mem0 Docs'],'Build a ReAct agent with tools'),
        w(7,'LLMOps',['Experiment Tracking','Prompt Versioning','A/B Testing','Cost Tracking'],['LangSmith Docs','Weights & Biases LLM','Phoenix Arize'],'Set up LLMOps pipeline'),
        w(8,'Production Deployment',['Kubernetes for LLMs','Caching Strategies','Guardrails','Observability'],['NeMo Guardrails','Modal Deploy','Beam Cloud'],'Deploy LLM application to production'),
    ]
}
ROADMAPS['NLP Engineer'] = {
    'required_skills': ['python','nltk','spacy','transformers','hugging face','pytorch','sql','docker'],
    'weeks': [
        w(1,'NLP Fundamentals',['Tokenization','Stemming & Lemmatization','POS Tagging','Regular Expressions'],['NLTK Book','spaCy 101','Real Python NLP'],'Build a text preprocessing pipeline'),
        w(2,'Text Representation',['Bag of Words','TF-IDF','Word2Vec','GloVe Embeddings'],['Word2Vec Paper','Gensim Docs','Chris McCormick Blog'],'Train word embeddings on custom corpus'),
        w(3,'Classical NLP',['Naive Bayes','SVM for Text','Sequence Labeling','CRF Models'],['Jurafsky & Martin Book','Scikit-learn Text','Stanford NLP Slides'],'Build a spam classifier'),
        w(4,'Transformer Models',['BERT Fine-tuning','Sentence Transformers','Named Entity Recognition','QA Models'],['Hugging Face Course','SBERT Docs','spaCy Transformers'],'Build a semantic search engine'),
        w(5,'Information Extraction',['Relation Extraction','Coreference Resolution','Dependency Parsing','Entity Linking'],['spaCy IE Docs','AllenNLP Docs','RebelNLP Paper'],'Build a knowledge graph extractor'),
        w(6,'Text Generation',['GPT Fine-tuning','Summarization','Translation','Controlled Generation'],['Hugging Face Summarization','PEGASUS Paper','ControlGen Docs'],'Build a text summarization API'),
        w(7,'Multilingual NLP',['mBERT','XLM-RoBERTa','Cross-lingual Transfer','Language Detection'],['mBERT Paper','Hugging Face Multilingual','Lingua Library'],'Build a multilingual classifier'),
        w(8,'Deploy & Scale',['FastAPI NLP API','ONNX for NLP','Batching Inference','Monitoring'],['FastAPI Docs','Optimum Docs','Prometheus + Grafana'],'Deploy NLP API with performance monitoring'),
    ]
}
ROADMAPS['Computer Vision Engineer'] = {
    'required_skills': ['python','opencv','pytorch','cnn','yolo','image processing','docker','rest api'],
    'weeks': [
        w(1,'Image Processing Basics',['OpenCV CRUD','Color Spaces','Filters & Transformations','Morphological Ops'],['OpenCV Docs','PyImageSearch','Satya Mallick Blog'],'Build an image filter app'),
        w(2,'Deep Learning for Vision',['CNN Architecture','Transfer Learning','Data Augmentation','Loss Functions'],['CS231n Stanford','fast.ai Vision','PyTorch Vision Tutorial'],'Train an image classifier (90%+ accuracy)'),
        w(3,'Object Detection',['YOLO Architecture','Anchor Boxes','NMS','mAP Metric'],['Ultralytics YOLO Docs','Roboflow Blog','COCO Dataset'],'Build real-time object detector'),
        w(4,'Image Segmentation',['Semantic Segmentation','Instance Segmentation','SAM Model','Mask R-CNN'],['Segment Anything Docs','Detectron2','mmsegmentation'],'Build a semantic segmentation model'),
        w(5,'Face Recognition',['Face Detection','Face Embeddings','FaceNet','Liveness Detection'],['DeepFace Docs','InsightFace Docs','PyImageSearch Face'],'Build a face recognition attendance system'),
        w(6,'Video Analysis',['Optical Flow','Action Recognition','Tracking Algorithms','Video Transformers'],['Kornia Docs','MMAction2','ByteTrack'],'Build a people counting system'),
        w(7,'Generative Vision',['GANs for Images','Stable Diffusion','Image Inpainting','ControlNet'],['Diffusers Docs','InvokeAI','ControlNet Paper'],'Build an AI image editor'),
        w(8,'Deploy & Optimize',['TensorRT Optimization','ONNX Export','Edge Deployment','FastAPI CV API'],['TensorRT Docs','ONNX Docs','Jetson Nano Docs'],'Deploy CV model to edge device'),
    ]
}
ROADMAPS['Robotics Engineer'] = {
    'required_skills': ['python','ros','c++','kinematics','computer vision','control systems','embedded','linux'],
    'weeks': [
        w(1,'Robotics Fundamentals',['Kinematics','Coordinate Frames','Sensors & Actuators','Robot Morphology'],['Introduction to Robotics Book','MIT OCW Robotics','Coursera Robotics'],'Simulate a robot arm in 2D'),
        w(2,'ROS Basics',['ROS2 Architecture','Topics & Services','tf2 Transforms','URDF Models'],['ROS2 Docs','Articulated Robotics YouTube','The Construct ROS'],'Build a ROS2 publisher-subscriber system'),
        w(3,'Computer Vision for Robots',['Camera Calibration','Stereo Vision','Object Detection with ROS','SLAM Intro'],['OpenCV ROS','ROS perception tutorials','PyImageSearch'],'Add object detection to a ROS robot'),
        w(4,'Motion Planning',['A* & RRT','MoveIt 2','Path Planning','Collision Avoidance'],['MoveIt 2 Docs','ROS Navigation Stack','Robotic Motion Planning MOOC'],'Plan collision-free arm trajectories'),
        w(5,'Control Systems',['PID Controllers','State Space','Kalman Filter','Motor Control'],['Control Bootcamp YouTube','Brian Douglas','MATLAB Control'],'Implement a PID controller'),
        w(6,'Simulation',['Gazebo','RViz','Ignition Simulation','Sensor Plugins'],['Gazebo Docs','RViz Docs','AWS RoboMaker'],'Build and simulate a mobile robot'),
        w(7,'Embedded Systems',['Arduino/Raspberry Pi','Real-time OS','CAN Bus','Sensor Fusion'],['Arduino Docs','FreeRTOS Docs','ROS2 on Raspberry Pi'],'Connect real hardware to ROS'),
        w(8,'Projects & Deploy',['Mobile Manipulation','Autonomous Navigation','Robot Learning','Portfolio'],['OpenAI Gym Robotics','Isaac Gym','TurtleBot3 Projects'],'Build an autonomous navigation robot'),
    ]
}

# ── DATA DOMAIN ───────────────────────────────────────────────────────────────
ROADMAPS['Data Analyst'] = {
    'required_skills': ['excel','sql','python','power bi','tableau','statistics','pandas','numpy'],
    'weeks': [
        w(1,'Excel Mastery',['Pivot Tables','VLOOKUP/XLOOKUP','Power Query','Conditional Formatting'],['ExcelJet.net','Chandoo.org','Microsoft Excel Training'],'Analyze a sales dataset in Excel'),
        w(2,'SQL for Analysis',['Joins','Window Functions','CTEs','Aggregations'],['Mode SQL Tutorial','SQLZoo','LeetCode SQL 50'],'Solve 30 SQL analysis problems'),
        w(3,'Python for Data',['Pandas DataFrames','Data Cleaning','GroupBy','Merging Datasets'],['Kaggle Python Course','Real Python Pandas','Corey Schafer Pandas'],'Clean and analyze a messy dataset'),
        w(4,'Data Visualization',['Matplotlib','Seaborn','Plotly','Storytelling with Data'],['Kaggle Data Viz Course','Plotly Docs','Cole Nussbaumer Knaflic Book'],'Create a full EDA report with visualizations'),
        w(5,'Statistics',['Descriptive Stats','Hypothesis Testing','Correlation','A/B Testing'],['Khan Academy Stats','StatQuest','Practical Statistics Book'],'Run an A/B test analysis'),
        w(6,'Power BI',['Data Modeling','DAX Formulas','Interactive Dashboards','Power Query in BI'],['Microsoft Learn Power BI','Guy in a Cube YouTube','SQLBI.com'],'Build a business KPI dashboard in Power BI'),
        w(7,'Tableau',['Calculated Fields','LOD Expressions','Dashboard Design','Tableau Public'],['Tableau Training Videos','Andy Kriebel YouTube','Tableau Public Gallery'],'Build a portfolio dashboard in Tableau'),
        w(8,'Portfolio & Job Prep',['Kaggle Projects','Case Studies','SQL Interview Prep','LinkedIn Portfolio'],['Kaggle','StrataScratch','DataLemur'],'Complete 3 end-to-end data analysis projects'),
    ]
}
ROADMAPS['Business Analyst'] = {
    'required_skills': ['excel','sql','power bi','requirements gathering','process modeling','jira','stakeholder management','agile'],
    'weeks': [
        w(1,'BA Fundamentals',['SDLC Overview','Agile & Scrum','Requirements Elicitation','Stakeholder Analysis'],['IIBA BABOK','Agile BA Course','Coursera BA Specialization'],'Create a stakeholder analysis document'),
        w(2,'Requirements Engineering',['User Stories','Use Case Diagrams','BRD Writing','Acceptance Criteria'],['Atlassian User Stories','Use Case Diagrams UML','BA Times'],'Write BRD for a simple web application'),
        w(3,'Process Modeling',['BPMN 2.0','Process Flowcharts','As-Is vs To-Be','Swimlane Diagrams'],['BPMN.io','Lucidchart','bizagi Modeler'],'Model a business process end-to-end'),
        w(4,'Data Analysis for BA',['Excel Advanced','SQL Basics','Power BI Reports','Dashboard Design'],['Excel School','Mode SQL','Microsoft Learn Power BI'],'Create an executive KPI dashboard'),
        w(5,'Agile & Scrum',['Sprint Planning','Backlog Grooming','Definition of Done','Retrospectives'],['Scrum Guide','Atlassian Agile','Mountain Goat Software'],'Run a simulated sprint with a team'),
        w(6,'Tools & Documentation',['Jira/Confluence','Wireframing with Figma','Test Cases','Traceability Matrix'],['Atlassian Docs','Figma Tutorials','Test Case Templates'],'Document requirements + wireframes for an app'),
        w(7,'Communication Skills',['Presentation Skills','Business Writing','Meeting Facilitation','Conflict Resolution'],['Toastmasters','Coursera Communication','HBR Articles'],'Present a business case to stakeholders'),
        w(8,'Certification & Portfolio',['ECBA/CCBA Prep','Case Study Portfolio','Mock Interviews','LinkedIn Profile'],['IIBA Study Materials','BA Portfolio Guide','Glassdoor BA Questions'],'Complete a BA case study portfolio'),
    ]
}
ROADMAPS['Data Scientist'] = {
    'required_skills': ['python','pandas','numpy','machine learning','sql','tensorflow','scikit-learn'],
    'weeks': [
        w(1,'Python for Data Science',['Python Basics','NumPy Arrays','Pandas DataFrames','Matplotlib'],['Kaggle Python Course','Real Python','Corey Schafer YouTube'],'Analyze a public dataset'),
        w(2,'Data Analysis & Visualization',['Seaborn','Plotly','Data Cleaning','EDA Techniques'],['Kaggle EDA Course','Seaborn Docs','Towards Data Science'],'Complete EDA on Kaggle dataset'),
        w(3,'SQL for Data Science',['Advanced SQL','Window Functions','CTEs','Query Optimization'],['Mode SQL Tutorial','LeetCode SQL','SQLZoo'],'Solve 20 SQL problems on LeetCode'),
        w(4,'Machine Learning Basics',['Scikit-learn','Linear/Logistic Regression','Decision Trees','Model Evaluation'],['Scikit-learn Docs','Andrew Ng ML Course','StatQuest YouTube'],'Build a classification model'),
        w(5,'Advanced ML Models',['Random Forest','XGBoost','Cross Validation','Feature Engineering'],['Kaggle ML Course','XGBoost Docs','Feature Engineering Book'],'Kaggle competition submission'),
        w(6,'Deep Learning',['Neural Networks','TensorFlow/Keras','CNN Basics','Transfer Learning'],['TensorFlow Docs','Fast.ai','deeplearning.ai'],'Build image classification model'),
        w(7,'NLP Basics',['Text Processing','NLTK/spaCy','Sentiment Analysis','Transformers'],['Hugging Face Course','spaCy Docs','NLP with Python Book'],'Build sentiment analysis model'),
        w(8,'MLOps & Deployment',['Model Deployment','FastAPI for ML','Docker for ML','Model Monitoring'],['MLflow Docs','FastAPI Docs','Made With ML'],'Deploy ML model as REST API'),
    ]
}
ROADMAPS['Data Engineer'] = {
    'required_skills': ['python','sql','apache spark','airflow','kafka','aws','docker','hadoop'],
    'weeks': [
        w(1,'Python & SQL Foundations',['Advanced Python','Advanced SQL','psycopg2','SQLAlchemy'],['Real Python','PostgreSQL Docs','sqlalchemy Docs'],'Build a data loading script'),
        w(2,'Databases & Warehouses',['Relational vs NoSQL','Snowflake/Redshift','Data Modeling','Star Schema'],['Snowflake Docs','Kimball DW Book','dbt Docs'],'Design a star schema data warehouse'),
        w(3,'Apache Spark',['RDD vs DataFrame','Spark SQL','PySpark ETL','Spark Streaming Intro'],['Spark Docs','Databricks Academy','LearnSpark.io'],'Process a large dataset with PySpark'),
        w(4,'Apache Airflow',['DAGs','Operators & Hooks','Scheduling','XCom','Monitoring'],['Airflow Docs','Astronomer Docs','Marc Lamberti YouTube'],'Build a scheduled ETL pipeline with Airflow'),
        w(5,'Kafka & Streaming',['Kafka Architecture','Producers & Consumers','Kafka Streams','Flink Intro'],['Confluent Kafka Docs','Kafka in Action Book','Flink Docs'],'Build a real-time data streaming pipeline'),
        w(6,'Cloud Data Engineering',['AWS S3/Glue/Redshift','GCP BigQuery','Azure Data Factory','dbt Cloud'],['AWS Data Analytics','Google Data Engineering','dbt Learn'],'Build an end-to-end cloud data pipeline'),
        w(7,'Data Quality & Governance',['Great Expectations','Data Lineage','dbt Tests','Data Catalog'],['Great Expectations Docs','Apache Atlas','dbt Testing'],'Add data quality checks to your pipeline'),
        w(8,'Portfolio Projects',['End-to-End Pipeline','Open Source Contribution','Data Engineering Blogs','Interview Prep'],['DE Zoomcamp','Data Engineering Weekly','DataTalks.Club'],'Build a portfolio-worthy DE project'),
    ]
}
ROADMAPS['BI Developer'] = {
    'required_skills': ['sql','power bi','tableau','excel','data modeling','etl','python','star schema'],
    'weeks': [
        w(1,'SQL Mastery',['Advanced Joins','Window Functions','CTEs','Stored Procedures'],['Mode SQL Tutorial','LeetCode SQL','DataLemur'],'Write 20 complex SQL analytical queries'),
        w(2,'Data Warehousing',['Star/Snowflake Schema','Slowly Changing Dimensions','Fact/Dimension Tables','ETL vs ELT'],['Kimball Group','Snowflake Docs','dbt Labs Blog'],'Design a DW schema for e-commerce'),
        w(3,'Power BI Core',['Data Model','Relationships','DAX Basics','Basic Visualizations'],['Microsoft Learn Power BI','SQLBI','Guy in a Cube'],'Build your first Power BI report'),
        w(4,'Advanced Power BI',['Advanced DAX','Row-Level Security','Incremental Refresh','Composite Models'],['SQLBI Advanced DAX','Power BI Docs','Enterprise DNA'],'Build a complex financial dashboard'),
        w(5,'Tableau Core',['Connecting Data','Calculated Fields','Dashboard Design','Filters & Parameters'],['Tableau Training','Tableau Public','Andy Kriebel'],'Build a Tableau sales dashboard'),
        w(6,'ETL & Data Integration',['Power Query/M Language','Azure Data Factory','Informatica Basics','SSIS Intro'],['Power Query Docs','ADF Docs','Pragmatic Works'],'Build an automated ETL pipeline'),
        w(7,'Performance & Optimization',['Query Optimization','Aggregations in Power BI','DirectQuery vs Import','Indexing'],['SQLBI Performance','Power BI Performance','SQL Server Docs'],'Optimize a slow-performing dashboard'),
        w(8,'Portfolio & Certification',['DA-100 Prep (Power BI)','Tableau Desktop Specialist','Case Studies','LinkedIn'],['Microsoft Certification','Tableau Certification','DataCamp BI Cert'],'Publish 3 dashboards to Power BI Service & Tableau Public'),
    ]
}
ROADMAPS['Power BI Developer'] = {
    'required_skills': ['power bi','dax','power query','sql','data modeling','excel','azure','m language'],
    'weeks': [
        w(1,'Power BI Fundamentals',['Power BI Desktop','Connecting Data Sources','Basic Visuals','Publishing Reports'],['Microsoft Learn Power BI','Guy in a Cube YouTube','SQLBI'],'Build a simple sales report'),
        w(2,'Data Modeling',['Star Schema in Power BI','Relationships','Hierarchies','Date Tables'],['SQLBI Data Modeling','Kimball in Power BI','Power BI Docs'],'Build a proper data model for retail data'),
        w(3,'DAX Fundamentals',['Calculated Columns vs Measures','SUM/COUNT/AVERAGE','CALCULATE','FILTER'],['SQLBI DAX Guide','DAX Patterns','Power BI DAX Docs'],'Write 20 essential DAX measures'),
        w(4,'Advanced DAX',['Time Intelligence','RANKX','TOPN','Context Transition','Variables'],['SQLBI Advanced','Enterprise DNA','Curbal YouTube'],'Build a time intelligence dashboard'),
        w(5,'Power Query & M',['Data Transformation','M Language Basics','Custom Functions','Data Cleaning'],['Power Query Docs','Ken Puls Blog','Chandoo Power Query'],'Build an automated data cleaning pipeline'),
        w(6,'Advanced Visuals & Design',['Custom Visuals','Conditional Formatting','Bookmarks','Tooltips'],['Power BI Custom Visuals Store','PowerBI.tips','Havens Consulting'],'Build a executive-level dashboard'),
        w(7,'Row Level Security & Admin',['RLS Setup','Workspace Management','Refresh Schedules','Dataflows'],['Power BI Admin Docs','Microsoft RLS Guide','Power BI Gateway'],'Implement RLS for multi-tenant report'),
        w(8,'Certification & Deploy',['PL-300 Exam Prep','Power BI Service','Embedded Analytics','Report Server'],['PL-300 Study Guide','Microsoft Learn','Power BI Embedded Docs'],'Pass PL-300 and deploy enterprise dashboard'),
    ]
}
ROADMAPS['Tableau Developer'] = {
    'required_skills': ['tableau','sql','excel','statistics','data visualization','python','storytelling','lod expressions'],
    'weeks': [
        w(1,'Tableau Fundamentals',['Tableau Desktop Basics','Connecting to Data','Basic Chart Types','Filters'],['Tableau Training Videos','Tableau Docs','Andy Kriebel YouTube'],'Build your first Tableau dashboard'),
        w(2,'Data Preparation',['Data Interpreter','Pivot & Split','Joins & Unions','Tableau Prep'],['Tableau Prep Docs','Tableau Data Prep Tips','Flerlage Twins Blog'],'Clean and prepare a messy dataset'),
        w(3,'Calculations',['Calculated Fields','Table Calculations','Quick Table Calcs','Parameters'],['Tableau Calc Docs','Ken Flerlage Blog','Ryan Sleeper Book'],'Build 15 essential calculated fields'),
        w(4,'LOD Expressions',['FIXED LOD','INCLUDE LOD','EXCLUDE LOD','LOD Pitfalls'],['Tableau LOD Whitepaper','Tableau Help Docs','SuperDataScience'],'Solve 10 LOD expression challenges'),
        w(5,'Dashboard Design',['Dashboard Layout','Device Designer','Floating vs Tiled','Legends & Tooltips'],['Storytelling with Data Book','Tableau Design Docs','Anya A\'Hearn'],'Redesign 3 basic charts following best practices'),
        w(6,'Advanced Features',['Set Actions','Parameter Actions','Level of Detail','Jitter & Size'],['Tableau Advanced Course','Tableau Conference Talks','Adam Crahen'],'Build an interactive analytics dashboard'),
        w(7,'Storytelling & Presentation',['Tableau Stories','Annotations','Dashboard Actions','Presenting Data'],['Cole Nussbaumer Knaflic Book','Tableau Stories Guide','HBR Data Viz'],'Create a data story for a real dataset'),
        w(8,'Publish & Certify',['Tableau Public','Tableau Server/Cloud','Tableau Desktop Specialist Prep','Portfolio'],['Tableau Certification Guide','Tableau Public Best Practices','Tableau Community'],'Publish 5 dashboards and pass Tableau Specialist exam'),
    ]
}
ROADMAPS['Database Administrator'] = {
    'required_skills': ['sql','postgresql','mysql','oracle','backup recovery','performance tuning','replication','linux'],
    'weeks': [
        w(1,'RDBMS Fundamentals',['Relational Model','SQL DDL/DML','ACID Properties','Normalization'],['PostgreSQL Docs','MySQL Docs','RDBMS Concepts Book'],'Design and implement a normalized database'),
        w(2,'Advanced SQL',['Complex Joins','Window Functions','Subqueries','Stored Procedures & Triggers'],['Use The Index Luke','PostgreSQL Advanced','LeetCode SQL Hard'],'Optimize 10 slow queries'),
        w(3,'Database Design',['ER Modeling','Indexing Strategies','Partitioning','Constraints'],['Database Design Book','PostgreSQL Indexing','Erwin Data Modeler'],'Design a high-performance database schema'),
        w(4,'Performance Tuning',['Query Execution Plans','EXPLAIN ANALYZE','Index Tuning','Connection Pooling'],['Use The Index Luke','pgBadger','PgAdmin Tools'],'Reduce query time by 10x on sample data'),
        w(5,'Backup & Recovery',['pg_dump/pg_restore','Point-in-Time Recovery','WAL Archiving','Barman'],['PostgreSQL Backup Docs','Barman Docs','AWS RDS Backup'],'Set up automated backup and test recovery'),
        w(6,'High Availability',['Replication Setup','Patroni','HAProxy','Failover Procedures'],['Patroni Docs','Replication Docs','PgBouncer Docs'],'Configure primary-replica replication'),
        w(7,'Security & Monitoring',['Role-Based Access','Row Level Security','pgAudit','Monitoring Tools'],['PostgreSQL Security Docs','pgAudit Docs','Prometheus + PostgreSQL Exporter'],'Implement security audit trail'),
        w(8,'Cloud & NoSQL',['AWS RDS/Aurora','MongoDB DBA Basics','Redis Administration','Cloud Migrations'],['AWS RDS Docs','MongoDB DBA Course','Redis Docs'],'Migrate on-premise DB to AWS RDS'),
    ]
}

# ── CLOUD & DEVOPS ────────────────────────────────────────────────────────────
ROADMAPS['DevOps Engineer'] = {
    'required_skills': ['docker','kubernetes','aws','linux','git','ci/cd','terraform'],
    'weeks': [
        w(1,'Linux & Shell Scripting',['Linux Commands','Shell Scripting','File Permissions','Process Management'],['Linux Journey','The Linux Command Line Book','OverTheWire'],'Automate system tasks with bash scripts'),
        w(2,'Git & Version Control',['Git Advanced','Branching Strategy','GitHub Actions Intro','Code Review'],['Pro Git Book','Atlassian Git Tutorials','GitHub Docs'],'Set up Git workflow for a team project'),
        w(3,'Docker Containerization',['Docker Architecture','Dockerfile Best Practices','Docker Compose','Registry'],['Docker Docs','Play with Docker','TechWorld with Nana'],'Containerize a full stack application'),
        w(4,'CI/CD Pipelines',['GitHub Actions','Jenkins Basics','Pipeline as Code','Automated Testing'],['GitHub Actions Docs','Jenkins Docs','DevOps with GitLab'],'Build CI/CD pipeline for Node.js app'),
        w(5,'AWS Cloud',['EC2, S3, RDS','IAM & Security','Load Balancers','CloudWatch'],['AWS Free Tier','AWS Skill Builder','A Cloud Guru'],'Deploy app on AWS EC2 with S3'),
        w(6,'Kubernetes',['K8s Architecture','Pods & Deployments','Services & Ingress','Helm Charts'],['Kubernetes Docs','KodeKloud','Nana K8s Course'],'Deploy app on Minikube cluster'),
        w(7,'Infrastructure as Code',['Terraform Basics','AWS with Terraform','Ansible Basics','State Management'],['Terraform Docs','HashiCorp Learn','Ansible Docs'],'Provision AWS infra with Terraform'),
        w(8,'Monitoring & Security',['Prometheus & Grafana','Log Management','Security Scanning','Cost Optimization'],['Prometheus Docs','Grafana Docs','Trivy Security'],'Set up monitoring dashboard'),
    ]
}
ROADMAPS['Cloud Engineer'] = {
    'required_skills': ['aws','azure','gcp','linux','docker','kubernetes','terraform','networking'],
    'weeks': [
        w(1,'Cloud Fundamentals',['Cloud Service Models','Shared Responsibility','Regions & AZs','Pricing Models'],['AWS Cloud Practitioner','ACloudGuru','Cloud Guru YouTube'],'Pass AWS Cloud Practitioner or equivalent'),
        w(2,'Networking in Cloud',['VPC/VNet Design','Subnets & Security Groups','Load Balancers','DNS & Route53'],['AWS Networking Speciality','Networking Fundamentals','ACloudGuru Networking'],'Design a multi-tier VPC architecture'),
        w(3,'Core Cloud Services',['Compute (EC2/VMs)','Storage (S3/Blob)','Databases (RDS)','Serverless (Lambda)'],['AWS Solutions Architect Docs','Azure Architecture Center','GCP Docs'],'Deploy a 3-tier app on cloud'),
        w(4,'Containers & Orchestration',['Docker on Cloud','ECS/EKS/AKS','ECR/ACR','Helm Charts'],['AWS ECS Docs','EKS Workshop','AKS Docs'],'Deploy containerized app on managed K8s'),
        w(5,'Infrastructure as Code',['Terraform','CloudFormation/ARM','Terragrunt','Module Design'],['Terraform Registry','HashiCorp Learn','TerraformUp and Running Book'],'Provision entire cloud infra with Terraform'),
        w(6,'Security & Compliance',['IAM Best Practices','Secrets Management','CloudTrail/Security Center','WAF'],['AWS Security Specialty','CIS Benchmarks','Vault Docs'],'Implement cloud security best practices'),
        w(7,'Monitoring & Cost',['CloudWatch/Azure Monitor','Log Analytics','Cost Explorer','Tagging Strategy'],['AWS Cost Optimization','FinOps Foundation','Grafana Cloud'],'Build cost dashboard + alerting'),
        w(8,'Multi-Cloud & Certifications',['AWS SAA / Azure Administrator','Landing Zone Design','Service Mesh','DR Strategy'],['AWS Solutions Architect Cert','AZ-104','GCP ACE'],'Pass a cloud certification'),
    ]
}
ROADMAPS['AWS Engineer'] = {
    'required_skills': ['aws','ec2','s3','iam','vpc','lambda','rds','terraform','docker','python'],
    'weeks': [
        w(1,'AWS Foundations',['Core Services Overview','IAM Deep Dive','Billing & Cost Explorer','CLI Setup'],['AWS Docs','AWS Skill Builder','Stephane Maarek Udemy'],'Set up AWS account with least-privilege IAM'),
        w(2,'Compute & Networking',['EC2 Types & Sizing','VPC Design','Security Groups & NACLs','ELB & Auto Scaling'],['AWS EC2 Docs','AWS VPC Workshop','Adrian Cantrill Course'],'Build a high-availability EC2 architecture'),
        w(3,'Storage Services',['S3 Storage Classes','EBS & EFS','Lifecycle Policies','S3 Security'],['AWS S3 Docs','AWS Storage Workshop','AWS re:Invent S3 Talks'],'Design a multi-tier storage solution'),
        w(4,'Databases',['RDS Multi-AZ','Aurora Serverless','DynamoDB','ElastiCache'],['AWS Database Migration','DynamoDB Deep Dive','AWS Database Specialty'],'Deploy and optimize a production database'),
        w(5,'Serverless',['Lambda Functions','API Gateway','Step Functions','EventBridge','SQS/SNS'],['AWS Lambda Docs','Serverless Land','AWS SAM'],'Build a serverless REST API'),
        w(6,'DevOps on AWS',['CodePipeline','CodeBuild','CodeDeploy','CloudFormation','CDK'],['AWS DevOps Docs','CDK Workshop','AWS DevOps Professional'],'Build a full CI/CD pipeline on AWS'),
        w(7,'Security & Monitoring',['CloudTrail','AWS Config','GuardDuty','CloudWatch Alarms'],['AWS Security Hub','Well-Architected Security','AWS re:Inforce Talks'],'Implement security monitoring and alerts'),
        w(8,'Certification',['AWS SAA-C03 Prep','Practice Exams','Architecture Best Practices','Cost Optimization'],['Stephane Maarek Udemy','TutorialsDojo','AWS Well-Architected Labs'],'Pass AWS Solutions Architect Associate'),
    ]
}
ROADMAPS['Azure Engineer'] = {
    'required_skills': ['azure','az-104','vnets','azure ad','arm templates','bicep','aks','monitor'],
    'weeks': [
        w(1,'Azure Fundamentals',['Azure Portal & CLI','Resource Groups','Subscriptions & Management Groups','Cost Management'],['Microsoft Learn AZ-900','Azure Docs','John Savill YouTube'],'Pass AZ-900 Azure Fundamentals'),
        w(2,'Azure Networking',['Virtual Networks','NSGs','Azure Firewall','VPN Gateway & ExpressRoute'],['AZ-104 Networking','Azure Networking Docs','Thomas Maurer Blog'],'Design a hub-spoke network topology'),
        w(3,'Compute Services',['Azure VMs','Azure App Service','Azure Functions','Container Instances'],['Azure Compute Docs','Azure App Service Workshop','ACI Quickstart'],'Deploy a web app using App Service'),
        w(4,'Storage & Databases',['Azure Blob Storage','Azure SQL','Cosmos DB','Azure Cache for Redis'],['Azure Storage Docs','Cosmos DB Workshop','Azure SQL Docs'],'Build a database-backed application on Azure'),
        w(5,'Identity & Security',['Azure AD','RBAC','Managed Identities','Key Vault','Defender for Cloud'],['Microsoft Identity Docs','AZ-500 Study Guide','Azure Security Center'],'Implement zero-trust identity setup'),
        w(6,'IaC & DevOps',['ARM Templates','Bicep','Terraform on Azure','Azure DevOps Pipelines'],['Bicep Docs','Azure DevOps Labs','HashiCorp Azure Provider'],'Deploy infrastructure with Bicep + Azure DevOps'),
        w(7,'Kubernetes & Containers',['AKS Deployment','Azure Container Registry','Helm on AKS','GitOps with Flux'],['AKS Workshop','ACR Docs','Flux CD Docs'],'Deploy microservices to AKS'),
        w(8,'Certification',['AZ-104 Exam Prep','Practice Tests','Well-Architected Review','Monitoring Setup'],['AZ-104 Study Guide','MeasureUp','Azure Well-Architected Framework'],'Pass AZ-104 Azure Administrator'),
    ]
}
ROADMAPS['Google Cloud Engineer'] = {
    'required_skills': ['gcp','bigquery','gke','cloud run','terraform','iam','vpc','python'],
    'weeks': [
        w(1,'GCP Foundations',['GCP Console & gcloud CLI','Projects & Billing','IAM & Service Accounts','Cloud Shell'],['Google Cloud Fundamentals Course','Google Cloud Skills Boost','Antoni Tzavelas YouTube'],'Set up GCP project with proper IAM'),
        w(2,'Compute & Networking',['Compute Engine','GKE Intro','Cloud Run','VPC Networks & Firewall'],['GCP Compute Docs','GKE Quickstart','Cloud Run Docs'],'Deploy containerized app to Cloud Run'),
        w(3,'Storage & Databases',['Cloud Storage','Cloud SQL','Cloud Spanner','Bigtable/Firestore'],['GCP Storage Docs','Cloud SQL Docs','Firebase Docs'],'Build a serverless data app'),
        w(4,'Big Data & Analytics',['BigQuery','Dataflow','Pub/Sub','Looker Studio'],['BigQuery Sandbox','Google Data Engineering','Coursera Data Engineering GCP'],'Analyze a large dataset with BigQuery'),
        w(5,'AI/ML on GCP',['Vertex AI','AutoML','BigQuery ML','Generative AI Studio'],['Vertex AI Docs','Google AI Blog','Qwiklabs'],'Train and deploy a model on Vertex AI'),
        w(6,'Security & Compliance',['Cloud Armor','Secret Manager','Binary Authorization','Security Command Center'],['GCP Security Docs','CIS GCP Benchmarks','Google Cloud Security Talks'],'Implement security hardening'),
        w(7,'IaC & DevOps',['Terraform for GCP','Cloud Build','Artifact Registry','Cloud Deploy'],['GCP Terraform Provider','Cloud Build Docs','GCP DevOps Labs'],'Build CI/CD with Cloud Build + Terraform'),
        w(8,'Certification',['Associate Cloud Engineer Prep','Professional Cloud Architect','Practice Exams','Well-Architected'],['ACE Study Guide','PCA Study Guide','Google Cloud Skills Boost'],'Pass Associate Cloud Engineer exam'),
    ]
}
ROADMAPS['Site Reliability Engineer (SRE)'] = {
    'required_skills': ['linux','python','kubernetes','prometheus','grafana','chaos engineering','incident management','slo'],
    'weeks': [
        w(1,'SRE Principles',['SLI/SLO/SLA','Error Budgets','Toil Reduction','SRE vs DevOps'],['Google SRE Book','Google SRE Workbook','Charity Majors Blog'],'Define SLOs for an existing service'),
        w(2,'Observability',['Metrics vs Logs vs Traces','Prometheus Setup','Grafana Dashboards','Alertmanager'],['Prometheus Docs','Grafana Docs','OpenTelemetry Docs'],'Set up full observability stack'),
        w(3,'Incident Management',['Incident Lifecycle','Runbooks','Postmortem Culture','PagerDuty/OpsGenie'],['Incident.io Blog','Google SRE Incident Guide','PagerDuty Docs'],'Create incident runbooks for 5 failure modes'),
        w(4,'Kubernetes Operations',['Cluster Monitoring','HPA/VPA','Resource Limits','K8s Debugging'],['K8s SRE Guide','KubeCon Talks','Production K8s Book'],'Monitor and autoscale a K8s workload'),
        w(5,'Chaos Engineering',['Chaos Monkey','Chaos Mesh','Failure Injection','Game Days'],['Netflix Chaos Eng','Chaos Mesh Docs','Litmus Chaos'],'Run a game day chaos experiment'),
        w(6,'Performance Engineering',['Load Testing (k6/Locust)','Profiling Applications','Database Tuning','CDN Optimization'],['k6 Docs','Locust Docs','BPF Performance Tools'],'Find and fix a performance bottleneck'),
        w(7,'Automation & Toil Reduction',['Python Automation','Operator Patterns','Self-Healing Systems','Auto-remediation'],['Python SRE Recipes','K8s Operators','Netflix FAST Platform'],'Automate a manual operational task'),
        w(8,'Capacity Planning & Cost',['Capacity Planning Models','Cost Attribution','Rightsizing','FinOps for SRE'],['SRE Capacity Planning','FinOps Foundation','Cloud Cost Handbook'],'Build a capacity planning model'),
    ]
}
ROADMAPS['Platform Engineer'] = {
    'required_skills': ['kubernetes','terraform','docker','golang','helm','argocd','backstage','linux'],
    'weeks': [
        w(1,'Platform Engineering Concepts',['Internal Developer Platforms','Golden Paths','Paved Roads','IDP Design'],['Humanitec Platform Eng Whitepaper','Team Topologies Book','Gartner IDP Reports'],'Design an IDP architecture for your org'),
        w(2,'Kubernetes for Platforms',['Cluster Architecture','Multi-tenancy','RBAC','Custom Resources'],['K8s Docs','Production K8s Book','CNCF Landscape'],'Set up a multi-tenant K8s cluster'),
        w(3,'GitOps & Delivery',['ArgoCD','Flux CD','Helm Charts','Kustomize'],['ArgoCD Docs','Flux Docs','Codefresh GitOps'],'Implement GitOps for a sample application'),
        w(4,'Developer Self-Service',['Backstage IDP','Service Catalog','Software Templates','TechDocs'],['Backstage.io Docs','Spotify Backstage YouTube','Roadie.io'],'Set up Backstage with a service catalog'),
        w(5,'Infrastructure Automation',['Terraform Modules','Crossplane','Pulumi','Policy as Code'],['Crossplane Docs','Pulumi Docs','OPA Docs'],'Build a self-service infra provisioning module'),
        w(6,'Observability Platform',['Distributed Tracing','Central Logging (Loki)','SLO Management','Cost Attribution'],['Grafana Loki Docs','OpenTelemetry Docs','Sloth SLO'],'Build a centralized observability platform'),
        w(7,'Security & Compliance',['Policy as Code (OPA)','Image Scanning','Supply Chain Security','SBOM'],['OPA Docs','Kyverno Docs','Cosign / Sigstore'],'Implement policy enforcement for all deployments'),
        w(8,'Platform Metrics & DX',['DORA Metrics','Developer Satisfaction','Platform Adoption','Roadmap'],['DORA Research','Space Framework','Platform Eng Podcast'],'Measure and improve developer experience'),
    ]
}

# ── CYBER SECURITY ────────────────────────────────────────────────────────────
ROADMAPS['Cyber Security Analyst'] = {
    'required_skills': ['networking','linux','siem','incident response','malware analysis','python','wireshark','vulnerability assessment'],
    'weeks': [
        w(1,'Security Fundamentals',['CIA Triad','Common Threats','Security Frameworks (NIST/ISO 27001)','GRC Basics'],['CompTIA Security+','Cybrary','NIST Framework'],'Set up a personal cyber lab with VMs'),
        w(2,'Networking for Security',['TCP/IP Deep Dive','Wireshark Analysis','Firewalls & IDS/IPS','Network Protocols'],['Professor Messer Security+','Wireshark Docs','Cisco Networking Academy'],'Capture and analyze network traffic'),
        w(3,'Linux for Security',['Linux Hardening','Log Analysis','File Permissions','Bash Scripting for Security'],['OverTheWire','Linux Journey','TryHackMe Linux'],'Perform a Linux system audit'),
        w(4,'SIEM & Log Management',['Splunk Basics','ELK Stack','Log Correlation','Alert Tuning'],['Splunk Fundamentals Free','SANS SIEM Guide','Elastic Security Docs'],'Build a SIEM dashboard for a sample network'),
        w(5,'Vulnerability Assessment',['Nessus/OpenVAS','CVSS Scoring','Vulnerability Management Process','Patch Management'],['Nessus Docs','CVSS Calculator','NIST NVD'],'Conduct a vulnerability scan on a lab network'),
        w(6,'Incident Response',['IR Lifecycle','Memory Forensics','Malware Analysis Basics','IOC Hunting'],['SANS IR Guide','Autopsy Docs','VirusTotal'],'Handle a simulated security incident'),
        w(7,'Threat Intelligence',['MITRE ATT&CK','Threat Hunting','OSINT Techniques','Indicator Sharing'],['MITRE ATT&CK Framework','OpenCTI','OSINT Framework'],'Build a threat intelligence report'),
        w(8,'Certification & Portfolio',['CompTIA Security+ / CySA+','CTF Competitions','Bug Bounty Basics','Portfolio'],['TryHackMe','Hack The Box','CompTIA Study Guide'],'Pass Security+ exam and complete 10 CTF challenges'),
    ]
}
ROADMAPS['SOC Analyst'] = {
    'required_skills': ['siem','splunk','network monitoring','incident response','malware analysis','wireshark','linux','threat intel'],
    'weeks': [
        w(1,'SOC Fundamentals',['SOC Tiers (L1/L2/L3)','Security Operations Workflows','Ticketing Systems','Shift Handover'],['Cybrary SOC Analyst','TryHackMe SOC Path','SANS Blue Team'],'Set up a home SOC lab with SIEM'),
        w(2,'Log Analysis',['Windows Event Logs','Linux Syslog','Firewall & Proxy Logs','Correlation Rules'],['Windows Security Log Encyclopedia','SANS Log Management','Elastic SIEM'],'Analyze 1000 logs and find an anomaly'),
        w(3,'Network Security Monitoring',['Wireshark Deep Dive','Zeek/Suricata','Network Anomaly Detection','Traffic Baselining'],['Zeek Docs','Security Onion','Practical Packet Analysis Book'],'Detect malicious traffic in PCAP files'),
        w(4,'SIEM Operations',['Splunk SPL Queries','Elastic SIEM Rules','Dashboard Building','False Positive Tuning'],['Splunk Fundamentals 1','Elastic Security Docs','SANS SIEM Summit Talks'],'Build a SOC dashboard in Splunk or Elastic'),
        w(5,'Malware Analysis',['Static Analysis','Dynamic Sandboxing','IOC Extraction','Behavioral Analysis'],['Any.run Sandbox','Cuckoo Sandbox','Malware Traffic Analysis'],'Analyze 3 malware samples and write IOC reports'),
        w(6,'Incident Response',['Alert Triage','Containment & Eradication','Evidence Preservation','Chain of Custody'],['SANS IR Process','CISA Incident Response Guide','TheHive Project'],'Execute a full IR playbook on a simulated attack'),
        w(7,'Threat Hunting',['Hypothesis-Based Hunting','MITRE ATT&CK Hunting','Sigma Rules','Yara Rules'],['MITRE ATT&CK','Sigma GitHub','ThreatHunting.net'],'Hunt for a specific MITRE technique in logs'),
        w(8,'Certification',['CompTIA CySA+','BTL1 (Blue Team Labs)','TryHackMe SOC Level 2','Portfolio'],['CompTIA CySA+ Guide','Blue Team Labs Online','Hack The Box Blue'],'Pass CySA+ or BTL1 certification'),
    ]
}
ROADMAPS['Ethical Hacker'] = {
    'required_skills': ['linux','networking','python','kali linux','burp suite','metasploit','oscp','web security'],
    'weeks': [
        w(1,'Hacking Fundamentals',['Legal & Ethics','Hacking Phases','Lab Setup (Kali/Parrot)','Basic Recon'],['CEH Courseware','TryHackMe Intro','Cybrary Ethical Hacking'],'Set up Kali Linux and hack your first CTF'),
        w(2,'Reconnaissance',['Passive Recon (OSINT)','Active Recon','Nmap Scanning','Service Enumeration'],['OSINT Framework','Nmap Docs','TCM Security Recon Course'],'Perform full recon on a target VM'),
        w(3,'Vulnerability Scanning',['Nessus/OpenVAS','Manual Vulnerability Assessment','CVE Research','Exploit-DB'],['Nessus Training','ExploitDB','Metasploit Unleashed'],'Identify and document vulnerabilities on Metasploitable'),
        w(4,'Exploitation',['Metasploit Framework','Buffer Overflows','Password Attacks','Post Exploitation'],['Metasploit Unleashed','OverTheWire Narnia','TCM Security Buffer Overflow'],'Exploit 5 machines on TryHackMe/HTB'),
        w(5,'Web Application Hacking',['OWASP Top 10','Burp Suite','SQL Injection','XSS & CSRF'],['PortSwigger Web Academy','OWASP Testing Guide','Bug Bounty Bootcamp Book'],'Complete all PortSwigger Web Academy labs'),
        w(6,'Network Hacking',['Password Sniffing','Man in the Middle','Wireless Security (WPA2)','VPN Attacks'],['TCM Practical Network Pentesting','Aircrack-ng Docs','Wireshark for Security'],'Perform MITM attack in lab environment'),
        w(7,'Advanced Topics',['Active Directory Attacks','Privilege Escalation','Pivoting & Tunneling','Report Writing'],['TCM Active Directory Course','HackTricks','Pentest Report Templates'],'Compromise a full AD lab environment'),
        w(8,'Certification & Bug Bounty',['OSCP Preparation','eJPT / CEH','HackTheBox Pro Labs','Bug Bounty Platforms'],['Offensive Security OSCP','eLearnSecurity eJPT','HackerOne Hacktivity'],'Complete a HTB Pro Lab or submit a bug bounty'),
    ]
}
ROADMAPS['Penetration Tester'] = {
    'required_skills': ['kali linux','metasploit','burp suite','python','active directory','oscp','networking','report writing'],
    'weeks': [
        w(1,'Pentesting Methodology',['PTES Standard','Rules of Engagement','Scoping','Report Writing Basics'],['PTES Technical Guidelines','OWASP Testing Guide','Pentest.ws'],'Write a professional pentesting scope document'),
        w(2,'Network Penetration Testing',['Host Discovery','Port Scanning','Service Version Detection','OS Fingerprinting'],['Nmap Docs','TCM Network Course','Practical Network Pentesting'],'Perform a full network pentest on a lab'),
        w(3,'Web Application Pentesting',['Authentication Bypass','Injection Attacks','Broken Access Control','Business Logic Flaws'],['PortSwigger Web Security Academy','OWASP WSTG','Bug Bounty Bootcamp'],'Complete 50 PortSwigger labs'),
        w(4,'Active Directory Attacks',['Kerberoasting','Pass-the-Hash','BloodHound','DCSync'],['TCM AD Course','HackTricks AD','PentesterAcademy'],'Compromise a full AD environment'),
        w(5,'Mobile Pentesting',['Android APK Analysis','iOS Security','Frida','MobSF'],['OWASP Mobile Testing Guide','MobSF Docs','TCM Mobile Course'],'Pentest a sample Android application'),
        w(6,'Social Engineering',['Phishing Campaigns','GoPhish','Pretexting','Physical Security'],['Social Engineering Book','GoPhish Docs','SET Toolkit'],'Run a simulated phishing campaign'),
        w(7,'Exploit Development',['Buffer Overflow Basics','SEH Exploitation','Python Scripting Exploits','Bypassing AV'],['Corelan Exploit Dev','TCM Buffer Overflow','SLAE Course'],'Write a custom buffer overflow exploit'),
        w(8,'OSCP & Career',['OSCP PWK Lab Prep','24-hour Exam Strategy','Report Polish','CVE Research'],['Offensive Security PWK','Ippsec HTB Videos','TCM OSCP Prep'],'Pass OSCP certification'),
    ]
}
ROADMAPS['Security Engineer'] = {
    'required_skills': ['python','devsecops','cloud security','zero trust','sast/dast','kubernetes security','iam','threat modeling'],
    'weeks': [
        w(1,'Security Engineering Foundations',['Threat Modeling (STRIDE)','Attack Surface Analysis','Secure SDLC','Risk Assessment'],['Microsoft Threat Modeling Tool','OWASP Threat Dragon','SANS SEC530'],'Create a threat model for a web application'),
        w(2,'Application Security',['SAST Tools (SonarQube)','DAST Tools (ZAP)','SCA/Dependency Scanning','Code Review'],['OWASP Top 10 Dev Guide','SonarQube Docs','Snyk Docs'],'Integrate SAST/DAST into a CI/CD pipeline'),
        w(3,'Cloud Security',['AWS/Azure Security Best Practices','IAM Hardening','Cloud SIEM','CSPM Tools'],['AWS Security Best Practices','Prisma Cloud','Wiz.io'],'Audit a cloud environment with CSPM'),
        w(4,'Container & K8s Security',['Docker Security','K8s RBAC','PodSecurityStandards','Image Scanning'],['Docker Bench Security','NSA K8s Hardening Guide','Falco Docs'],'Harden a Kubernetes cluster'),
        w(5,'Identity & Zero Trust',['Zero Trust Architecture','OAuth2/OIDC','PAM Solutions','Service Mesh mTLS'],['Zero Trust NIST Guide','Okta Docs','Istio Security'],'Implement zero trust network access'),
        w(6,'DevSecOps',['Secrets Management','CI/CD Security Gates','IaC Security Scanning','Shift Left'],['HashiCorp Vault','Checkov Docs','Semgrep'],'Build a fully secured DevSecOps pipeline'),
        w(7,'Incident Response & Forensics',['Forensic Evidence Collection','Memory Forensics','Threat Hunting in Cloud','IR Playbooks'],['SANS FOR508','Volatility Framework','CloudTrail Forensics'],'Handle a cloud security incident simulation'),
        w(8,'Certification & Architecture',['CISSP / CSSLP / OSWE','Security Architecture Review','Design Patterns','Portfolio'],['CISSP Study Guide','OWASP ASVS','Security Champions Program'],'Pass CSSLP or achieve OSWE'),
    ]
}
ROADMAPS['Digital Forensics Analyst'] = {
    'required_skills': ['forensic tools','windows','linux','memory forensics','network forensics','python','evidence handling','autopsy'],
    'weeks': [
        w(1,'Digital Forensics Foundations',['Forensic Principles','Chain of Custody','Evidence Types','Legal Considerations'],['SANS FOR500','EC-Council CHFI','Handbook of Digital Forensics'],'Set up a forensic workstation with SIFT'),
        w(2,'Windows Forensics',['Registry Analysis','Windows Event Logs','MFT & NTFS Artifacts','Shellbag Analysis'],['Windows Forensics Analysis Book','SANS Cheat Sheets','RegRipper'],'Examine a Windows forensic image'),
        w(3,'Linux & Mac Forensics',['Linux File System Artifacts','Bash History','macOS Forensics','Disk Imaging'],['SANS FOR518 (macOS)','The Linux Forensics Book','Sleuth Kit Docs'],'Analyze a Linux forensic image'),
        w(4,'Memory Forensics',['RAM Acquisition','Volatility Framework','Process Analysis','Malware in Memory'],['The Art of Memory Forensics','Volatility Docs','MemLabs CTF'],'Perform malware detection with Volatility'),
        w(5,'Network Forensics',['PCAP Analysis','Wireshark Forensics','NetFlow Analysis','C2 Traffic Detection'],['Practical Packet Analysis Book','SANS FOR572','SecurityOnion'],'Reconstruct an attack from network logs'),
        w(6,'Mobile Forensics',['Android Forensics','iOS Forensics','Cellebrite / Oxygen','App Data Extraction'],['SANS FOR585','Oxygen Forensics Docs','Alexis Brignoni Blog'],'Extract and analyze mobile device data'),
        w(7,'Malware Forensics',['Static PE Analysis','Dynamic Analysis','Yara Rules','Threat Report Writing'],['Any.run','Cuckoo Sandbox','Malware Unicorn Workshops'],'Write a full malware analysis report'),
        w(8,'Certification',['GCFE / GCFA','CCE','EnCE Prep','Portfolio of Case Studies'],['GIAC Certifications','Magnet Forensics Resources','EnCase Training'],'Pass GCFE or GCFA certification'),
    ]
}
ROADMAPS['Cloud Security Engineer'] = {
    'required_skills': ['aws','azure','gcp','iam','zero trust','cspm','kubernetes security','terraform','python'],
    'weeks': [
        w(1,'Cloud Security Fundamentals',['Shared Responsibility Model','Cloud Threat Landscape','CIS Benchmarks','Cloud Compliance'],['AWS Security Fundamentals','CIS Controls','CCSP Study Guide'],'Audit a cloud account against CIS benchmarks'),
        w(2,'Identity & Access Management',['IAM Least Privilege','Service Accounts','Cross-Account Access','Identity Federation'],['AWS IAM Best Practices','Azure AD PIM','Google Cloud IAM Docs'],'Implement least privilege IAM across cloud'),
        w(3,'Network Security',['VPC Security Groups','WAF & Shield','Private Endpoints','PrivateLink'],['AWS Network Security','Azure Firewall Docs','GCP VPC Service Controls'],'Design a secure network architecture'),
        w(4,'Data Protection',['Encryption at Rest/Transit','KMS Key Management','DLP Policies','S3 Security'],['AWS KMS Docs','Azure Key Vault','Google Secret Manager'],'Implement end-to-end data encryption'),
        w(5,'CSPM & CWPP',['Cloud Security Posture Management','Workload Protection','Defender for Cloud','Prisma Cloud'],['Wiz.io','Prisma Cloud Docs','AWS Security Hub'],'Remediate CSPM findings in a cloud environment'),
        w(6,'Container & K8s Security',['Image Vulnerability Scanning','K8s Network Policies','Runtime Security with Falco','OPA Gatekeeper'],['Falco Docs','OPA Docs','Sysdig Secure'],'Secure a Kubernetes cluster end-to-end'),
        w(7,'DevSecOps Pipeline',['IaC Security (Checkov)','Secrets Detection','SAST in CI/CD','Supply Chain Security'],['Checkov Docs','Trivy Docs','Sigstore/Cosign'],'Build a cloud-native DevSecOps pipeline'),
        w(8,'Certification',['AWS Security Specialty','CCSP','Azure Security Engineer (AZ-500)','Penetration Testing Cloud'],['AWS Security Specialty Guide','CCSP Official Guide','AZ-500 Study Guide'],'Pass AWS Security Specialty or CCSP'),
    ]
}

# ── QA & TESTING ─────────────────────────────────────────────────────────────
ROADMAPS['QA Engineer'] = {
    'required_skills': ['manual testing','test cases','bug reporting','selenium','api testing','postman','sql','agile'],
    'weeks': [
        w(1,'QA Fundamentals',['SDLC & STLC','Test Planning','Test Case Design','Defect Life Cycle'],['ISTQB Foundation','Software Testing Help','Guru99 QA'],'Write a comprehensive test plan'),
        w(2,'Manual Testing Techniques',['Black Box Testing','Equivalence Partitioning','Boundary Value Analysis','State Transition'],['ISTQB Syllabus','Testing Techniques Guide','QA Stack Exchange'],'Write test cases for an e-commerce checkout'),
        w(3,'API Testing',['REST API Concepts','Postman Basics','API Test Cases','JSON Validation'],['Postman Docs','REST Assured Guide','Swagger Testing'],'Write and run 30 API test cases with Postman'),
        w(4,'Database Testing',['SQL for QA','Data Integrity Testing','Stored Procedure Testing','ETL Testing'],['SQL for Testers','MySQL QA Guide','DataQuality Book'],'Write SQL queries to verify data integrity'),
        w(5,'Test Management',['Jira for QA','TestRail','Bug Report Writing','Regression Testing Strategy'],['Jira Docs','TestRail Docs','ISTQB Test Management'],'Create a test management suite in TestRail/Jira'),
        w(6,'Agile Testing',['Scrum for Testers','Sprint Testing','Definition of Done','Three Amigos Meeting'],['Agile Testing Book','Atlassian Agile QA','Lisa Crispin Blog'],'Participate in a mock sprint as QA'),
        w(7,'Automation Introduction',['Selenium IDE','Basic Selenium WebDriver','TestNG Basics','Framework Concepts'],['Selenium Docs','Automation Testing Course','Free Selenium Course'],'Automate 10 test cases with Selenium IDE'),
        w(8,'Certification & Portfolio',['ISTQB Foundation Level','Test Portfolio','Bug Reports Portfolio','Interview Prep'],['ISTQB Foundation Syllabus','Software Testing Portfolio Guide','QA Interview Questions'],'Pass ISTQB Foundation Level certification'),
    ]
}
ROADMAPS['Automation Test Engineer'] = {
    'required_skills': ['selenium','java','python','testng','cucumber','rest assured','ci/cd','git'],
    'weeks': [
        w(1,'Automation Foundations',['Manual Testing Basics','Why Automation','Automation Tools Landscape','Test Pyramid'],['Test Automation University','Software Testing Help','Automation Step By Step'],'Set up Selenium WebDriver with Java/Python'),
        w(2,'Selenium WebDriver',['WebDriver Setup','Locators (XPath/CSS)','Page Object Model','Waits Strategy'],['Selenium Official Docs','Selenium with Java Course','Automation Testing Institute'],'Build Page Object Model framework'),
        w(3,'TestNG / JUnit',['Test Annotations','Data Providers','Test Suites','Parallel Execution'],['TestNG Docs','JUnit 5 Docs','Maven + TestNG Setup'],'Create a test suite with data-driven tests'),
        w(4,'BDD with Cucumber',['Gherkin Syntax','Feature Files','Step Definitions','Cucumber Reports'],['Cucumber Docs','BDD with Java Book','Serenity BDD'],'Convert existing tests to BDD Cucumber'),
        w(5,'API Test Automation',['REST Assured','Postman + Newman','Contract Testing','API Mocking'],['REST Assured Docs','Newman Docs','Pact Contract Testing'],'Automate 25 API tests with REST Assured'),
        w(6,'Advanced Automation',['Appium for Mobile','Visual Testing','Playwright','Cross-Browser Testing'],['Playwright Docs','Appium Docs','BrowserStack'],'Build cross-browser test suite with Playwright'),
        w(7,'CI/CD Integration',['Jenkins for Automation','GitHub Actions Tests','Test Reporting','Allure Reports'],['Jenkins Pipeline Docs','Allure Reports Docs','GitHub Actions QA'],'Integrate test suite into CI/CD pipeline'),
        w(8,'Framework & Portfolio',['Hybrid Framework Design','Dockerized Tests','Portfolio Projects','ISTQB-TAE Prep'],['Test Automation Framework Design','Docker for QA','TAE Syllabus'],'Build and publish a complete automation framework'),
    ]
}
ROADMAPS['Selenium Tester'] = {
    'required_skills': ['selenium','java','testng','xpath','css selectors','page object model','maven','git'],
    'weeks': [
        w(1,'Selenium Basics',['Selenium Architecture','WebDriver Setup','Browser Drivers','First Test'],['Selenium Docs','Arun Motoori Selenium','edureka Selenium'],'Write 5 basic Selenium tests'),
        w(2,'Locators',['ID/Name/Class','XPath (Absolute & Relative)','CSS Selectors','Link Text'],['XPath Axes Guide','CSS Selectors MDN','ChroPath Extension'],'Locate 50 elements using different strategies'),
        w(3,'WebDriver Actions',['Click/Type/Select','Mouse Actions','Keyboard Events','File Upload'],['Selenium WebDriver API','SeleniumEasy Examples','Actions Class Docs'],'Automate a form submission flow'),
        w(4,'Page Object Model',['POM Design Pattern','Page Factory','BasePage Class','Reusable Methods'],['POM Design Pattern Guide','Selenium POM Tutorial','Free Automation Testing'],'Convert basic tests to POM structure'),
        w(5,'TestNG Framework',['Annotations Deep Dive','Test Groups','Data Provider','XML Suite Configuration'],['TestNG Docs','Selen1 TestNG Course','Testing With TestNG Book'],'Create parameterized data-driven tests'),
        w(6,'Advanced Selenium',['Waits (Implicit/Explicit/Fluent)','Frames & Windows','JavaScript Executor','Screenshots'],['Selenium Waits Guide','Advanced Selenium Course','SeleniumHQ Blog'],'Handle complex web elements and AJAX'),
        w(7,'Reporting & CI/CD',['ExtentReports','Allure Reports','Maven Build','Jenkins Integration'],['ExtentReports Docs','Allure Docs','Jenkins + Maven Guide'],'Generate automated HTML reports in CI'),
        w(8,'Framework & Portfolio',['Hybrid Framework','Log4j Logging','Cross-Browser Grid','Portfolio Projects'],['Selenium Grid Docs','Log4j Docs','GitHub Portfolio'],'Build and publish a Selenium framework on GitHub'),
    ]
}
ROADMAPS['Performance Test Engineer'] = {
    'required_skills': ['jmeter','gatling','k6','load testing','performance analysis','sql','linux','monitoring'],
    'weeks': [
        w(1,'Performance Testing Fundamentals',['Types of Performance Tests','Key Metrics (TPS/RT/Errors)','Test Environment Setup','Baseline Testing'],['ISTQB Performance Testing','Performance Testing Guidance','Steve Smith Blog'],'Define performance requirements for an app'),
        w(2,'Apache JMeter',['JMeter Setup','Thread Groups','HTTP Samplers','Assertions & Listeners'],['Apache JMeter Docs','blazemeter JMeter Guide','JMeter Academy'],'Create a basic load test with JMeter'),
        w(3,'Advanced JMeter',['Parameterization','Correlation','JMeter Functions','Distributed Testing'],['JMeter Best Practices','BlazeMeter Docs','JMeter Plugin Manager'],'Build a correlation-based performance test'),
        w(4,'Gatling',['Gatling DSL','Simulation Design','Feeders','Reports'],['Gatling Docs','Gatling Academy','Gatling GitHub Examples'],'Write a Gatling simulation for a REST API'),
        w(5,'k6 Modern Load Testing',['k6 Scripting','Scenarios','Thresholds','k6 Cloud'],['k6 Docs','k6 YouTube','Grafana k6'],'Build a k6 performance test suite'),
        w(6,'Performance Analysis',['Bottleneck Identification','JVM Profiling','Database Query Analysis','APM Tools'],['Dynatrace Docs','New Relic Docs','VisualVM'],'Profile and identify bottlenecks in a Java app'),
        w(7,'Monitoring Integration',['Prometheus + Grafana','InfluxDB + JMeter','Real-Time Dashboards','Alerting'],['Grafana Performance Dashboards','InfluxDB JMeter Integration','Prometheus JMX Exporter'],'Build a real-time performance monitoring dashboard'),
        w(8,'Reports & Certification',['Performance Test Report Writing','ISTQB PT Certification','Non-Functional Requirements','Portfolio'],['ISTQB PT Specialist','Performance Testing Mastery Book','GitHub Portfolio'],'Write a professional performance test report'),
    ]
}
ROADMAPS['Software Test Engineer'] = {
    'required_skills': ['manual testing','api testing','selenium','sql','agile','test management','bug tracking','python'],
    'weeks': [
        w(1,'Testing Principles',['7 Testing Principles','Test Levels & Types','SDLC in Testing','Quality Assurance vs QC'],['ISTQB Foundation','Software Testing Help','Testing Excellence'],'Map test types to an SDLC project'),
        w(2,'Test Design Techniques',['Equivalence Partitioning','BVA','Decision Table','Use Case Testing'],['ISTQB Test Techniques','Testing Techniques A-Z','QA Stack Exchange'],'Design tests for 5 different business rules'),
        w(3,'Manual Test Execution',['Test Case Writing','Test Execution Reports','Defect Management','Re-testing & Regression'],['TestRail Docs','Zephyr Docs','Bug Report Template'],'Execute a full regression cycle'),
        w(4,'API Testing',['HTTP Methods','Postman Collections','JSON Schema Validation','Authentication Testing'],['Postman Docs','REST API Testing Guide','APIdog'],'Test a real public API with 30 test cases'),
        w(5,'Automation Basics',['Selenium Python','PyTest','Basic Framework Setup','POM'],['Selenium Python Docs','PyTest Docs','Automation Panda Blog'],'Automate 15 test cases in Python + Selenium'),
        w(6,'Agile Testing Practices',['Sprint Testing','Exploratory Testing','Risk-Based Testing','Test in CI'],['Agile Testing Book','Atlassian Sprint Testing','James Bach Exploratory'],'Join a sprint and test all user stories'),
        w(7,'Performance & Security Basics',['Load Testing with k6','OWASP Testing Basics','SQL Injection Tests','Security Headers'],['k6 Getting Started','OWASP WSTG','Security Testing Intro'],'Run a basic security test on a web application'),
        w(8,'Career & Certification',['ISTQB Foundation','Portfolio Building','Test Lead Path','Interview Preparation'],['ISTQB Foundation Guide','Testing Portfolio Guide','QA Interview Questions Book'],'Pass ISTQB Foundation and build testing portfolio'),
    ]
}

# ── NETWORKING ────────────────────────────────────────────────────────────────
ROADMAPS['Network Engineer'] = {
    'required_skills': ['networking','cisco','routing','switching','bgp','ospf','firewalls','linux','python'],
    'weeks': [
        w(1,'Networking Fundamentals',['OSI & TCP/IP Models','IP Addressing & Subnetting','DNS/DHCP/NAT','Ethernet & ARP'],['CompTIA Network+','Cisco CCNA 200-301','Professor Messer Network+'],'Subnet a /16 network into 20 usable subnets'),
        w(2,'Switching',['VLANs & Trunking','STP & Rapid STP','EtherChannel','Port Security'],['Cisco CCNA Switching Labs','GNS3 Labs','CBT Nuggets CCNA'],'Configure VLANs and trunking on GNS3'),
        w(3,'Routing',['Static Routing','OSPF','EIGRP','BGP Basics','Route Redistribution'],['Cisco CCNA Routing Labs','Jeremy\'s IT Lab','Network Chuck OSPF'],'Set up multi-area OSPF in GNS3'),
        w(4,'WAN & Internet',['MPLS Basics','SD-WAN Concepts','PPP & Frame Relay','Internet Connectivity Models'],['Cisco WAN Docs','SD-WAN VMware Docs','CCNP Route Prep'],'Configure a WAN simulation with GNS3'),
        w(5,'Network Security',['ACLs','Firewalls (ASA/Palo Alto)','VPNs (IPSec/SSL)','AAA & RADIUS'],['Cisco Firewall Training','Palo Alto EDU','CCNA Security Guide'],'Implement ACLs and VPN in a lab'),
        w(6,'Wireless Networking',['Wi-Fi Standards (802.11)','WPA3 Security','Wireless Controllers','RF Fundamentals'],['CWNA Study Guide','Cisco Wireless Docs','Ekahau Blog'],'Configure a wireless network with WPA3'),
        w(7,'Network Automation',['Python for Networking','Netmiko/Paramiko','Ansible for Network','YANG & RESTCONF'],['Network Programmability & Automation Book','Netmiko Docs','Cisco DevNet'],'Automate VLAN configuration with Python + Netmiko'),
        w(8,'Certification',['CCNA 200-301 Prep','Network+ Prep','Boson Practice Exams','Home Lab Projects'],['Cisco CCNA Study Guide','Boson ExSim','Jeremy\'s IT Lab CCNA'],'Pass CCNA 200-301 certification'),
    ]
}
ROADMAPS['System Administrator'] = {
    'required_skills': ['linux','windows server','active directory','powershell','bash','networking','virtualization','backup'],
    'weeks': [
        w(1,'Linux Administration',['Linux File System','User & Permission Management','Package Management','System Services'],['Linux Professional Institute','Linux Foundation Courses','The Linux Command Line Book'],'Set up a Linux server with proper security'),
        w(2,'Windows Server',['Active Directory Setup','Group Policy','DNS & DHCP Server','File & Print Services'],['Microsoft Learn Windows Server','MCSA Guides','TechNet Docs'],'Configure an AD domain with 20 users'),
        w(3,'Networking for SysAdmin',['TCP/IP Fundamentals','VLAN Concepts','Firewall Basics','Network Troubleshooting'],['CompTIA Network+','Professor Messer','Wireshark for SysAdmins'],'Troubleshoot 10 common network issues'),
        w(4,'Virtualization',['VMware vSphere','Hyper-V','Proxmox','Container Basics with Docker'],['VMware Learning','Proxmox Docs','Microsoft Hyper-V Docs'],'Set up a virtualized lab environment'),
        w(5,'Automation & Scripting',['Bash Scripting','PowerShell Scripting','Cron Jobs','Ansible Basics'],['Learn PowerShell Book','Bash Scripting Tutorial','Ansible Docs'],'Automate user provisioning with PowerShell'),
        w(6,'Backup & Recovery',['Backup Strategies (3-2-1)','Veeam Backup','Windows Server Backup','Disaster Recovery Planning'],['Veeam Docs','Windows Server Backup Docs','DR Planning Guide'],'Implement and test a backup & recovery plan'),
        w(7,'Monitoring & Security',['Nagios/Zabbix','Event Log Monitoring','Patch Management','Antivirus Management'],['Zabbix Docs','Nagios Docs','WSUS Configuration'],'Set up server monitoring with alerting'),
        w(8,'Cloud & Certification',['Azure Admin Basics','AWS EC2/IAM','CompTIA Server+','Portfolio Lab'],['AZ-104 Intro','AWS SysOps Associate','CompTIA Server+ Guide'],'Pass CompTIA Server+ or Azure Admin'),
    ]
}
ROADMAPS['Linux Administrator'] = {
    'required_skills': ['linux','bash','networking','systemd','ansible','docker','security hardening','monitoring'],
    'weeks': [
        w(1,'Linux Foundations',['Filesystem Hierarchy','File Permissions','Package Managers','Shell Basics'],['Linux Foundation Essentials','Red Hat RHCSA Path','Linux Journey'],'Manage users, groups and permissions'),
        w(2,'System Administration',['systemd Services','Runlevels & Boot','Process Management','Cron & At Jobs'],['RHCSA Study Guide','systemd Docs','LFS201 Linux Foundation'],'Configure systemd services and timers'),
        w(3,'Networking on Linux',['Network Configuration','iptables / firewalld','SSH Hardening','NFS & Samba'],['Linux Networking Docs','iptables Tutorial','RHCSA Networking Labs'],'Harden an SSH server and configure firewall'),
        w(4,'Storage & File Systems',['LVM Management','RAID Levels','NFS/SMB Shares','Disk Encryption (LUKS)'],['LVM How-To','RAID Docs','LUKS Encryption Guide'],'Set up LVM with snapshots and LUKS encryption'),
        w(5,'Shell Scripting & Automation',['Advanced Bash','AWK & SED','Expect Scripting','Ansible for Linux'],['Bash Cookbook Book','Advanced Bash Guide','Ansible for Linux Docs'],'Write 10 automation scripts for sysadmin tasks'),
        w(6,'Security Hardening',['CIS Benchmarks for Linux','SELinux/AppArmor','Audit Framework','Fail2ban'],['CIS Linux Benchmarks','SELinux Coloring Book','Lynis Security Audit'],'Harden a server to CIS Level 1 compliance'),
        w(7,'Monitoring & Logging',['rsyslog & journald','Prometheus Node Exporter','ELK for Linux Logs','Performance Monitoring'],['rsyslog Docs','Prometheus Node Exporter','ELK Stack for Linux'],'Build a Linux server monitoring dashboard'),
        w(8,'Certification',['RHCSA (EX200)','LPIC-1','LFCS (Linux Foundation)','Portfolio Projects'],['Red Hat RHCSA Prep','LPIC-1 Study Guide','LFCS Curriculum'],'Pass RHCSA or LPIC-1 certification'),
    ]
}
ROADMAPS['Infrastructure Engineer'] = {
    'required_skills': ['terraform','ansible','kubernetes','docker','aws','linux','monitoring','ci/cd'],
    'weeks': [
        w(1,'Infrastructure Fundamentals',['Data Center Concepts','Compute/Storage/Network','Virtualization','Cloud vs On-Premise'],['Infrastructure as Code Book','Data Center Handbook','VMware Fundamentals'],'Design a 3-tier infrastructure architecture'),
        w(2,'Linux & Scripting',['Advanced Linux Admin','Bash Automation','Python for Infra','SSH & Remote Management'],['Linux Foundation','Python for SysAdmins','Paramiko Docs'],'Automate server provisioning with bash scripts'),
        w(3,'Configuration Management',['Ansible Playbooks','Roles & Inventories','Ansible Vault','Idempotency'],['Ansible Docs','Jeff Geerling Ansible','Ansible for DevOps Book'],'Configure 10 servers consistently with Ansible'),
        w(4,'IaC with Terraform',['Terraform Modules','State Management','Workspaces','Terraform Cloud'],['Terraform Docs','HashiCorp Learn','Terraform Up & Running Book'],'Build reusable Terraform modules for AWS'),
        w(5,'Containerization',['Docker Production','Docker Swarm','Kubernetes Fundamentals','Helm'],['Docker Docs','Kubernetes Docs','Helm Docs'],'Migrate an app from VM to containers'),
        w(6,'Cloud Infrastructure',['Multi-AZ Architecture','Auto Scaling','Cost Optimization','Security Groups'],['AWS Architecture Center','Well-Architected Framework','Google SRE Book'],'Design and deploy a production cloud infra'),
        w(7,'Monitoring & Observability',['Prometheus + Grafana Stack','Centralized Logging','Distributed Tracing','Alerting'],['Prometheus Docs','Loki Docs','OpenTelemetry Docs'],'Build a complete observability stack'),
        w(8,'Automation & CI/CD',['GitOps with ArgoCD','Infrastructure Pipelines','Testing IaC','Runbook Automation'],['ArgoCD Docs','Atlantis Docs','Terratest'],'Implement GitOps for infrastructure changes'),
    ]
}

# ── UI / UX ───────────────────────────────────────────────────────────────────
ROADMAPS['UI Designer'] = {
    'required_skills': ['figma','typography','color theory','design systems','prototyping','css','accessibility','adobe xd'],
    'weeks': [
        w(1,'Design Fundamentals',['Visual Design Principles','Typography','Color Theory','Grid Systems'],['Design Principles Book','Google Material Design','Refactoring UI Book'],'Redesign a poorly designed app screen'),
        w(2,'Figma Mastery',['Components & Variants','Auto Layout','Styles & Libraries','Prototyping'],['Figma Official YouTube','Figma Academy','UI Collective'],'Build a reusable design system in Figma'),
        w(3,'Mobile UI Design',['iOS & Android Guidelines','Mobile Typography','Touch Targets','Gesture Design'],['Apple HIG','Material Design 3','Mobbin for Inspiration'],'Design a complete mobile app (5 screens)'),
        w(4,'Web UI Design',['Web Grids & Breakpoints','Web Typography','Navigation Patterns','Dark Mode Design'],['Refactoring UI Book','Awwwards','Land Book'],'Design a full responsive web product'),
        w(5,'Design Systems',['Atomic Design','Token-Based Design','Component Documentation','Storybook Integration'],['Brad Frost Atomic Design','Zeroheight','Storybook Docs'],'Build and document a design system'),
        w(6,'Interaction Design',['Micro-interactions','Animation Principles','Motion in UI','Figma Smart Animate'],['Figma Prototyping','After Effects for UI','UX in Motion Manifesto'],'Add meaningful animations to a prototype'),
        w(7,'Handoff & Collaboration',['Dev Handoff with Figma','Zeplin / Supernova','CSS Properties Export','Design Review Process'],['Figma Dev Mode','Zeplin Docs','Supernova Docs'],'Complete a design-to-dev handoff for a feature'),
        w(8,'Portfolio & Career',['Portfolio Website','Case Study Writing','Behance/Dribbble','Interview Prep'],['Bestfolios.com','Layers Conference Talks','ADPList Mentorship'],'Publish 3 case studies on portfolio'),
    ]
}
ROADMAPS['UX Designer'] = {
    'required_skills': ['user research','wireframing','prototyping','figma','usability testing','information architecture','accessibility','design thinking'],
    'weeks': [
        w(1,'UX Fundamentals',['Design Thinking Process','User-Centered Design','Cognitive Psychology','UX Laws'],['Nielsen Norman Group','Don\'t Make Me Think Book','Interaction Design Foundation'],'Conduct a heuristic evaluation of an app'),
        w(2,'User Research',['Interview Techniques','Surveys & Questionnaires','Contextual Inquiry','Competitive Analysis'],['Just Enough Research Book','Interviewing Users Book','Optimal Workshop'],'Conduct 5 user interviews and synthesize findings'),
        w(3,'Information Architecture',['Card Sorting','Tree Testing','Sitemaps','Navigation Design'],['IA Institute','Optimal Sort','UX Booth IA'],'Build a site map and run a tree test'),
        w(4,'Wireframing & Prototyping',['Lo-fi Wireframes','Hi-fi Prototyping','Figma Prototyping','Clickable Prototypes'],['Figma Docs','Prototyping Course','UX Design Bootcamp'],'Create lo-fi and hi-fi prototypes for an app'),
        w(5,'Usability Testing',['Moderated vs Unmoderated','Think-Aloud Protocol','Test Plan Writing','Affinity Mapping'],['Nielsen Norman Usability','Maze Docs','UserZoom Docs'],'Run a usability test with 5 participants'),
        w(6,'Accessibility (a11y)',['WCAG 2.1 Standards','Screen Reader Testing','Color Contrast','Keyboard Navigation'],['WebAIM','Deque University','a11y Project'],'Audit and fix accessibility issues in a design'),
        w(7,'Design Systems for UX',['Content Strategy','UX Writing','Pattern Libraries','Design Tokens'],['Mailchimp Content Style Guide','UX Writing Hub','Design System Checklist'],'Write UX copy for a complete product flow'),
        w(8,'Portfolio & Certification',['UX Case Studies','Google UX Design Certificate','ADPList Mentorship','Portfolio Website'],['Google UX Design Coursera','Bestfolios UX','Nielsen Norman UX Cert'],'Publish 2 complete UX case studies'),
    ]
}
ROADMAPS['Product Designer'] = {
    'required_skills': ['figma','user research','product thinking','prototyping','design systems','metrics','agile','stakeholder communication'],
    'weeks': [
        w(1,'Product Design Mindset',['Product Thinking','Business + User Goals','Design Strategy','OKRs & Metrics'],['Shape Up Book','JTBD Framework','Marty Cagan Inspired Book'],'Write a problem statement + success metrics for a feature'),
        w(2,'Discovery & Research',['Jobs-to-be-Done','Problem Framing','Market Research','User Interviews'],['JTBD Book','Teresa Torres Continuous Discovery','Intercom Research'],'Run a discovery sprint for a new feature'),
        w(3,'Ideation & Concepting',['Crazy 8s','Design Sprints','Concept Testing','Prioritization Frameworks'],['Sprint Book by Jake Knapp','How Might We','RICE Scoring'],'Run a Design Sprint in 5 days'),
        w(4,'UI & Interaction Design',['Visual Design Polish','Micro-interactions','Responsive Design','Component Design'],['Refactoring UI','Human Interface Guidelines','Material Design 3'],'Design a complete product feature end-to-end'),
        w(5,'Prototyping & Testing',['Figma Advanced Prototyping','A/B Testing Design','Usability Testing','Feature Flags'],['Figma Prototyping','Optimizely Docs','UserTesting Platform'],'Run an A/B test on a landing page design'),
        w(6,'Design Systems',['Figma Variables','Token Studio','Design-Dev Sync','Governance Model'],['Figma Variables Docs','Token Studio Docs','Zero Height'],'Build a scalable product design system'),
        w(7,'Data & Analytics for Design',['Product Metrics','Funnel Analysis','Heatmaps & Session Recording','Quantitative UX'],['Mixpanel','FullStory','Google Analytics 4'],'Analyze user data to identify design opportunities'),
        w(8,'Career & Portfolio',['Product Design Portfolio','Case Study Framework','Onsite Exercises','Salary Negotiation'],['Bestfolios','Uxfol.io','Levels.fyi Design Salaries'],'Publish a portfolio with 3 product design case studies'),
    ]
}

# ── BLOCKCHAIN ────────────────────────────────────────────────────────────────
ROADMAPS['Blockchain Developer'] = {
    'required_skills': ['solidity','ethereum','web3.js','hardhat','smart contracts','javascript','cryptography','defi'],
    'weeks': [
        w(1,'Blockchain Fundamentals',['Distributed Ledger','Consensus Mechanisms','Hash Functions','Public/Private Keys'],['Blockchain Basics Course','MIT OCW Blockchain','Bitcoin Whitepaper'],'Implement SHA-256 in Python from scratch'),
        w(2,'Ethereum & Solidity',['Ethereum Architecture','Solidity Syntax','Data Types','Functions & Modifiers'],['Solidity Docs','CryptoZombies','Patrick Collins YouTube'],'Write your first smart contract'),
        w(3,'Smart Contract Development',['ERC-20 Token','ERC-721 NFT','Contract Inheritance','Events & Errors'],['OpenZeppelin Docs','Solidity by Example','Alchemy University'],'Deploy an ERC-20 token to testnet'),
        w(4,'Development Tools',['Hardhat Framework','Remix IDE','Foundry','Etherscan Verification'],['Hardhat Docs','Foundry Book','Remix Docs'],'Build a full Hardhat project with tests'),
        w(5,'Web3 Frontend',['ethers.js / web3.js','MetaMask Integration','React + Web3','IPFS for Storage'],['ethers.js Docs','wagmi Docs','IPFS Docs'],'Build a Web3 dApp frontend'),
        w(6,'DeFi Protocols',['AMM & Liquidity Pools','Lending Protocols','Flash Loans','Yield Farming'],['Uniswap Docs','Compound Finance Docs','DeFi Developer Roadmap'],'Interact with Uniswap contracts programmatically'),
        w(7,'Security & Auditing',['Common Vulnerabilities (Reentrancy/Overflow)','Smart Contract Auditing','Slither','Echidna'],['Smart Contract Security','Trail of Bits Tools','Secureum Bootcamp'],'Audit a smart contract for vulnerabilities'),
        w(8,'Advanced & Portfolio',['Layer 2 Solutions','Cross-chain Bridges','ZK Proofs Intro','Portfolio DApp'],['L2Beat','StarkWare Docs','Polygon Docs'],'Deploy a complete DApp to mainnet/L2'),
    ]
}
ROADMAPS['Smart Contract Developer'] = {
    'required_skills': ['solidity','foundry','hardhat','openzeppelin','evm','gas optimization','security auditing','ethers.js'],
    'weeks': [
        w(1,'Solidity Deep Dive',['EVM Architecture','Storage vs Memory','ABI Encoding','Assembly Basics'],['Solidity Docs','EVM Codes','Noxx Blog Ethereum'],'Write a gas-optimized storage contract'),
        w(2,'Contract Patterns',['Factory Pattern','Proxy Pattern','Diamond Pattern','Access Control'],['OpenZeppelin Patterns','Ethereum Design Patterns Book','EIP Standards'],'Implement an upgradeable proxy contract'),
        w(3,'Token Standards',['ERC-20 from Scratch','ERC-721 NFT','ERC-1155 Multi-token','ERC-4626 Vault'],['EIPs GitHub','OpenZeppelin Contracts','Token Engineering Academy'],'Build and deploy all three token standards'),
        w(4,'DeFi Development',['AMM Implementation','Lending Pool','Staking Contracts','Price Oracles (Chainlink)'],['Chainlink Docs','Uniswap V3 Deep Dive','DeFi Developer Roadmap'],'Build a simple AMM from scratch'),
        w(5,'Testing Smart Contracts',['Hardhat Tests','Foundry Fuzz Testing','Invariant Testing','Fork Testing'],['Foundry Book Testing','Hardhat Testing Docs','Echidna Docs'],'Write 100% coverage tests for a DeFi protocol'),
        w(6,'Security & Auditing',['Common Vulnerabilities','Reentrancy Guards','Integer Overflow','Access Control Bugs'],['Consensys Smart Contract Best Practices','SWC Registry','Damn Vulnerable DeFi'],'Complete Damn Vulnerable DeFi challenges'),
        w(7,'Gas Optimization',['Storage Packing','Assembly Yul','Batch Operations','Gas Analysis Tools'],['Gas Optimization Tips Blog','Yul Docs','EVM Gas Explainer'],'Reduce gas costs by 50% on a sample contract'),
        w(8,'Production & Portfolio',['Mainnet Deployment','Contract Verification','Protocol Documentation','Security Audit Report'],['Etherscan Verification','NatSpec Docs','Audit Report Templates'],'Deploy and document a production-ready protocol'),
    ]
}
ROADMAPS['Web3 Developer'] = {
    'required_skills': ['javascript','solidity','react','ethers.js','metamask','ipfs','hardhat','wagmi'],
    'weeks': [
        w(1,'Web3 Concepts',['Blockchain Basics','Wallets & Keys','dApps Architecture','Web3 vs Web2'],['Patrick Collins Web3 Course','Alchemy University','Ethereum.org Docs'],'Set up MetaMask and interact with testnets'),
        w(2,'Solidity Basics',['Smart Contract Syntax','State Variables','Functions','Events'],['CryptoZombies','Solidity by Example','Remix Docs'],'Write and deploy 5 basic smart contracts'),
        w(3,'ethers.js / viem',['Provider & Signer','Contract Interaction','Transaction Signing','Event Listening'],['ethers.js v6 Docs','viem Docs','wagmi Docs'],'Build a wallet balance checker dApp'),
        w(4,'React + Web3',['wagmi Hooks','Rainbow Kit','WalletConnect','React Query for Web3'],['wagmi Docs','RainbowKit Docs','Web3 React Tutorial'],'Build a multi-wallet connection dApp'),
        w(5,'NFT Development',['ERC-721 Minting','IPFS Metadata','NFT Marketplace Basics','Royalties (ERC-2981)'],['NFT School','OpenSea Docs','Pinata IPFS'],'Build and deploy an NFT collection'),
        w(6,'DeFi Frontend',['Uniswap SDK','Token Swaps','Liquidity UI','Price Feeds'],['Uniswap Interface Code','Chainlink Frontend','DeFi UI Patterns'],'Build a simple token swap interface'),
        w(7,'Full Stack dApp',['Next.js + Web3','The Graph Protocol','IPFS + OrbitDB','Wallet Auth'],['The Graph Docs','Next.js Web3','Lit Protocol Docs'],'Build a full-stack decentralized social app'),
        w(8,'Portfolio & Launch',['Deploy to Vercel','Mainnet dApp','Open Source','Web3 Portfolio'],['BuildSpace','Alchemy Challenges','ETHGlobal Hackathons'],'Launch a real Web3 project or hackathon entry'),
    ]
}

# ── IoT ───────────────────────────────────────────────────────────────────────
ROADMAPS['IoT Developer'] = {
    'required_skills': ['python','c/c++','arduino','raspberry pi','mqtt','rest api','linux','sensors'],
    'weeks': [
        w(1,'IoT Fundamentals',['IoT Architecture Layers','Sensors & Actuators','Communication Protocols','IoT Security Basics'],['IoT Fundamentals Coursera','AWS IoT Docs','Edge Impulse Docs'],'Build a temperature monitoring prototype'),
        w(2,'Arduino Programming',['Arduino IDE','Sensors (DHT11/HC-SR04)','Digital/Analog I/O','I2C & SPI Communication'],['Arduino Official Docs','Random Nerd Tutorials','Paul McWhorter YouTube'],'Build a smart home sensor with Arduino'),
        w(3,'Raspberry Pi',['Raspberry Pi Setup','GPIO Programming','Linux on Pi','Camera Module'],['Raspberry Pi Docs','Real Python Pi','Jeff Geerling Pi'],'Build a Raspberry Pi-based IoT gateway'),
        w(4,'Communication Protocols',['MQTT Protocol','CoAP','HTTP vs MQTT','WiFi vs BLE vs Zigbee'],['MQTT.org','Eclipse Mosquitto','HiveMQ Docs'],'Set up an MQTT broker and publish sensor data'),
        w(5,'Cloud IoT',['AWS IoT Core','Azure IoT Hub','Google Cloud IoT','Edge Computing'],['AWS IoT Core Docs','Azure IoT Docs','Greengrass Docs'],'Connect devices to AWS IoT Core'),
        w(6,'Data Processing',['Time Series Databases','InfluxDB','Grafana for IoT','Edge ML with TFLite'],['InfluxDB Docs','Grafana IoT Dashboards','TensorFlow Lite Docs'],'Build an IoT data analytics dashboard'),
        w(7,'Security & OTA Updates',['Device Authentication','TLS for IoT','OTA Firmware Updates','Secure Boot'],['IoT Security Foundation','Mender.io','FreeRTOS OTA'],'Implement secure OTA updates for a device'),
        w(8,'Projects & Portfolio',['Smart Home Project','Industrial IoT','Hackathon','Portfolio'],['Hackster.io','Instructables','Arduino Project Hub'],'Build and publish a complete IoT project'),
    ]
}
ROADMAPS['Embedded Systems Engineer'] = {
    'required_skills': ['c','c++','microcontrollers','rtos','protocols','debugging','linux','hardware'],
    'weeks': [
        w(1,'C for Embedded',['Embedded C Syntax','Pointers & Memory','Bit Manipulation','Volatile & Const'],['Embedded Systems with ARM','Embedded C Programming Book','Neso Academy C'],'Write a bare-metal LED blink in C'),
        w(2,'Microcontroller Architecture',['ARM Cortex-M','Memory Maps','Clock Configuration','Startup Code'],['STM32 Reference Manual','Embedded Systems Architecture Book','Fastbit Embedded'],'Configure clocks and GPIO on STM32'),
        w(3,'Peripherals & Protocols',['UART/SPI/I2C','ADC & DAC','Timers & PWM','DMA Controllers'],['STM32 HAL Docs','I2C Specification','UART Tutorial'],'Interface with 3 different sensors using protocols'),
        w(4,'RTOS',['FreeRTOS Tasks','Semaphores & Mutexes','Queues','Priority Inversion'],['FreeRTOS Docs','RTOS Fundamentals Book','Interrupt Driven Firmware'],'Build a real-time multi-task application'),
        w(5,'Bootloaders & Memory',['Flash Memory Management','Custom Bootloader','Linker Scripts','Memory Sections'],['Bootloader Design','GCC Linker Guide','ARM Bootloader Tutorial'],'Write a simple bootloader for STM32'),
        w(6,'Debugging & Testing',['JTAG/SWD Debugging','Logic Analyzer','Unit Testing Embedded C','Hardware-in-Loop'],['OpenOCD Docs','Saleae Logic Analyzer','CppUTest Framework'],'Debug a hardware fault using JTAG and oscilloscope'),
        w(7,'Embedded Linux',['Yocto Project','Device Drivers','Kernel Modules','Buildroot'],['Yocto Docs','Linux Device Drivers Book','Bootlin Embedded Linux'],'Build a custom Linux for Raspberry Pi with Yocto'),
        w(8,'Projects & Certification',['End-to-End Embedded Project','RTOS-Based Product','CertEng (Renesas/ST)','Portfolio'],['ST Training','Renesas Certification','Embedded Systems Portfolio'],'Build a portfolio-quality embedded project'),
    ]
}
ROADMAPS['Firmware Engineer'] = {
    'required_skills': ['c','assembly','rtos','hardware protocols','debugging','jtag','power management','cmake'],
    'weeks': [
        w(1,'Firmware Basics',['Embedded C Mastery','Startup Sequences','Linker Scripts','Map Files'],['Embedded Systems Programming Book','Jacob Beningo Blog','Phillip Johnston Embedded'],'Write firmware for a bare-metal microcontroller'),
        w(2,'Hardware Interfaces',['GPIO','UART/SPI/I2C/CAN','External Memory Interfaces','USB Basics'],['ARM CMSIS Docs','NXP App Notes','STM32 Data Sheets'],'Implement all major protocols on a dev board'),
        w(3,'RTOS Implementation',['FreeRTOS Port','Task Management','ISR Safe APIs','Tickless Idle'],['FreeRTOS Porting Guide','Mastering FreeRTOS Book','RTOS for Embedded Systems Course'],'Port FreeRTOS to a custom microcontroller'),
        w(4,'Power Management',['Sleep Modes','Low Power Peripheral Config','Battery Life Calculations','Power Profiling'],['Nordic Power Profiler','STM32 Low Power App Note','Nordic Power Management'],'Extend battery life by 50% on a BLE device'),
        w(5,'Communication Stacks',['Bluetooth Low Energy (BLE)','Zigbee','LTE-M / NB-IoT','Ethernet Stack'],['Nordic nRF5 SDK','Zephyr BLE Docs','Sequans LTE-M Docs'],'Implement BLE GATT service from scratch'),
        w(6,'Security in Firmware',['Secure Boot','Code Signing','TLS on Embedded','Secure OTA'],['ARM TrustZone Docs','IETF SUIT Standard','Mender.io'],'Implement signed firmware update process'),
        w(7,'Testing & CI',['Unit Testing (Unity/CMock)','Hardware-in-Loop Testing','Static Analysis','Clang-Tidy'],['Unity Test Framework','CMock Docs','Ceedling Build Tool'],'Build automated testing pipeline for firmware'),
        w(8,'Portfolio & Career',['End Product Firmware','Open Source Contribution','Zephyr RTOS Contribution','Technical Blog'],['Zephyr RTOS GitHub','Embedded Artistry Blog','Firmware Portfolio Guide'],'Publish a complete firmware project on GitHub'),
    ]
}

# ── ERP ───────────────────────────────────────────────────────────────────────
ROADMAPS['SAP ABAP Developer'] = {
    'required_skills': ['abap','sap s/4hana','odata','bapi','smartforms','sql','object oriented abap','restful abap'],
    'weeks': [
        w(1,'ABAP Fundamentals',['ABAP Workbench','Data Types','Internal Tables','Modularization'],['SAP Learning Hub','ABAP Programming Guide','Open SAP ABAP Course'],'Write a simple ABAP report'),
        w(2,'Database Operations',['Open SQL','Native SQL','Table Buffering','Database Joins'],['SAP HANA SQL Docs','ABAP to HANA Migration','Open SAP HANA'],'Write optimized ABAP database queries'),
        w(3,'Classical ABAP',['BAPIs & Function Modules','BDC/LSMW','ALV Grid Reports','SmartForms/SAPscript'],['SAP Function Module Docs','ALV Guide','SmartForms Tutorial'],'Build a custom ALV report with actions'),
        w(4,'Object-Oriented ABAP',['Classes & Interfaces','Inheritance','Exception Handling','Design Patterns in ABAP'],['OO ABAP Book','SAP NetWeaver OO Docs','ABAP Objects Book'],'Convert procedural ABAP to OO ABAP'),
        w(5,'ABAP on HANA',['CDS Views','AMDP','Code Pushdown','HANA-Specific Functions'],['SAP HANA Academy','CDS View Tutorial','ABAP on HANA Book'],'Build analytical CDS views'),
        w(6,'RESTful ABAP',['RAP Framework','Business Objects','OData V4','Fiori Elements'],['SAP RAP Docs','ABAP RESTful Tutorial','Fiori Elements Docs'],'Build a Fiori app with RAP framework'),
        w(7,'Integration',['RFC/BAPI Integration','IDoc Processing','SAP PI/PO Basics','Web Services'],['SAP Integration Suite','IDocs Guide','RFC SDK Docs'],'Implement an integration using IDocs'),
        w(8,'Certification & Portfolio',['SAP ABAP Associate Cert','Custom Development Portfolio','Code Review Best Practices','SAP Community'],['SAP Certification Guide','SAP Community Blog','ABAP Best Practices Book'],'Pass SAP ABAP Associate certification'),
    ]
}
ROADMAPS['SAP Functional Consultant'] = {
    'required_skills': ['sap s/4hana','sap sd','sap mm','sap fi','business processes','gap analysis','user training','abap basics'],
    'weeks': [
        w(1,'SAP Overview',['SAP Architecture','S/4HANA Overview','Module Landscape','Navigation Basics'],['SAP Learning Hub','Open SAP Courses','SAP Press Books'],'Navigate SAP S/4HANA and complete 20 transactions'),
        w(2,'Core Modules',['FI (Finance)','MM (Materials Mgmt)','SD (Sales & Distribution)','PP (Production Planning)'],['SAP FI Configuration Guide','SAP MM Docs','SAP SD Bible'],'Configure a basic FI-MM-SD integration'),
        w(3,'Business Process Analysis',['Requirements Gathering','As-Is & To-Be Process Mapping','Gap Analysis','BBP Documents'],['ASAP Methodology','SAP Activate','Business Blueprint Templates'],'Create a business blueprint for an SD process'),
        w(4,'Configuration',['Enterprise Structure','Business Partners','Pricing Procedures','Output Types'],['SAP Configuration Guide','IMG Transaction','SAP Configuration Templates'],'Configure end-to-end Order-to-Cash process'),
        w(5,'SAP Activate Methodology',['Agile for SAP','Fit-Gap Sessions','Sprint Planning','Go-Live Prep'],['SAP Activate Docs','SAP Best Practices','Roadmap Viewer'],'Plan a mini SAP implementation project'),
        w(6,'Integration & Testing',['Process Integration','UAT Planning','Data Migration Basics','Cut-Over'],['SAP Data Migration','UAT Templates','LSMW/BODS Basics'],'Execute and document a UAT cycle'),
        w(7,'Reporting & Analytics',['SAP Fiori Apps','SAP Analytics Cloud','Custom Reports','BW Basics'],['SAP Fiori Apps Library','SAC Docs','BW/4HANA Intro'],'Build a Fiori-based business report'),
        w(8,'Certification',['SAP S/4HANA Associate Certification','Portfolio Projects','End-User Training Design','Go-Live Support'],['SAP Certification Hub','SAP Community Q&A','SAP Activate Cert'],'Pass SAP S/4HANA Associate exam'),
    ]
}
ROADMAPS['Salesforce Developer'] = {
    'required_skills': ['apex','lwc','salesforce admin','soql','rest api','git','javascript','flows'],
    'weeks': [
        w(1,'Salesforce Fundamentals',['CRM Concepts','Salesforce Architecture','Objects & Fields','Data Model'],['Trailhead Salesforce Basics','Salesforce Admin Cert Trail','SFDCFacts YouTube'],'Complete Salesforce Admin Basics Trailmix'),
        w(2,'Salesforce Admin',['Flows & Process Builder','Security Model','Reports & Dashboards','AppExchange'],['Salesforce Admin Trail','Admin Certification Guide','SalesforceBen.com'],'Build a complete sales automation flow'),
        w(3,'Apex Development',['Apex Syntax','SOQL Queries','DML Operations','Governor Limits'],['Apex Developer Guide','Apex Hours YouTube','Trailhead Apex Basics'],'Write 10 Apex trigger and class examples'),
        w(4,'LWC (Lightning Web Components)',['LWC Architecture','Component Communication','Wire Service','Base Components'],['LWC Docs','LWC Developer Guide','Salesforce Developers YouTube'],'Build a custom LWC component'),
        w(5,'Integration',['REST/SOAP API','Named Credentials','External Services','Platform Events'],['Salesforce Integration Architecture','REST API Docs','Platform Events Docs'],'Build a REST API integration with an external system'),
        w(6,'Advanced Development',['Aura Components','Visualforce Basics','Test Classes','Async Apex'],['Salesforce Apex Testing Guide','Async Apex Docs','Aura Docs'],'Write 100% test coverage for Apex classes'),
        w(7,'DevOps & CI/CD',['Salesforce DX','Scratch Orgs','GitHub Actions for Salesforce','SF CLI'],['SF CLI Docs','Salesforce DevOps Center','CumulusCI Docs'],'Set up a CI/CD pipeline for Salesforce'),
        w(8,'Certification',['Platform Developer I Exam','PD2 Prep','Trailblazer Community','Portfolio Org'],['PD1 Certification Guide','FocusonForce','Trailhead Playground'],'Pass Salesforce Platform Developer I certification'),
    ]
}

# ── GAME DEVELOPMENT ──────────────────────────────────────────────────────────
ROADMAPS['Unity Developer'] = {
    'required_skills': ['unity','c#','3d modeling basics','physics','shaders','animation','game design','git'],
    'weeks': [
        w(1,'Unity Fundamentals',['Unity Editor Navigation','GameObjects & Components','Scene Management','Prefabs'],['Unity Learn Platform','Brackeys YouTube','Sebastian Lague YouTube'],'Build a simple 3D rolling ball game'),
        w(2,'C# for Unity',['C# Syntax','MonoBehaviour Lifecycle','Coroutines','ScriptableObjects'],['C# in Unity Course','Jimmy Vegas YouTube','Code Monkey YouTube'],'Build a platformer character controller'),
        w(3,'Physics & Collisions',['Rigidbody & Colliders','Physics Materials','Raycasting','Triggers'],['Unity Physics Docs','Unity Game Physics Book','Brackeys Physics'],'Build a physics-based puzzle game'),
        w(4,'UI & Game Systems',['Unity UI Toolkit','Health Systems','Score Systems','Game State Manager'],['Unity UI Docs','GameDev.tv UI Course','Tarodev YouTube'],'Build a complete game with HUD'),
        w(5,'Shaders & Visual Effects',['URP/HDRP Shaders','Shader Graph','Particle Systems','Post-Processing'],['Unity Shader Graph Docs','Brackeys Shader Tutorials','Catlike Coding'],'Create a stylized game with custom shaders'),
        w(6,'Animation',['Animator Controller','Blend Trees','Inverse Kinematics','Cinemachine'],['Unity Animation Docs','Imphenzia YouTube','Cinemachine Docs'],'Animate a full character with blend trees'),
        w(7,'Audio & Optimization',['Unity Audio System','FMOD Integration','Profiler','LOD & Batching'],['FMOD Docs','Unity Optimization Guide','Unity Profiler Docs'],'Optimize a scene to run at 60fps on mobile'),
        w(8,'Publishing & Portfolio',['Android/iOS Build','PC Build','Asset Store','Portfolio Games'],['Unity Build Docs','Google Play Console','itch.io Publishing'],'Publish a complete game to itch.io'),
    ]
}
ROADMAPS['Unreal Engine Developer'] = {
    'required_skills': ['unreal engine','c++','blueprints','game design','3d math','shaders','niagara','git'],
    'weeks': [
        w(1,'Unreal Fundamentals',['Unreal Editor','Level Creation','Actors & Components','Blueprint Basics'],['Unreal Online Learning','Mathew Wadstein YouTube','Smart Poly YouTube'],'Build a simple Unreal first-person scene'),
        w(2,'Blueprint Visual Scripting',['Blueprint Nodes','Event Graph','Functions & Macros','Blueprint Interfaces'],['Unreal Blueprint Course','Virtus Learning Hub','UE5 Blueprint Docs'],'Build a complete game mechanic in Blueprints'),
        w(3,'C++ for Unreal',['Unreal C++ Syntax','AActor/UObject','UPROPERTY/UFUNCTION','UE Module System'],['Unreal C++ Documentation','Tom Looman Blog','Alex Forsythe YouTube'],'Port a Blueprint feature to C++'),
        w(4,'Character & Gameplay',['Character Movement','Game Mode & Game State','Input Mapping','AI Basics'],['Unreal Gameplay Framework Docs','CodeLikeMe YouTube','Gorka Games'],'Build a third-person character with abilities'),
        w(5,'Graphics & Rendering',['Lumen GI','Nanite','Material Editor','Niagara VFX'],['Unreal Materials Docs','William Faucher YouTube','Josh Powers Lumen'],'Create a photorealistic environment with Lumen'),
        w(6,'Animation',['Animation Blueprints','Inverse Kinematics','Sequencer','Motion Matching'],['Unreal Animation Docs','Reallusion + UE5','Control Rig Docs'],'Rig and animate a full game character'),
        w(7,'Multiplayer Basics',['Unreal Networking Model','Replication','Game Instance','Online Subsystem'],['Unreal Networking Docs','Cedric Neukirchen Blog','Network Compendium'],'Build a basic 2-player multiplayer prototype'),
        w(8,'Optimization & Publish',['CPU/GPU Profiling','Instanced Rendering','Platform Builds','Portfolio Project'],['Unreal Optimization Docs','Nick Pettit Talks','GDC Unreal Talks'],'Ship a polished demo on itch.io'),
    ]
}
ROADMAPS['Game Developer'] = {
    'required_skills': ['game design','unity or unreal','c# or c++','2d/3d math','physics','git','game mechanics','level design'],
    'weeks': [
        w(1,'Game Design Foundations',['Core Game Loop','Game Mechanics','Player Psychology','Level Design Principles'],['Game Design Workshop Book','Jesse Schell Art of Game Design','GDC Talks'],'Design a 1-page game design document'),
        w(2,'Game Math',['Vectors & Dot Product','Matrices & Transforms','Trigonometry','Physics Simulation'],['Math for Game Devs YouTube','3Blue1Brown','Game Math for Programmers Book'],'Implement vector math from scratch'),
        w(3,'2D Game Development',['Sprite Animation','Tilemap Design','2D Physics','Camera Systems'],['Unity 2D Course','Phaser.js for Web Games','Godot 2D Docs'],'Build a complete 2D platformer'),
        w(4,'3D Game Development',['3D Asset Pipeline','Mesh & Materials','3D Physics','Camera Rigs'],['Blender Fundamentals','Unity 3D Course','Unreal 3D Tutorial'],'Build a 3D third-person game prototype'),
        w(5,'Game AI',['Pathfinding (A*)','State Machines','Behavior Trees','NavMesh'],['AI for Games Book','GDC AI Summit Talks','Unity NavMesh Docs'],'Implement enemy AI with pathfinding'),
        w(6,'Multiplayer & Networking',['Client-Server Model','Peer-to-Peer','Lag Compensation','Mirror/Photon'],['Mirror Networking','Photon Engine Docs','Valve Networking Article'],'Build a 2-player networked game'),
        w(7,'Game Polish & UX',['Juice & Feel','Screen Shake','Sound Design','UI/UX for Games'],['Juice It or Lose It GDC','Gamemaker\'s Toolkit YouTube','bfxr Sound Tool'],'Add polish and juice to an existing game'),
        w(8,'Launch & Portfolio',['itch.io Publishing','Game Jam Participation','App Store/Steam','GDC / IndieDevDay'],['itch.io Docs','Ludum Dare','Steam Greenlight'],'Publish a game and submit to a game jam'),
    ]
}

# ── OTHER EMERGING ROLES ──────────────────────────────────────────────────────
ROADMAPS['AR/VR Developer'] = {
    'required_skills': ['unity','unreal','c#','c++','openxr','3d modeling','spatial design','shader programming'],
    'weeks': [
        w(1,'XR Fundamentals',['VR vs AR vs MR','Headset Ecosystem','6DoF vs 3DoF','XR Design Principles'],['Meta XR Developer','Apple Vision Pro Docs','XR Design Best Practices'],'Set up a VR development environment'),
        w(2,'Unity XR Development',['XR Interaction Toolkit','XR Origin','Hand Tracking','Controller Input'],['Unity XR Toolkit Docs','Valem YouTube','Justin P Barnard'],'Build a basic VR interactive scene'),
        w(3,'Spatial UI/UX',['Diegetic vs Non-Diegetic UI','3D UI Panels','Gaze & Raycasting','Accessibility in XR'],['Microsoft Mixed Reality Design','XR Design Guide','XR Best Practices'],'Design and implement a spatial UI'),
        w(4,'AR Development',['ARFoundation','Plane Detection','Image Tracking','AR Anchors'],['ARFoundation Docs','Niantic Lightship','Apple ARKit Docs'],'Build an AR app with object placement'),
        w(5,'3D Content & Optimization',['glTF Format','Mesh Optimization','Draw Call Reduction','Texture Atlasing'],['Khronos glTF Docs','Meta Performance Guidelines','Mixed Reality Toolkit'],'Optimize a scene for 90fps on headset'),
        w(6,'Multiplayer XR',['Photon Voice for VR','Shared Anchors','Avatar Systems','NetCode for XR'],['Photon XR Docs','Azure Spatial Anchors','VRChat SDK'],'Build a 2-player shared XR experience'),
        w(7,'Platform Deployment',['Meta Quest Build','HoloLens Deployment','VisionOS','WebXR'],['Meta Quest Docs','MRTK Docs','WebXR Device API'],'Ship a build to a real headset'),
        w(8,'Portfolio & Industry',['XR Portfolio','Game Jams (GMTK)','XR Conferences','Open Source XR'],['AWE Conference','XR Association','OpenXR GitHub'],'Complete and publish an XR portfolio project'),
    ]
}
ROADMAPS['MLOps Engineer'] = {
    'required_skills': ['python','mlflow','kubeflow','docker','kubernetes','ci/cd','cloud','data pipelines'],
    'weeks': [
        w(1,'MLOps Foundations',['MLOps vs DevOps','ML Lifecycle','Technical Debt in ML','MLOps Maturity Model'],['Made With ML','MLOps Community','Practical MLOps Book'],'Audit an existing ML project for MLOps gaps'),
        w(2,'Experiment Tracking',['MLflow Tracking','W&B Experiments','DVC Data Versioning','Model Registry'],['MLflow Docs','Weights & Biases Docs','DVC Docs'],'Set up experiment tracking for a model'),
        w(3,'ML Pipelines',['Kubeflow Pipelines','Apache Airflow for ML','ZenML','Prefect'],['Kubeflow Docs','ZenML Docs','Airflow ML Patterns'],'Build a reproducible ML training pipeline'),
        w(4,'Model Serving',['FastAPI Model API','TorchServe','TF Serving','Triton Inference Server'],['FastAPI Docs','Triton Docs','BentoML'],'Deploy a model with < 100ms latency'),
        w(5,'Containerization for ML',['Docker for ML','Multi-stage ML Images','GPU Docker','Model Package'],['NVIDIA Docker Docs','Docker ML Best Practices','Seldon Core'],'Build and push an optimized ML Docker image'),
        w(6,'Kubernetes for ML',['K8s ML Workloads','GPU Scheduling','Argo Workflows','Ray Cluster'],['Ray Docs','Argo Workflows Docs','KEDA for ML'],'Deploy a scalable model serving on K8s'),
        w(7,'Monitoring & Drift',['Data Drift Detection','Model Performance Monitoring','A/B Testing ML','Retraining Triggers'],['Evidently AI','WhyLabs','Arize AI'],'Set up ML model monitoring with alerting'),
        w(8,'Feature Store & DataOps',['Feast Feature Store','Tecton','Data Quality','Online vs Offline Store'],['Feast Docs','Tecton Blog','Great Expectations'],'Implement a feature store for a production model'),
    ]
}
ROADMAPS['AI Product Engineer'] = {
    'required_skills': ['python','llm apis','product thinking','react','fastapi','ux design','prompt engineering','docker'],
    'weeks': [
        w(1,'AI Product Fundamentals',['AI Product vs Traditional Product','AI Capabilities & Limits','Use Case Identification','AI Ethics'],['Reforge AI Product','a16z AI Essays','Product Hunt AI Examples'],'Identify and scope 3 AI product opportunities'),
        w(2,'LLM Product Development',['OpenAI/Anthropic/Gemini APIs','Prompt Management','Context Engineering','Cost Optimization'],['OpenAI Cookbook','Anthropic Guides','LangSmith Docs'],'Build an LLM-powered product feature'),
        w(3,'AI UX Design',['AI Mental Models','Trust in AI Products','Explainable AI UX','Human-in-the-Loop'],['Google PAIR Guidebook','Microsoft HAX Toolkit','UX for AI Blog'],'Design AI interaction patterns for a product'),
        w(4,'AI-Powered Backend',['FastAPI + LLM','Streaming Responses','RAG Product Features','Tool Calling'],['FastAPI Docs','LangChain Docs','Instructor Library'],'Build a production AI backend with streaming'),
        w(5,'AI Frontend',['React + AI Streams','AI SDK by Vercel','Rendering AI Responses','Loading States for AI'],['Vercel AI SDK','ai npm Package','OpenAI Streaming Docs'],'Build a real-time AI chat interface'),
        w(6,'Evaluation & Quality',['LLM Evals','Human Evaluation','Hallucination Detection','Red Teaming'],['RAGAS Docs','Promptfoo','Braintrust Eval'],'Build an evaluation pipeline for your AI feature'),
        w(7,'Scale & Cost',['Prompt Caching','Model Selection Strategy','Rate Limiting','Tiered AI Features'],['Anthropic Caching Docs','LiteLLM','AI Cost Calculator'],'Reduce AI feature cost by 50%'),
        w(8,'Launch & Iteration',['AI Product Launch','User Feedback Loops','A/B Testing AI','Growth Metrics'],['Reforge Growth','Lenny\'s Newsletter AI','Product-Led Growth'],'Launch an AI product and measure it'),
    ]
}
ROADMAPS['AI Automation Engineer'] = {
    'required_skills': ['python','n8n','zapier','llm apis','rpa','apis','workflow automation','javascript'],
    'weeks': [
        w(1,'Automation Fundamentals',['Manual vs Automated Workflows','RPA Concepts','AI Automation Stack','ROI Calculation'],['UiPath Academy','Automation Anywhere University','n8n Docs'],'Map and automate a manual business process'),
        w(2,'No-Code Automation',['n8n Workflows','Make (Integromat)','Zapier Advanced','Webhook Design'],['n8n Docs','Make Docs','Zapier Blog'],'Build a 10-step automated workflow'),
        w(3,'AI-Powered Automation',['LLM in Workflows','Document Processing','Email Automation with AI','Data Extraction'],['LangChain Agents','OpenAI Function Calling','n8n AI Nodes'],'Automate document processing with AI'),
        w(4,'RPA Development',['UiPath Studio','Blue Prism Basics','Automation Anywhere','Bot Design Patterns'],['UiPath Academy Free','RPA Developer Foundation','Automation Anywhere Docs'],'Build an attended RPA bot'),
        w(5,'API Automation',['REST API Chaining','API Transformation','Error Handling','Retry Logic'],['Postman Flows','RapidAPI','Pipedream Docs'],'Build a multi-API data aggregation pipeline'),
        w(6,'AI Agents for Automation',['LangGraph Agents','Tool Calling Agents','Multi-Agent Coordination','Human-in-the-Loop'],['LangGraph Docs','AutoGPT Concepts','CrewAI'],'Build an AI agent that automates research'),
        w(7,'Monitoring & Reliability',['Workflow Monitoring','Error Alerting','Audit Logging','SLA for Automations'],['n8n Error Handling','Datadog for Automation','Grafana Alerting'],'Add monitoring and alerting to your automations'),
        w(8,'Enterprise Deployment',['Scalable Architecture','Security in Automation','COE (Center of Excellence)','Portfolio'],['UiPath CoE Guide','Automation First Culture','RPA Portfolio Projects'],'Deploy and document an enterprise automation'),
    ]
}
ROADMAPS['Quantum Computing Researcher'] = {
    'required_skills': ['python','quantum mechanics','linear algebra','qiskit','quantum algorithms','mathematics','research writing','numpy'],
    'weeks': [
        w(1,'Quantum Computing Foundations',['Quantum Bits (Qubits)','Superposition & Entanglement','Quantum Gates','Bloch Sphere'],['IBM Qiskit Textbook','Quantum Country','Nielsen & Chuang Book'],'Implement Hadamard and CNOT gates in Qiskit'),
        w(2,'Quantum Circuits',['Single Qubit Gates','Multi Qubit Gates','Measurement','Circuit Composition'],['Qiskit Circuit Docs','Quirk Circuit Simulator','Quantum Katas'],'Build a Bell state circuit'),
        w(3,'Quantum Algorithms',['Grover\'s Algorithm','Shor\'s Algorithm','Quantum Fourier Transform','Phase Estimation'],['IBM Qiskit Algorithms','Qiskit Algorithm Textbook','Lin Lin Quantum Algorithms'],'Implement Grover\'s search in Qiskit'),
        w(4,'Quantum Error Correction',['Bit Flip Code','Phase Flip Code','Shor Code','Surface Codes'],['Qiskit Error Correction','Preskill Lecture Notes','QEC Zoo'],'Implement a simple quantum error correction code'),
        w(5,'Quantum Machine Learning',['VQE','QAOA','Quantum Neural Networks','PennyLane'],['PennyLane Docs','Qiskit Machine Learning','Maria Schuld Lectures'],'Build a variational quantum classifier'),
        w(6,'Near-Term Quantum (NISQ)',['NISQ Devices','Noise Mitigation','Quantum Volume','Device Benchmarking'],['IBM Quantum Systems','Qiskit Runtime Docs','NISQ Era Review Papers'],'Run a real circuit on IBM Quantum hardware'),
        w(7,'Research Methods',['Quantum Computing Papers','Literature Review','LaTeX Writing','arXiv Submission'],['arXiv Quantum Physics','Quantum Journal','IEEE Quantum Week'],'Write a literature review on a quantum topic'),
        w(8,'Specialization & Career',['Quantum Chemistry','Quantum Finance','Quantum Cryptography','PhD/Research Path'],['PySCF for QC','Quantum Finance Qiskit','BB84 Protocol'],'Present a quantum computing research project'),
    ]
}

# ── GENERATE ROADMAP FUNCTION + ENDPOINT ─────────────────────────────────────
def generate_roadmap(target_role: str, current_skills: list) -> dict:
    current_lower = [s.lower() for s in current_skills]
    roadmap_data = ROADMAPS.get(target_role, ROADMAPS.get('Full Stack Developer'))
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

@router.get("/roles")
def list_roles():
    """Returns all supported roles grouped by category."""
    return {
        "Software Development": ["Frontend Developer","Backend Developer","Full Stack Developer","Java Developer","Python Developer","C++ Developer",".NET Developer","Mobile App Developer","Android Developer","iOS Developer","Software Engineer","Software Architect"],
        "Artificial Intelligence": ["AI Engineer","Machine Learning Engineer","Deep Learning Engineer","Generative AI Engineer","Prompt Engineer","LLM Engineer","NLP Engineer","Computer Vision Engineer","Robotics Engineer"],
        "Data Domain": ["Data Analyst","Business Analyst","Data Scientist","Data Engineer","BI Developer","Power BI Developer","Tableau Developer","Database Administrator"],
        "Cloud & DevOps": ["DevOps Engineer","Cloud Engineer","AWS Engineer","Azure Engineer","Google Cloud Engineer","Site Reliability Engineer (SRE)","Platform Engineer"],
        "Cyber Security": ["Cyber Security Analyst","SOC Analyst","Ethical Hacker","Penetration Tester","Security Engineer","Digital Forensics Analyst","Cloud Security Engineer"],
        "QA & Testing": ["QA Engineer","Software Test Engineer","Automation Test Engineer","Selenium Tester","Performance Test Engineer"],
        "Networking": ["Network Engineer","System Administrator","Linux Administrator","Infrastructure Engineer"],
        "UI / UX": ["UI Designer","UX Designer","Product Designer"],
        "Blockchain": ["Blockchain Developer","Smart Contract Developer","Web3 Developer"],
        "IoT": ["IoT Developer","Embedded Systems Engineer","Firmware Engineer"],
        "ERP": ["SAP ABAP Developer","SAP Functional Consultant","Salesforce Developer"],
        "Game Development": ["Unity Developer","Unreal Engine Developer","Game Developer"],
        "Emerging Roles": ["AR/VR Developer","MLOps Engineer","AI Product Engineer","AI Automation Engineer","Quantum Computing Researcher"]
    }
