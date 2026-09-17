import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateJournalReflection } from '../services/ai';

const router = Router();
const prisma = new PrismaClient();

// Helper: parse tags safely
const parseTags = (raw: string): string[] => {
  try { return JSON.parse(raw) ?? []; }
  catch { return []; }
};

// ---------------------------------------------------------------------------
// GET /api/journal — list all journal entries for dev user, desc order
// ---------------------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(entries.map(e => ({ ...e, tags: parseTags(e.tags) })));
  } catch (error) {
    console.error('GET /journal error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/journal/:id — get a single journal entry
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: req.params.id },
    });

    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });

    res.json({ ...entry, tags: parseTags(entry.tags) });
  } catch (error) {
    console.error('GET /journal/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/journal — create a new journal entry
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { title, content, mood, tags } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        mood: mood?.trim() || null,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]'),
      },
    });

    res.status(201).json({ ...entry, tags: parseTags(entry.tags) });
  } catch (error) {
    console.error('POST /journal error:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/journal/:id — update a journal entry
// ---------------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;

    const updateData: Record<string, any> = {};
    if (title   !== undefined) updateData.title   = title?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (mood    !== undefined) updateData.mood    = mood?.trim() || null;
    if (tags    !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? JSON.stringify(tags)
        : (typeof tags === 'string' ? tags : '[]');
    }

    const entry = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ ...entry, tags: parseTags(entry.tags) });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    console.error('PATCH /journal/:id error:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/journal/:id — delete a journal entry
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    await prisma.journalEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    console.error('DELETE /journal/:id error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/journal/:id/reflect — generate & save AI reflection
// ---------------------------------------------------------------------------
router.post('/:id/reflect', async (req, res) => {
  try {
    const existing = await prisma.journalEntry.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Journal entry not found' });

    const reflection = await generateJournalReflection(existing.content, existing.mood);

    const updated = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: { aiReflection: reflection },
    });

    res.json({ ...updated, tags: parseTags(updated.tags) });
  } catch (error) {
    console.error('POST /journal/:id/reflect error:', error);
    res.status(500).json({ error: 'Failed to generate reflection' });
  }
});

export default router;
