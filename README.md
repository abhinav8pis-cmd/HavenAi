# HAVEN AI

A private digital sanctuary for mental wellness. HAVEN AI helps users reflect, journal, track moods, talk through emotions, and access support privately and safely.

## Features
- **AI Chat Companion**: Empathetic AI conversations using Google Gemini API.
- **Voice Interface**: Built-in voice interactions via Web Speech API.
- **Journaling**: A private space for reflection.
- **Mood Tracking**: Notice emotional trends over time.
- **Support & Safety**: Embedded crisis resources and safety-first AI prompts.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS 4
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **AI**: `@google/genai` (Gemini API)

## Getting Started

1. Clone the repository.
2. Setup environment variables:
   - In `backend/`, copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.
3. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. Initialize the database:
   - `cd backend && npx prisma db push && npx prisma generate`
5. Start development servers:
   - `cd backend && npm run dev` (API runs on port 3001)
   - `cd frontend && npm run dev` (App runs on port 5173)

## Safety & Disclaimers
HAVEN AI is **not** a replacement for professional therapy or emergency services. If a user is in immediate danger, they should contact their local emergency services. The AI is instructed to avoid diagnosis and encourage professional help when appropriate.
