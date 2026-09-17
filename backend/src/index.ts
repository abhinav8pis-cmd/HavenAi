import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

import chatRouter    from './routes/chat';
import journalRouter from './routes/journal';
import moodRouter    from './routes/mood';
import supportRouter from './routes/support';
import assessmentRouter from './routes/assessment';
import exercisesRouter from './routes/exercises';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow any localhost port for local dev
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // Allow any Vercel deployment (*.vercel.app) and custom FRONTEND_URL
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    // Block everything else
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/chat',    chatRouter);
app.use('/api/journal', journalRouter);
app.use('/api/mood',    moodRouter);
app.use('/api/support', supportRouter);
app.use('/api/assessments', assessmentRouter);
app.use('/api/exercises', exercisesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'HAVEN AI API is running' });
});

// ---------------------------------------------------------------------------
// POST /api/init-dev — seed dev user, conversation, and support resources
// ---------------------------------------------------------------------------
app.post('/api/init-dev', async (_req, res) => {
  try {
    // --- User ---
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email:       'test@example.com',
          password:    'mockpassword',
          displayName: 'Alex',
        },
      });
    }

    // --- Conversation ---
    let conversation = await prisma.conversation.findFirst({ where: { userId: user.id } });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          title:  'Welcome to HAVEN',
        },
      });
    }

    // --- Support Resources (seed DB rows only if table is empty) ---
    const existingCount = await prisma.supportResource.count();
    if (existingCount === 0) {
      await prisma.supportResource.createMany({
        data: [
          {
            region:      'global',
            name:        'International Association for Suicide Prevention',
            website:     'https://www.iasp.info/resources/Crisis_Centres/',
            emergency:   false,
            description: 'Directory of crisis centres around the world',
          },
          {
            region:      'us',
            name:        'National Suicide Prevention Lifeline',
            phone:       '988',
            website:     'https://988lifeline.org',
            emergency:   true,
            description: 'Free and confidential emotional support, 24/7',
          },
          {
            region:      'us',
            name:        'Crisis Text Line',
            phone:       'Text HOME to 741741',
            website:     'https://www.crisistextline.org',
            emergency:   false,
            description: 'Text-based crisis support, 24/7',
          },
          {
            region:      'global',
            name:        'International Emergency Services',
            phone:       'Call 911 (US) / 999 (UK) / 112 (EU)',
            emergency:   true,
            description: 'Local emergency services for immediate danger',
          },
          {
            region:      'global',
            name:        'Psychology Today Therapist Finder',
            website:     'https://www.psychologytoday.com/us/therapists',
            emergency:   false,
            description: 'Find licensed therapists in your area',
          },
        ],
      });
    }

    res.json({
      user,
      conversation,
      conversationId: conversation.id, // surfaced at top-level for easy frontend access
    });
  } catch (error) {
    console.error('init-dev error:', error);
    res.status(500).json({ error: 'Failed to init dev environment' });
  }
});

app.listen(port, () => {
  console.log(`✅ HAVEN AI server running on port ${port}`);
});
