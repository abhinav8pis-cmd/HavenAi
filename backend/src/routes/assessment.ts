import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const router = Router();
const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const ASSESSMENTS = [
  {
    id: 'phq9',
    name: 'PHQ-9: Depression Screening',
    description: 'A validated 9-question tool to screen for depression and measure its severity.',
    category: 'depression',
    estimatedMinutes: 5,
    questions: [
      { id: 1, text: 'Little interest or pleasure in doing things?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 2, text: 'Feeling down, depressed, or hopeless?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 4, text: 'Feeling tired or having little energy?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 5, text: 'Poor appetite or overeating?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 6, text: 'Feeling bad about yourself or that you are a failure?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 7, text: 'Trouble concentrating on things such as reading or watching TV?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 8, text: 'Moving or speaking so slowly others could have noticed, or being fidgety?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 9, text: 'Thoughts that you would be better off dead or hurting yourself?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
    ],
    scoringGuide: { '0-4': 'Minimal', '5-9': 'Mild', '10-14': 'Moderate', '15-27': 'Severe' },
  },
  {
    id: 'gad7',
    name: 'GAD-7: Anxiety Assessment',
    description: 'A 7-item anxiety scale to measure generalized anxiety disorder severity.',
    category: 'anxiety',
    estimatedMinutes: 4,
    questions: [
      { id: 1, text: 'Feeling nervous, anxious, or on edge?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 2, text: 'Not being able to stop or control worrying?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 3, text: 'Worrying too much about different things?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 4, text: 'Trouble relaxing?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 5, text: 'Being so restless that it is hard to sit still?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 6, text: 'Becoming easily annoyed or irritable?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
      { id: 7, text: 'Feeling afraid as if something awful might happen?', options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
    ],
    scoringGuide: { '0-4': 'Minimal', '5-9': 'Mild', '10-14': 'Moderate', '15-21': 'Severe' },
  },
  {
    id: 'pss10',
    name: 'PSS-10: Perceived Stress Scale',
    description: 'A 10-item psychological tool for measuring perceived stress levels.',
    category: 'stress',
    estimatedMinutes: 5,
    questions: [
      { id: 1,  text: 'Been upset because of something that happened unexpectedly?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 2,  text: 'Felt unable to control the important things in your life?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 3,  text: 'Felt nervous and stressed?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 4,  text: 'Felt confident about your ability to handle personal problems?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 5,  text: 'Felt that things were going your way?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 6,  text: 'Could not cope with all the things you had to do?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 7,  text: 'Been able to control irritations in your life?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 8,  text: 'Felt that you were on top of things?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 9,  text: 'Been angered because of things outside of your control?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
      { id: 10, text: 'Felt difficulties were piling up so high you could not overcome them?', options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'] },
    ],
    scoringGuide: { '0-13': 'Low', '14-26': 'Moderate', '27-40': 'High' },
  },
];

const PSS_REVERSE = new Set([4, 5, 7, 8]);

function calcSeverity(id: string, score: number): string {
  if (id === 'phq9') {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
  }
  if (id === 'gad7') {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
  }
  if (score <= 13) return 'Low';
  if (score <= 26) return 'Moderate';
  return 'High';
}

async function generateInsight(assessmentId: string, score: number, severity: string): Promise<string> {
  try {
    const name = ASSESSMENTS.find((a) => a.id === assessmentId)?.name ?? assessmentId;
    const prompt = `A user completed the ${name} scoring ${score} (${severity}). Write 2 short compassionate sentences as HAVEN AI: acknowledge their result without alarm, and suggest one simple actionable self-care step. Be warm and non-diagnostic.`;
    const resp = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return resp.text?.trim() ?? '';
  } catch {
    return `Thank you for checking in with yourself today — that takes real courage. Consider doing one small kind thing for yourself today, like a short walk, journaling, or reaching out to someone you trust.`;
  }
}

router.get('/', (_req: Request, res: Response) => {
  res.json(ASSESSMENTS);
});

router.get('/results', async (_req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'No user found' });
    const results = await prisma.assessmentResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(results.map((r) => ({ ...r, answers: JSON.parse(r.answers) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.post('/:assessmentId/submit', async (req: Request, res: Response) => {
  try {
    const assessmentId = String(req.params['assessmentId']);
    const { answers } = req.body as { answers: Record<string, number> };
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'No user found' });

    let totalScore = 0;
    for (const [qIdStr, val] of Object.entries(answers)) {
      const qId = Number(qIdStr);
      if (assessmentId === 'pss10' && PSS_REVERSE.has(qId)) {
        totalScore += 4 - val;
      } else {
        totalScore += val;
      }
    }

    const severity = calcSeverity(assessmentId, totalScore);
    const aiInsight = await generateInsight(assessmentId, totalScore, severity);

    const result = await prisma.assessmentResult.create({
      data: {
        userId: user.id,
        assessmentId,
        answers: JSON.stringify(answers),
        totalScore,
        severity,
        aiInsight,
      },
    });

    res.json({ ...result, answers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

router.delete('/results/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params['id']);
    await prisma.assessmentResult.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

export default router;
