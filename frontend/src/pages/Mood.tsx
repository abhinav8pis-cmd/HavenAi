import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, Heart, TrendingUp, Sparkles, MessageCircle } from 'lucide-react';
import clsx from 'clsx';

interface MoodCheckIn {
  id: string;
  moodScore: number;
  emotionTags: string[];
  note?: string;
  createdAt: string;
}

interface TrendData {
  weeklyAvg: number;
  dailyData: { date: string; avg: number }[];
  totalCheckIns: number;
  emotionFrequency: Record<string, number>;
}

const MOOD_OPTIONS = [
  { score: 1, emoji: '🌧️', label: 'Very Low', color: 'from-blue-400 to-indigo-500' },
  { score: 2, emoji: '🌥️', label: 'Low',      color: 'from-indigo-300 to-purple-400' },
  { score: 3, emoji: '☁️',  label: 'Okay',     color: 'from-purple-300 to-pink-300' },
  { score: 4, emoji: '🌤️', label: 'Good',     color: 'from-amber-200 to-orange-300' },
  { score: 5, emoji: '☀️',  label: 'Great',    color: 'from-amber-400 to-yellow-300' },
];

const EMOTION_TAGS = [
  'Grateful', 'Anxious', 'Calm', 'Overwhelmed', 'Hopeful', 
  'Lonely', 'Tired', 'Content', 'Energetic', 'Sad', 'Supported'
];

export function Mood() {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState<MoodCheckIn[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  // New check-in state
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [historyRes, trendsRes] = await Promise.all([
        fetch('/api/mood'),
        fetch('/api/mood/trends')
      ]);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setCheckIns(data);
      }
      if (trendsRes.ok) {
        const tData = await trendsRes.json();
        setTrends(tData);
      }
    } catch (err) {
      console.error('Failed to load mood data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitCheckIn = async () => {
    if (!selectedScore) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodScore: selectedScore,
          emotionTags: selectedTags,
          note: note.trim() || undefined
        })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setSelectedScore(null);
        setSelectedTags([]);
        setNote('');
        fetchData();
        setTimeout(() => setSavedSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Failed to submit mood check-in:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCheckIn = async (id: string) => {
    try {
      await fetch(`/api/mood/${id}`, { method: 'DELETE' });
      setCheckIns(prev => prev.filter(item => item.id !== id));
      fetchData();
    } catch (err) {
      console.error('Failed to delete check-in:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-3xl md:text-4xl font-medium text-[#2b213a] tracking-tight">Emotional Weather & Trends</h2>
        <p className="text-[#2b213a]/60 mt-1">A gentle window into your emotional seasons. Not a diagnosis, but an invitation to notice.</p>
      </header>

      {/* Daily Check-in Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50 relative overflow-hidden">
        <h3 className="text-xl font-medium text-[#2b213a] mb-2">How are you feeling right now?</h3>
        <p className="text-sm text-[#2b213a]/60 mb-6">Take a breath and choose the weather that resonates most.</p>

        {savedSuccess ? (
          <div className="bg-[#a8d5ba]/20 border border-[#a8d5ba] rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95">
            <Sparkles className="w-8 h-8 text-[#4a3b69] mx-auto animate-bounce" />
            <h4 className="font-semibold text-lg text-[#2b213a]">Thank you for honoring your feelings.</h4>
            <p className="text-sm text-[#2b213a]/80 max-w-md mx-auto">
              Your check-in is saved. Remember: every feeling is temporary and valid.
            </p>
            <button 
              onClick={() => navigate('/voice')}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#4a3b69] text-white rounded-xl text-sm font-medium hover:bg-[#392d52] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Talk through this with HAVEN
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Emoji Selector */}
            <div className="grid grid-cols-5 gap-2 sm:gap-4">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedScore === mood.score;
                return (
                  <button
                    key={mood.score}
                    type="button"
                    onClick={() => setSelectedScore(mood.score)}
                    className={clsx(
                      'flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all border text-center',
                      isSelected 
                        ? 'bg-[#4a3b69] text-white border-[#4a3b69] scale-105 shadow-md' 
                        : 'bg-[#f9f6f0] hover:bg-[#f0ece5] text-[#2b213a] border-transparent'
                    )}
                  >
                    <span className="text-3xl sm:text-4xl mb-2 filter drop-shadow-sm">{mood.emoji}</span>
                    <span className={clsx('text-xs font-medium', isSelected ? 'text-white' : 'text-[#2b213a]/70')}>
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tags Selector */}
            {selectedScore !== null && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#2b213a]/50 block mb-2">
                    What emotions are present? (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTION_TAGS.map((tag) => {
                      const isTagSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={clsx(
                            'px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border',
                            isTagSelected
                              ? 'bg-[#a8d5ba] text-[#2b213a] border-[#a8d5ba]'
                              : 'bg-white text-[#2b213a]/70 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#2b213a]/50 block mb-2">
                    Add a gentle note to self (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="E.g., Took a walk in the morning, feeling slightly more centered..."
                    className="w-full px-4 py-3 bg-[#f9f6f0] rounded-xl border border-transparent focus:border-[#4a3b69]/30 outline-none text-sm text-[#2b213a]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitCheckIn}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#4a3b69] text-white rounded-xl text-sm font-medium hover:bg-[#392d52] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Check-in'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Trends Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Representation */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-[#2b213a]">Weekly Flow</h3>
              <p className="text-xs text-[#2b213a]/50">Your recent 7-day pattern</p>
            </div>
            {trends && (
              <div className="text-right">
                <span className="text-2xl font-bold text-[#4a3b69]">
                  {trends.weeklyAvg > 0 ? trends.weeklyAvg.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-[#2b213a]/50 block">7-day average (out of 5)</span>
              </div>
            )}
          </div>

          {trends && trends.dailyData && trends.dailyData.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-gray-100">
              {trends.dailyData.slice(-7).map((item, idx) => {
                const heightPercent = item.avg > 0 ? (item.avg / 5) * 100 : 8;
                const moodObj = MOOD_OPTIONS.find(m => Math.round(item.avg) === m.score);
                const dayLabel = new Date(item.date).toLocaleDateString('en-US', { weekday: 'narrow' });
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#2b213a] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                      {item.avg > 0 ? `Avg: ${item.avg.toFixed(1)} / 5` : 'No check-in'}
                    </div>
                    <div className="w-full max-w-[2.5rem] bg-[#f9f6f0] rounded-xl h-36 flex items-end p-1">
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={clsx(
                          'w-full rounded-lg transition-all duration-500',
                          item.avg > 0 ? 'bg-gradient-to-t from-[#4a3b69] to-[#a8d5ba]' : 'bg-gray-200'
                        )}
                      />
                    </div>
                    <span className="text-xs text-[#2b213a]/60 font-medium">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-[#2b213a]/40 text-sm">
              <Calendar className="w-8 h-8 mb-2 opacity-40" />
              <span>Check in across multiple days to reveal your rhythm.</span>
            </div>
          )}

          <p className="text-xs text-[#2b213a]/50 mt-4 italic">
            "Your recent check-ins show how your days have been feeling over time. Ups and downs are normal and natural."
          </p>
        </div>

        {/* Emotion Frequency / Top Feelings */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-[#2b213a] mb-1">Frequent Feelings</h3>
            <p className="text-xs text-[#2b213a]/50 mb-4">Themes from your recent check-ins</p>

            {trends && Object.keys(trends.emotionFrequency).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(trends.emotionFrequency)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([emotion, count]) => (
                    <div key={emotion} className="flex justify-between items-center text-sm">
                      <span className="text-[#2b213a] font-medium">{emotion}</span>
                      <span className="text-xs bg-[#e2d4f0]/60 text-[#4a3b69] px-2.5 py-0.5 rounded-full font-semibold">
                        {count} {count === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[#2b213a]/40 text-xs">
                No emotion tags logged yet.
              </div>
            )}
          </div>

          <div className="p-4 bg-[#f9f6f0] rounded-2xl mt-4">
            <p className="text-xs text-[#2b213a]/70 flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-pink-500" /> All emotions carry valuable insight.
            </p>
          </div>
        </div>
      </div>

      {/* History Table / Check-in List */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50">
        <h3 className="text-lg font-medium text-[#2b213a] mb-4">Recent Reflections & Check-ins</h3>
        
        {checkIns.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {checkIns.map((item) => {
              const moodItem = MOOD_OPTIONS.find(m => m.score === item.moodScore);
              return (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl filter drop-shadow-sm">{moodItem?.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#2b213a]">{moodItem?.label}</span>
                        <span className="text-xs text-[#2b213a]/40">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-[#2b213a]/70 mt-0.5">{item.note}</p>
                      )}
                      {item.emotionTags && item.emotionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.emotionTags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-[#f9f6f0] text-[#4a3b69] px-2 py-0.5 rounded-full border border-gray-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCheckIn(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete check-in"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-[#2b213a]/40 text-sm">
            No check-in history yet. Take your first check-in above!
          </div>
        )}
      </div>
    </div>
  );
}

