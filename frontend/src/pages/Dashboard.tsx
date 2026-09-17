import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageCircle, Book, Activity, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

type MoodEntry = { id: string; moodScore: number; createdAt: string };
type JournalEntry = {
  id: string;
  title?: string;
  content: string;
  mood?: string;
  createdAt: string;
};

const REFLECTION_PROMPTS = [
  'What feels heaviest today?',
  'What helped you get through today?',
  'What do you need more of this week?',
  'What is one thought you would like to release?',
];

const MOOD_OPTIONS = [
  { label: 'Very Low', emoji: '🌧️', score: 1 },
  { label: 'Low',      emoji: '🌥️', score: 2 },
  { label: 'Okay',     emoji: '☁️',  score: 3 },
  { label: 'Good',     emoji: '🌤️', score: 4 },
  { label: 'Great',    emoji: '☀️',  score: 5 },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const navigate = useNavigate();
  const [moodSaved, setMoodSaved] = useState(false);
  const [savedMood, setSavedMood] = useState<number | null>(null);
  const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [moodLoading, setMoodLoading] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const name = localStorage.getItem('haven_name') || 'Alex';
  const prompt = REFLECTION_PROMPTS[new Date().getDate() % REFLECTION_PROMPTS.length];

  useEffect(() => {
    fetch('/api/journal')
      .then(r => r.json())
      .then((data: JournalEntry[]) => setLatestEntry(data[0] ?? null))
      .catch(() => setLatestEntry(null))
      .finally(() => setLoadingEntry(false));

    // Check mic permission
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(p => setHasMicPermission(p.state === 'granted'))
      .catch(() => setHasMicPermission(null));
  }, []);

  const handleMood = async (score: number) => {
    setMoodLoading(true);
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodScore: score }),
      });
      setSavedMood(score);
      setMoodSaved(true);
    } finally {
      setMoodLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <header>
        <h2 className="text-4xl font-medium text-[#2b213a] tracking-tight">
          {getGreeting()}, {name}.
        </h2>
        <p className="text-[#2b213a]/60 mt-2 text-lg">
          You do not have to solve everything right now.
        </p>
      </header>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Talk to HAVEN — voice card */}
        <div className="md:col-span-2 bg-[#4a3b69] text-white rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* Orb */}
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#fbc4ab] shadow-[0_0_40px_rgba(168,213,186,0.5)] animate-pulse" />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-medium mb-1">Talk to HAVEN</h3>
              <p className="text-white/70 text-sm mb-5">
                Speak naturally. HAVEN is listening.{' '}
                {hasMicPermission === false && (
                  <span className="text-yellow-300">š  Mic access needed.</span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/voice')}
                  className="flex items-center gap-2 bg-white text-[#4a3b69] font-medium px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
                >
                  <Mic className="w-4 h-4" /> Start Voice Session
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Prefer text?
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mood check-in */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#f9f6f0]/50 flex flex-col justify-between">
          <h3 className="text-lg font-medium mb-4">
            {moodSaved ? 'œ“ Checked in' : 'How are you feeling?'}
          </h3>
          {moodSaved ? (
            <div className="flex-1 flex flex-col gap-4">
              <p className="text-[#4a3b69] text-sm">
                {MOOD_OPTIONS.find(m => m.score === savedMood)?.emoji}{' '}
                <span className="text-[#2b213a]/70">
                  Thank you for checking in. Would you like to talk about what is affecting your mood today?
                </span>
              </p>
              <button
                onClick={() => navigate('/voice')}
                className="mt-auto w-full bg-[#4a3b69] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#392d52] transition-colors"
              >
                Talk to HAVEN
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-end flex-1">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.score}
                  onClick={() => handleMood(m.score)}
                  disabled={moodLoading}
                  className="flex flex-col items-center gap-2 hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs text-[#2b213a]/50">{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent journal entry */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#f9f6f0]/50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-medium">Recent Entry</h3>
            <button onClick={() => navigate('/journal')} className="text-sm text-[#4a3b69] hover:underline">
              View all
            </button>
          </div>
          {loadingEntry ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded-full w-2/3" />
              <div className="h-3 bg-gray-100 rounded-full w-full" />
              <div className="h-3 bg-gray-100 rounded-full w-4/5" />
            </div>
          ) : latestEntry ? (
            <button
              onClick={() => navigate('/journal')}
              className="w-full text-left bg-[#f9f6f0] p-5 rounded-2xl hover:bg-[#f0ece5] transition-colors"
            >
              <p className="text-xs text-[#2b213a]/40 mb-1">
                {new Date(latestEntry.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {latestEntry.title && <p className="font-medium mb-1">{latestEntry.title}</p>}
              <p className="text-sm text-[#2b213a]/70 line-clamp-3">{latestEntry.content}</p>
            </button>
          ) : (
            <div className="text-center py-6">
              <Book className="w-8 h-8 text-[#2b213a]/20 mx-auto mb-3" />
              <p className="text-sm text-[#2b213a]/50 mb-4">No entries yet. Writing can help you process your thoughts.</p>
              <button
                onClick={() => navigate('/journal')}
                className="px-5 py-2 bg-[#4a3b69] text-white rounded-xl text-sm hover:bg-[#392d52] transition-colors"
              >
                Write your first entry
              </button>
            </div>
          )}
        </div>

        {/* Daily reflection */}
        <div className="bg-gradient-to-br from-[#e2d4f0]/60 to-white rounded-3xl p-8 shadow-sm border border-white">
          <h3 className="text-lg font-medium mb-2">Daily Reflection</h3>
          <p className="text-sm text-[#2b213a]/50 mb-4">A gentle prompt to sit with today.</p>
          <p className="text-2xl text-[#2b213a] leading-snug font-serif italic mb-6">
            "{prompt}"
          </p>
          <button
            onClick={() => navigate(`/journal?prompt=${encodeURIComponent(prompt)}`)}
            className="px-5 py-2.5 bg-white rounded-xl shadow-sm font-medium text-[#4a3b69] text-sm hover:bg-gray-50 transition-colors"
          >
            Write about this
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Voice Session', icon: Mic, path: '/voice', color: 'bg-[#4a3b69] text-white' },
          { label: 'Text Chat', icon: MessageCircle, path: '/chat', color: 'bg-white text-[#4a3b69] border border-[#e2d4f0]' },
          { label: 'Write in Journal', icon: Book, path: '/journal', color: 'bg-white text-[#4a3b69] border border-[#e2d4f0]' },
          { label: 'Mood History', icon: Activity, path: '/mood', color: 'bg-white text-[#4a3b69] border border-[#e2d4f0]' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={clsx(
              'flex items-center gap-3 px-5 py-4 rounded-2xl font-medium text-sm transition-all hover:scale-[1.02] shadow-sm',
              action.color
            )}
          >
            <action.icon className="w-5 h-5 shrink-0" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

