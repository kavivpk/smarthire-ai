# SmartHire AI
## System Architecture

Version: 2.0

---

# Purpose

This document defines the high-level architecture of SmartHire AI.

Its purpose is to explain how every module communicates, how AI Agents interact, and how the system should evolve into an Enterprise Multi-Agent Recruitment Intelligence Platform.

This document describes architecture only.

Implementation details are documented separately.

---

# Architecture Principles

The architecture must satisfy the following principles.

- Modular
- Scalable
- Maintainable
- API First
- Service Oriented
- Event Driven where appropriate
- AI Ready
- Cloud Ready
- Docker Friendly
- Production Ready

---

# Existing Architecture

The project already contains:

Frontend

- React.js
- Tailwind CSS

Backend

- Node.js
- Express.js
- FastAPI

AI

- Python
- spaCy
- Scikit-learn

Database

- MongoDB

Communication

- REST API
- Socket.io

Deployment

- Docker
- AWS

This architecture must be preserved.

---

# Upgrade Strategy

The project must evolve.

NOT rebuild.

Version 1

Feature Based Platform

↓

Version 2

Enterprise Multi-Agent Platform

Every upgrade must preserve existing functionality.

---

# High Level Architecture

```
                   Users

         Candidate | Recruiter | HR

                    │

                    ▼

              React Frontend

                    │

        ┌───────────┴────────────┐

        ▼                        ▼

 Node.js Backend          FastAPI AI Service

        │                        │

        │                        │

        └──────────┬─────────────┘

                   ▼

           MongoDB Database

                   │

                   ▼

        AI Models / NLP / ML Engine
```

---

# Frontend Responsibilities

The React application should be responsible only for:

- User Interface
- Authentication
- Routing
- State Management
- API Communication
- Real-Time Updates
- Visualization

Business logic should never exist inside React components.

---

# Backend Responsibilities

Node.js Backend should handle:

- Authentication
- User Management
- Recruiter APIs
- Candidate APIs
- Dashboard APIs
- File Upload
- Notifications
- Socket.io
- Business Rules
- API Gateway

Node.js should remain the primary backend.

---

# AI Service Responsibilities

FastAPI should become the dedicated AI layer.

It should handle:

- Resume Parsing
- ATS Analysis
- NLP
- Fake Skill Detection
- AI Interview Evaluation
- Coding Analysis
- Recommendation Engine
- Future AI Agents

FastAPI should never replace Node.js.

Instead,

Node.js communicates with FastAPI.

---

# Database Responsibilities

MongoDB stores:

- Users
- Recruiters
- Candidates
- Resumes
- Interview Results
- Coding Reports
- ATS Reports
- Hiring Reports
- Analytics
- AI Logs

Database compatibility must always be preserved.

---

# Communication Flow

Candidate

↓

React

↓

Node.js

↓

FastAPI (only if AI is needed)

↓

MongoDB

↓

Return Response

The frontend must never directly communicate with FastAPI.

All communication should go through Node.js unless there is a justified architectural reason.

---

# Authentication Flow

User

↓

React Login

↓

Node.js Authentication

↓

JWT

↓

Protected APIs

↓

Role Based Access

Roles include:

- Candidate
- Recruiter
- HR
- Administrator

---

# Real-Time Communication

Socket.io is responsible for:

- Live Interview
- Coding Sessions
- Notifications
- Progress Updates

Socket events should remain lightweight.

Heavy processing belongs to backend services.

---

# AI Layer

The AI layer should remain isolated.

Responsibilities include:

- NLP
- ML Models
- Resume Intelligence
- AI Evaluation
- Recommendation
- Embeddings
- Prompt Execution

Future AI models should be replaceable without affecting frontend or backend.

---

# Future Multi-Agent Layer

The Multi-Agent layer will sit above the AI Service.

Example:

```
             Hiring Orchestrator

                     │

      ┌──────────────┼──────────────┐

      ▼              ▼              ▼

 Resume Agent   Interview Agent   Recruiter Agent

      │              │

      ▼              ▼

 Skill Agent    Coding Agent

      │

      ▼

 Hiring Recommendation Agent
```

This layer will be implemented after the architecture is complete.

---

# Request Lifecycle

User Request

↓

React

↓

Node.js

↓

Business Validation

↓

AI Required?

↓

No

↓

MongoDB

↓

Response

OR

↓

Yes

↓

FastAPI

↓

AI Processing

↓

MongoDB

↓

Response

---

# Error Handling

Every layer must return:

- Proper HTTP Status Codes
- Error Messages
- Validation Errors
- Logging

No silent failures.

---

# Logging

Application logs should be separated.

Examples:

- Backend Logs
- AI Logs
- Authentication Logs
- Error Logs
- Interview Logs

---

# Security

Maintain:

- JWT Authentication
- Password Hashing
- Role Based Access Control
- Input Validation
- API Validation
- Secure File Upload

Never expose secrets.

---

# Scalability

The architecture must support:

- Multiple AI Models
- Multiple Recruiters
- Multiple Organizations
- Thousands of Candidates
- Future AI Agents

without major redesign.

---

# Development Constraints

Do NOT:

- Rewrite the backend
- Replace FastAPI
- Replace React
- Replace MongoDB
- Replace Socket.io

Only extend existing architecture.

---

# Dependencies

Depends on:

- MASTER_PROMPT.md
- 01_PROJECT_OVERVIEW.md

Next Documents:

- 02A_BACKEND_ARCHITECTURE.md
- 02B_AI_ARCHITECTURE.md

---

# Implementation Status

Architecture Overview

✅ Completed

Backend Architecture

Pending

AI Architecture

Pending

Agent Design

Pending

---

# Instructions For AI Development Assistants

Read this document completely.

Understand the architecture.

Do NOT implement code.

Wait for the Backend Architecture document before generating or modifying any backend code. 