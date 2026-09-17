import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateChatResponse, detectSafetyRisk } from '../services/ai';

const router = Router();
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// GET /api/chat — list all conversations for the dev user
// ---------------------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    res.json(conversations);
  } catch (error) {
    console.error('GET /chat error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/chat/:conversationId — get full conversation with messages
// ---------------------------------------------------------------------------
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('GET /chat/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/chat — create a new conversation
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { firstMessage } = req.body;

    // Derive a title from the first message if provided (truncate to 60 chars)
    let title: string | undefined;
    if (firstMessage && typeof firstMessage === 'string' && firstMessage.trim()) {
      title = firstMessage.trim().slice(0, 60);
      if (firstMessage.trim().length > 60) title += '…';
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: title ?? 'New Conversation',
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('POST /chat error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/chat/:conversationId/messages — send message, get AI reply
// ---------------------------------------------------------------------------
router.post('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Run safety check (keyword-based, fast)
    const safety = detectSafetyRisk(content);
    const safetyStatus =
      safety.level === 'high' ? 'high-risk' :
      safety.level === 'low'  ? 'flagged'   : 'safe';

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: content.trim(),
        safetyStatus,
      },
    });

    // Fetch recent history (up to 20 messages) for context
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Call AI
    const aiText = await generateChatResponse(
      history.map(m => ({ role: m.role, content: m.content })),
      content.trim()
    );

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiText || "I'm sorry, I'm having trouble responding right now.",
        safetyStatus: 'safe',
      },
    });

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.json({
      userMessage,
      assistantMessage,
      safety, // expose to frontend so it can show crisis UI if needed
    });
  } catch (error) {
    console.error('POST /chat/:id/messages error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/chat/:conversationId — update conversation title
// ---------------------------------------------------------------------------
router.patch('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim() },
    });

    res.json(conversation);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    console.error('PATCH /chat/:id error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/chat/:conversationId — delete conversation and all its messages
// ---------------------------------------------------------------------------
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    res.json({ success: true, id: conversationId });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    console.error('DELETE /chat/:id error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
