import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Multi-model failover list (ordered by capability & responsiveness)
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

// ---------------------------------------------------------------------------
// SYSTEM PROMPT — Comprehensive Thinking & Emotion Processing
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are HAVEN AI, an intelligent, emotionally perceptive, and deeply supportive mental-wellness companion.

YOUR CORE MISSION:
You are not a robotic script or canned-response bot. You think deeply about what the user is experiencing, understand their underlying emotions, and offer genuine, thoughtful, compassionate, and solution-focused guidance.

HOW TO THINK BEFORE RESPONDING:
1. Emotion & Situation Analysis: Detect whether the user is anxious, overwhelmed, lonely, grieving, frustrated, exhausted, confused, or seeking clarity.
2. Intent Detection: Understand what they truly need in this moment:
   - To vent without judgment
   - Practical, bite-sized coping strategies
   - Grounding and emotional calming
   - A thoughtful perspective shift or problem-solving direction
   - A friendly, warm human-like conversation
3. Context Retention: Use facts, feelings, and history they previously shared. NEVER ask them to repeat what they already told you.
4. Non-Repetitive & Fresh: Never use repetitive therapy cliches like "Take a slow breath", "I hear you and hold space", "Everything will be fine", or "I understand how you feel" over and over. Vary your words, tone, and approach dynamically.
5. Culturally Aware (India-Aware): Respect nuances regarding family dynamics, career/academic pressure, social expectations, arranged marriages, and mental health stigma in Indian contexts when relevant.
6. Actionable & Gentle: Give at most ONE realistic, small next step or reflection rather than overwhelming lists.
7. Tone: Warm, mature, empathetic, conversational, and grounded.

SAFETY & CRISIS:
If the user expresses explicit intent of self-harm or suicide:
- Respond with immediate, gentle care.
- Provide India Crisis Helplines:
  * iCall Helpline: 9152987821
  * Vandrevala Foundation (24/7): 1860-2662-345 / 9999 666 555
  * National Tele-MANAS: 14416
- Do not attempt clinical diagnosis or therapy. Encourage connecting with loved ones or professionals.`;

const hasApiKey = () =>
  !!process.env.GEMINI_API_KEY &&
  !process.env.GEMINI_API_KEY.startsWith('your-');

/**
 * Execute generateContent with automatic multi-model failover
 */
async function generateWithFailover(
  contents: any[],
  temperature = 0.7
): Promise<string> {
  const models = [
    ...(process.env.HAVEN_MODEL ? [process.env.HAVEN_MODEL] : []),
    ...CANDIDATE_MODELS,
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { temperature },
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, attempting next candidate... Error:`, err?.message?.slice(0, 120));
    }
  }

  throw lastError || new Error('All candidate AI models failed.');
}

// ---------------------------------------------------------------------------
// generateChatResponse
// ---------------------------------------------------------------------------
export async function generateChatResponse(
  history: { role: string; content: string }[],
  newMessage: string
): Promise<string> {
  try {
    const safety = detectSafetyRisk(newMessage);
    if (safety.level === 'high') {
      return "I'm genuinely concerned about what you're going through right now. You do not have to carry this immense weight alone. Please reach out to someone who can support you immediately: you can call the Vandrevala Foundation at 1860-2662-345 (24/7, free), Tele-MANAS at 14416, or iCall at 9152987821. Would you like to share a little more about what is feeling so unbearable right now?";
    }

    if (!hasApiKey()) {
      return "[System: AI is offline. Please add your GEMINI_API_KEY to backend/.env to activate the thinking model.] I'm here and listening. Take your time. What feels most important to share right now?";
    }

    // Format conversation history for Gemini
    const formattedContents: any[] = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: "Understood. I am HAVEN AI. I will listen deeply, understand the user's emotions, think through their unique situation, and offer a personalized, compassionate, and thoughtful response." }] },
    ];

    // Add recent conversation history
    for (const msg of history.slice(-10)) {
      formattedContents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Add current user prompt
    formattedContents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    return await generateWithFailover(formattedContents, 0.75);
  } catch (error) {
    console.error('AI Service Error (generateChatResponse):', error);
    // Contextual dynamic fallback based on user input
    return `I heard what you shared: "${newMessage.slice(0, 60)}${newMessage.length > 60 ? '...' : ''}". It sounds like there is a lot to process here. What part of this feels like it is weighing on your mind the most right now?`;
  }
}

// ---------------------------------------------------------------------------
// generateJournalReflection
// ---------------------------------------------------------------------------
export async function generateJournalReflection(
  content: string,
  mood?: string
): Promise<string> {
  try {
    if (!hasApiKey()) {
      return (
        "Thank you for taking the time to put your thoughts into words. " +
        "Giving your feelings a quiet place to land is a meaningful act of care. " +
        "Be gentle with yourself today."
      );
    }

    const prompt =
      `A user wrote this journal entry (mood: ${mood || 'unspecified'}):\n\n` +
      `"${content}"\n\n` +
      `As HAVEN AI, write a 2-3 sentence gentle, warm, empathetic reflection. ` +
      `Reflect the emotional themes softly, validate their effort in journaling, and offer one reassuring thought. ` +
      `Never diagnose or judge. Keep it compassionate, insightful, and natural.`;

    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: prompt }] },
    ];

    return await generateWithFailover(contents, 0.65);
  } catch (error) {
    console.error('AI Service Error (generateJournalReflection):', error);
    return "Honoring your thoughts on the page takes courage. Putting words to your feelings is a meaningful step toward clarity and peace.";
  }
}

// ---------------------------------------------------------------------------
// detectSafetyRisk
// ---------------------------------------------------------------------------
export interface SafetyResult {
  level: 'safe' | 'low' | 'high';
  shouldShowCrisisUI: boolean;
}

export function detectSafetyRisk(message: string): SafetyResult {
  const lower = message.toLowerCase();

  const highRiskKeywords = [
    'kill myself', 'suicide', 'suicidal', 'end my life', 'ending my life',
    'want to die', 'wanna die', 'take my life', 'self harm', 'self-harm',
    'cut myself', 'hurt myself', 'harm myself', 'overdose', 'hang myself',
    'jump off', 'end it all', 'ending it all', 'no reason to live',
    'better off dead', 'marna chahta', 'jaan de dunga', 'khudkhusi', 'aatmahatya',
  ];

  const lowRiskKeywords = [
    'hopeless', "can't go on", 'cannot go on', 'no point anymore',
    'hate my life', 'giving up', 'give up on everything', 'nobody cares',
    'feel worthless', 'nothing matters', 'sab bekar hai', 'kuch theek nahi hoga',
  ];

  for (const keyword of highRiskKeywords) {
    if (lower.includes(keyword)) {
      return { level: 'high', shouldShowCrisisUI: true };
    }
  }

  for (const keyword of lowRiskKeywords) {
    if (lower.includes(keyword)) {
      return { level: 'low', shouldShowCrisisUI: false };
    }
  }

  return { level: 'safe', shouldShowCrisisUI: false };
}
