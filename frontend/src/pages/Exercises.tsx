import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Clock, Star, ChevronRight, Filter, Play, Pause, RotateCcw, ThumbsUp, Flame, Wind, Anchor, Sparkles, PersonStanding } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: string;
  category: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: string[];
  benefits: string[];
}

interface ExerciseLog {
  id: string;
  exerciseId: string;
  category: string;
  durationSec: number;
  rating: number | null;
  notes: string | null;
  completedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  breathing:   { label: 'Breathing',    icon: <Wind className="w-4 h-4" />,           color: 'text-sky-700',    bg: 'bg-sky-50 border-sky-200' },
  grounding:   { label: 'Grounding',    icon: <Anchor className="w-4 h-4" />,         color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
  mindfulness: { label: 'Mindfulness',  icon: <Sparkles className="w-4 h-4" />,       color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  movement:    { label: 'Movement',     icon: <PersonStanding className="w-4 h-4" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

const CATEGORIES = ['all', 'breathing', 'grounding', 'mindfulness', 'movement'];

// ─── Exercise Card ─────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, onStart, isCompleted }: {
  exercise: Exercise;
  onStart: () => void;
  isCompleted: boolean;
}) {
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.mindfulness;
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#f9f6f0]/50 hover:shadow-md transition-all flex flex-col gap-4 relative">
      {isCompleted && (
        <div className="absolute top-4 right-4">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={clsx('flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border', meta.bg, meta.color)}>
          {meta.icon} {meta.label}
        </span>
        <span className="text-xs text-[#2b213a]/40 capitalize">{exercise.difficulty}</span>
      </div>

      <div>
        <h3 className="font-semibold text-[#2b213a] text-lg leading-snug">{exercise.title}</h3>
        <p className="text-sm text-[#2b213a]/60 mt-1 leading-relaxed line-clamp-2">{exercise.description}</p>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#2b213a]/50">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exercise.durationMinutes} min</span>
        <span className="flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{exercise.steps.length} steps</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {exercise.benefits.slice(0, 2).map(b => (
          <span key={b} className="text-[10px] bg-[#f9f6f0] text-[#4a3b69] px-2.5 py-1 rounded-full border border-[#e2d4f0]">
            {b}
          </span>
        ))}
      </div>

      <button
        onClick={onStart}
        className="mt-auto flex items-center justify-center gap-2 w-full bg-[#4a3b69] text-white py-3 rounded-2xl font-medium text-sm hover:bg-[#392d52] transition-colors shadow-sm"
      >
        <Play className="w-4 h-4 fill-white" /> Start Exercise
      </button>
    </div>
  );
}

// ─── Exercise Runner ───────────────────────────────────────────────────────────

function ExerciseRunner({ exercise, onComplete, onClose }: {
  exercise: Exercise;
  onComplete: (durationSec: number, rating: number) => void;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [running, setRunning]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [done, setDone]               = useState(false);
  const [rating, setRating]           = useState(0);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.mindfulness;

  const toggleTimer = () => {
    if (running) {
      clearInterval(intervalRef.current!);
      setRunning(false);
    } else {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      setRunning(true);
    }
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const reset = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setElapsed(0);
    setCurrentStep(0);
    setDone(false);
  };

  const handleStepForward = () => {
    if (currentStep < exercise.steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      clearInterval(intervalRef.current!);
      setRunning(false);
      setDone(true);
    }
  };

  const handleRateAndComplete = () => {
    onComplete(elapsed, rating);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#f9f6f0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={clsx('px-8 pt-8 pb-6 border-b border-[#2b213a]/5')}>
          <div className="flex justify-between items-start mb-2">
            <span className={clsx('flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border', meta.bg, meta.color)}>
              {meta.icon} {meta.label}
            </span>
            <button onClick={onClose} className="text-[#2b213a]/40 hover:text-[#2b213a] text-sm underline">Exit</button>
          </div>
          <h2 className="text-2xl font-semibold text-[#2b213a] mt-3">{exercise.title}</h2>
          <p className="text-sm text-[#2b213a]/60 mt-1">{exercise.description}</p>
        </div>

        {!done ? (
          <>
            {/* Timer + Step Progress */}
            <div className="flex items-center justify-between px-8 py-4 bg-white/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTimer}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    running ? 'bg-[#4a3b69] text-white' : 'bg-white border border-[#4a3b69]/20 text-[#4a3b69]'
                  )}
                >
                  {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {running ? 'Pause' : 'Start Timer'}
                </button>
                <span className="font-mono text-xl text-[#4a3b69] font-semibold">{fmtTime(elapsed)}</span>
              </div>
              <div className="text-xs text-[#2b213a]/50">
                Step {currentStep + 1} / {exercise.steps.length}
              </div>
            </div>

            {/* Step indicator bar */}
            <div className="flex gap-1 px-8 pb-2">
              {exercise.steps.map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex-1 h-1 rounded-full transition-all',
                    i < currentStep ? 'bg-[#a8d5ba]' : i === currentStep ? 'bg-[#4a3b69]' : 'bg-[#2b213a]/10'
                  )}
                />
              ))}
            </div>

            {/* Current step */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-[#e2d4f0]/50 shadow-sm animate-in fade-in duration-300">
                <p className="text-xs text-[#4a3b69]/60 uppercase font-semibold tracking-wider mb-3">Current Step</p>
                <p className="text-lg text-[#2b213a] leading-relaxed font-medium">{exercise.steps[currentStep]}</p>
              </div>

              {/* All steps list */}
              <div className="space-y-2">
                {exercise.steps.map((step, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm',
                      i === currentStep
                        ? 'bg-[#4a3b69]/10 text-[#4a3b69] font-medium'
                        : i < currentStep
                          ? 'text-[#2b213a]/40 line-through'
                          : 'text-[#2b213a]/70 hover:bg-white'
                    )}
                  >
                    <span className={clsx(
                      'shrink-0 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold mt-0.5',
                      i < currentStep ? 'bg-[#a8d5ba] text-white' : i === currentStep ? 'bg-[#4a3b69] text-white' : 'bg-[#2b213a]/10 text-[#2b213a]/40'
                    )}>
                      {i < currentStep ? '✓' : i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <div className="p-6 border-t border-[#2b213a]/5 flex gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-[#2b213a]/10 text-[#2b213a]/60 hover:bg-white text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleStepForward}
                className="flex-1 flex items-center justify-center gap-2 bg-[#4a3b69] text-white py-3 rounded-2xl font-medium text-sm hover:bg-[#392d52] transition-colors"
              >
                {currentStep === exercise.steps.length - 1 ? (
                  <><CheckCircle className="w-4 h-4" /> Complete Exercise</>
                ) : (
                  <>Next Step <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Completion screen */
          <div className="flex-1 p-8 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#a8d5ba]/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#4a3b69]" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-[#2b213a]">Well done!</h3>
              <p className="text-[#2b213a]/60 mt-1 text-sm">You completed <strong>{exercise.title}</strong> in {fmtTime(elapsed)}.</p>
            </div>

            <div className="w-full">
              <p className="text-sm font-medium text-[#2b213a] mb-3">How did it feel?</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={clsx(
                      'w-12 h-12 rounded-2xl text-xl transition-all border-2',
                      rating >= n ? 'bg-[#4a3b69] border-[#4a3b69] scale-110' : 'bg-white border-[#e2d4f0] hover:border-[#4a3b69]/40'
                    )}
                  >
                    <Star className={clsx('w-5 h-5 mx-auto', rating >= n ? 'text-white fill-white' : 'text-[#2b213a]/30')} />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full bg-[#f9f6f0] rounded-2xl p-4">
              <p className="text-xs text-[#2b213a]/60 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5" /> Benefits of this exercise</p>
              <ul className="text-xs text-[#2b213a]/70 space-y-1">
                {exercise.benefits.map(b => <li key={b} className="flex items-center gap-2"><span className="text-[#a8d5ba]">✓</span>{b}</li>)}
              </ul>
            </div>

            <button
              onClick={handleRateAndComplete}
              className="w-full bg-[#4a3b69] text-white py-3.5 rounded-2xl font-medium text-sm hover:bg-[#392d52] transition-colors shadow-sm"
            >
              Save & Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Exercises() {
  const [exercises, setExercises]           = useState<Exercise[]>([]);
  const [logs, setLogs]                     = useState<ExerciseLog[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeFilter, setActiveFilter]     = useState('all');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [successId, setSuccessId]           = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [eRes, lRes] = await Promise.all([
        fetch('/api/exercises'),
        fetch('/api/exercises/logs'),
      ]);
      if (eRes.ok) setExercises(await eRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = async (durationSec: number, rating: number) => {
    if (!activeExercise) return;
    try {
      const res = await fetch(`/api/exercises/${activeExercise.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSec, rating }),
      });
      if (res.ok) {
        const log: ExerciseLog = await res.json();
        setLogs(prev => [log, ...prev]);
        setSuccessId(activeExercise.id);
        setTimeout(() => setSuccessId(null), 4000);
      }
    } catch { /* silent */ }
    setActiveExercise(null);
  };

  const filtered = activeFilter === 'all'
    ? exercises
    : exercises.filter(e => e.category === activeFilter);

  const completedIds = new Set(logs.map(l => l.exerciseId));
  const streak = logs.length; // simplified — just total count for now

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-3xl md:text-4xl font-medium text-[#2b213a] tracking-tight">Coping Exercises</h2>
        <p className="text-[#2b213a]/60 mt-1">
          Evidence-based techniques to calm your mind, ground yourself, and build resilience.
        </p>
      </header>

      {/* Stats row */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Completed', value: logs.length, icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
            { label: 'Unique exercises', value: completedIds.size, icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
            { label: 'Minutes practised', value: Math.round(logs.reduce((s, l) => s + l.durationSec, 0) / 60), icon: <Flame className="w-5 h-5 text-orange-500" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#f9f6f0]/50 text-center">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className="text-2xl font-bold text-[#4a3b69]">{stat.value}</p>
              <p className="text-xs text-[#2b213a]/50 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-[#2b213a]/40 shrink-0" />
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0',
                activeFilter === cat
                  ? 'bg-[#4a3b69] text-white border-[#4a3b69]'
                  : 'bg-white text-[#2b213a]/60 border-[#e2d4f0] hover:border-[#4a3b69]/30'
              )}
            >
              {meta?.icon}
              {cat === 'all' ? 'All' : meta?.label}
            </button>
          );
        })}
      </div>

      {/* Success banner */}
      {successId && (
        <div className="bg-[#a8d5ba]/20 border border-[#a8d5ba] rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 text-[#4a3b69]" />
          <p className="text-sm text-[#2b213a] font-medium">Exercise logged! Great work taking care of yourself.</p>
        </div>
      )}

      {/* Exercise Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-[#f9f6f0]/50 animate-pulse space-y-4">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded-2xl mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map(e => (
            <ExerciseCard
              key={e.id}
              exercise={e}
              onStart={() => setActiveExercise(e)}
              isCompleted={completedIds.has(e.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#2b213a]/40">
              No exercises found in this category.
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {logs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50">
          <h3 className="text-lg font-medium text-[#2b213a] mb-5">Recent Activity</h3>
          <div className="divide-y divide-gray-100">
            {logs.slice(0, 8).map(log => {
              const ex = exercises.find(e => e.id === log.exerciseId);
              const meta = CATEGORY_META[log.category] || CATEGORY_META.mindfulness;
              return (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={clsx('p-2 rounded-xl border', meta.bg)}>{meta.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[#2b213a]">{ex?.title ?? log.exerciseId}</p>
                      <p className="text-xs text-[#2b213a]/40">
                        {new Date(log.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {Math.round(log.durationSec / 60)} min
                      </p>
                    </div>
                  </div>
                  {log.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={clsx('w-3.5 h-3.5', n <= log.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Runner overlay */}
      {activeExercise && (
        <ExerciseRunner
          exercise={activeExercise}
          onComplete={handleComplete}
          onClose={() => setActiveExercise(null)}
        />
      )}
    </div>
  );
}
