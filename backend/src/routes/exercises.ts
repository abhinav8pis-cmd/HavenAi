import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const EXERCISES = [
  { id: 'box-breathing', category: 'breathing', title: 'Box Breathing', description: 'A calming technique used by military and athletes to regulate the nervous system.', durationMinutes: 5, difficulty: 'beginner', steps: ['Inhale slowly for 4 counts', 'Hold your breath for 4 counts', 'Exhale slowly for 4 counts', 'Hold empty for 4 counts', 'Repeat 4 times'], benefits: ['Reduces cortisol', 'Calms racing thoughts', 'Slows heart rate'] },
  { id: '478-breathing', category: 'breathing', title: '4-7-8 Breathing', description: 'A powerful breathing pattern that acts as a natural tranquiliser.', durationMinutes: 3, difficulty: 'beginner', steps: ['Empty your lungs completely', 'Inhale through nose for 4 counts', 'Hold breath for 7 counts', 'Exhale through mouth for 8 counts', 'Repeat 4 cycles'], benefits: ['Reduces anxiety', 'Helps with sleep', 'Lowers blood pressure'] },
  { id: '54321-grounding', category: 'grounding', title: '5-4-3-2-1 Grounding', description: 'An evidence-based technique to anchor yourself to the present moment during anxiety or panic.', durationMinutes: 5, difficulty: 'beginner', steps: ['Name 5 things you can SEE around you', 'Notice 4 things you can physically TOUCH', 'Identify 3 things you can HEAR right now', 'Acknowledge 2 things you can SMELL', 'Notice 1 thing you can TASTE', 'Take three slow deep breaths'], benefits: ['Stops panic spirals', 'Connects you to the present', 'Reduces dissociation'] },
  { id: 'body-scan', category: 'mindfulness', title: 'Body Scan Meditation', description: 'A mindfulness practice of slowly scanning attention through the body to release tension.', durationMinutes: 10, difficulty: 'beginner', steps: ['Lie down or sit comfortably', 'Close your eyes and take 3 deep breaths', 'Bring attention to the top of your head', 'Slowly move awareness down: forehead, jaw, neck, shoulders', 'Continue through chest, abdomen, arms, hands', 'Move to hips, legs, feet, toes', 'Notice any areas of tension without judgment', 'Breathe into tight spots and release'], benefits: ['Releases physical tension', 'Improves sleep', 'Increases body awareness'] },
  { id: 'progressive-relaxation', category: 'mindfulness', title: 'Progressive Muscle Relaxation', description: 'Systematically tense and relax muscle groups to release stress from the body.', durationMinutes: 15, difficulty: 'beginner', steps: ['Sit or lie in a comfortable position', 'Start with your feet — tense muscles tightly for 5 seconds', 'Release and feel the difference for 30 seconds', 'Move upward: calves, thighs, abdomen, chest', 'Continue: hands, arms, shoulders, face', 'End with full-body awareness of relaxation'], benefits: ['Reduces physical stress', 'Treats insomnia', 'Lowers blood pressure'] },
  { id: 'cold-water', category: 'grounding', title: 'Cold Water Reset', description: 'Using cold water on face or wrists to activate the dive reflex and rapidly calm the nervous system.', durationMinutes: 2, difficulty: 'beginner', steps: ['Fill a basin with cold water (or use a tap)', 'Splash cold water gently on your face and wrists', 'Or hold an ice cube in your palm for 30 seconds', 'Focus entirely on the physical sensation', 'Take 5 slow breaths while feeling the cold', 'Notice how your body begins to settle'], benefits: ['Instantly calms panic', 'Interrupts emotional flooding', 'Rapid nervous system reset'] },
  { id: 'gratitude-reflection', category: 'mindfulness', title: 'Gratitude Reflection', description: 'A structured practice of noticing what is working in your life to shift perspective.', durationMinutes: 5, difficulty: 'beginner', steps: ['Find a quiet space and close your eyes', 'Think of one person who made your day slightly better', 'Recall one moment today that you enjoyed, even briefly', 'Notice one thing about your body you are grateful for', 'Breathe and sit with these feelings for 1 minute', 'Optional: write them in your journal'], benefits: ['Shifts negative thought spirals', 'Improves sleep quality', 'Builds emotional resilience'] },
  { id: 'walking-meditation', category: 'movement', title: 'Mindful Walking', description: 'Turn a simple walk into a powerful mindfulness and grounding practice.', durationMinutes: 10, difficulty: 'beginner', steps: ['Walk at a slower pace than usual', 'Feel each foot as it lifts, moves, and touches the ground', 'Match your breathing to your steps (inhale 3 steps, exhale 3)', 'Notice 5 things you see around you', 'Feel the air on your skin', 'If mind wanders, gently return to the feel of your steps'], benefits: ['Combines exercise and mindfulness', 'Reduces rumination', 'Boosts mood naturally'] },
  { id: 'thought-defusion', category: 'mindfulness', title: 'Thought Defusion', description: 'An ACT (Acceptance and Commitment Therapy) technique to create distance from unhelpful thoughts.', durationMinutes: 5, difficulty: 'intermediate', steps: ['Identify a distressing thought you are having', 'Say it as: \'I am having the thought that...\'', 'Then say: \'I notice I am having the thought that...\'', 'Imagine the thought on a leaf floating down a stream', 'Or see it as a word on a screen that fades', 'Notice how you can observe the thought without being it', 'Let it pass without engaging'], benefits: ['Reduces power of negative thoughts', 'Breaks rumination cycles', 'Core ACT skill'] },
  { id: 'self-compassion-break', category: 'mindfulness', title: 'Self-Compassion Break', description: 'A 3-step practice from Dr. Kristin Neff to treat yourself with the kindness you would give a friend.', durationMinutes: 5, difficulty: 'beginner', steps: ['Place one hand on your heart and breathe', 'Step 1 — Acknowledge: \'This is a moment of suffering. I am struggling.\'', 'Step 2 — Common humanity: \'Suffering is part of being human. I am not alone.\'', 'Step 3 — Self-kindness: \'May I be kind to myself. May I give myself what I need.\'', 'Sit quietly with your hand on your heart for 1 minute'], benefits: ['Reduces self-criticism', 'Builds emotional resilience', 'Evidence-based wellbeing'] }
];

router.get('/', (_req, res) => {
  res.json(EXERCISES);
});

router.get('/logs', async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'No user found' });
    const logs = await prisma.exerciseLog.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      take: 30,
    });
    res.json(logs);
  } catch (err) {
    console.error('GET /exercises/logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.post('/:exerciseId/complete', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const { durationSec, rating, notes } = req.body;

    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'No user found' });

    const exercise = EXERCISES.find(e => e.id === exerciseId);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    const log = await prisma.exerciseLog.create({
      data: {
        userId: user.id,
        exerciseId,
        category: exercise.category,
        durationSec,
        rating,
        notes,
      },
    });

    res.json(log);
  } catch (err) {
    console.error('POST /exercises/:id/complete:', err);
    res.status(500).json({ error: 'Failed to log exercise' });
  }
});

router.delete('/logs/:id', async (req, res) => {
  try {
    await prisma.exerciseLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /exercises/logs/:id:', err);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

export default router;
