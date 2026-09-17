import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper: parse emotion tags safely
const parseTags = (raw: string): string[] => {
  try { return JSON.parse(raw) ?? []; }
  catch { return []; }
};

// ---------------------------------------------------------------------------
// GET /api/mood — list last 30 mood check-ins, desc order
// ---------------------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const moods = await prisma.moodCheckIn.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json(moods.map(m => ({ ...m, emotionTags: parseTags(m.emotionTags) })));
  } catch (error) {
    console.error('GET /mood error:', error);
    res.status(500).json({ error: 'Failed to fetch mood check-ins' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/mood/trends — weekly / 30-day analytics
// Return: { weeklyAvg, dailyData, totalCheckIns, emotionFrequency }
// ---------------------------------------------------------------------------
router.get('/trends', async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();

    // 7-day window
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 30-day window
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const all30 = await prisma.moodCheckIn.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Weekly average (last 7 days)
    const last7 = all30.filter(m => m.createdAt >= sevenDaysAgo);
    const weeklyAvg =
      last7.length > 0
        ? parseFloat(
            (last7.reduce((sum, m) => sum + m.moodScore, 0) / last7.length).toFixed(2)
          )
        : 0;

    // Daily average for the last 30 days (for chart)
    const dailyMap: Record<string, { sum: number; count: number }> = {};

    for (const m of all30) {
      const dateKey = m.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { sum: 0, count: 0 };
      dailyMap[dateKey].sum   += m.moodScore;
      dailyMap[dateKey].count += 1;
    }

    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { sum, count }]) => ({
        date,
        avg: parseFloat((sum / count).toFixed(2)),
      }));

    // Emotion frequency across 30 days
    const emotionFrequency: Record<string, number> = {};
    for (const m of all30) {
      const tags = parseTags(m.emotionTags);
      for (const tag of tags) {
        emotionFrequency[tag] = (emotionFrequency[tag] ?? 0) + 1;
      }
    }

    res.json({
      weeklyAvg,
      dailyData,
      totalCheckIns: all30.length,
      emotionFrequency,
    });
  } catch (error) {
    console.error('GET /mood/trends error:', error);
    res.status(500).json({ error: 'Failed to compute mood trends' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/mood — create a mood check-in
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { moodScore, emotionTags, note } = req.body;

    if (typeof moodScore !== 'number' || moodScore < 1 || moodScore > 5) {
      return res.status(400).json({ error: 'moodScore must be a number between 1 and 5' });
    }

    const checkIn = await prisma.moodCheckIn.create({
      data: {
        userId: user.id,
        moodScore,
        emotionTags: Array.isArray(emotionTags) ? JSON.stringify(emotionTags) : '[]',
        note: note?.trim() || null,
      },
    });

    res.status(201).json({ ...checkIn, emotionTags: parseTags(checkIn.emotionTags) });
  } catch (error) {
    console.error('POST /mood error:', error);
    res.status(500).json({ error: 'Failed to save mood check-in' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/mood/:id — delete a check-in
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    await prisma.moodCheckIn.delete({ where: { id: req.params.id } });
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Mood check-in not found' });
    }
    console.error('DELETE /mood/:id error:', error);
    res.status(500).json({ error: 'Failed to delete mood check-in' });
  }
});

export default router;
