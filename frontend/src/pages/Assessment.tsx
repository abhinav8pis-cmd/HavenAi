import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, ChevronRight, ChevronLeft, CheckCircle, Clock, BarChart3, Trash2, RefreshCw, Brain, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentQuestion {
  id: number;
  text: string;
  options: string[];
}

interface AssessmentDef {
  id: string;
  name: string;
  description: string;
  category: 'depression' | 'anxiety' | 'stress';
  estimatedMinutes: number;
  questions: AssessmentQuestion[];
  scoringGuide: Record<string, string>;
}

interface AssessmentResult {
  id: string;
  assessmentId: string;
  answers: Record<string, number>;
  totalScore: number;
  severity: string;
  aiInsight: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  depression: { label: 'Depression', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: '🧠' },
  anxiety:    { label: 'Anxiety',    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '💭' },
  stress:     { label: 'Stress',     color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: '⚡' },
};

const SEVERITY_COLOR: Record<string, string> = {
  minimal: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  low:     'text-emerald-700 bg-emerald-50 border-emerald-200',
  mild:    'text-amber-700 bg-amber-50 border-amber-200',
  moderate:'text-orange-700 bg-orange-50 border-orange-200',
  high:    'text-red-700 bg-red-50 border-red-200',
  severe:  'text-red-700 bg-red-50 border-red-200',
};

// ─── Components ───────────────────────────────────────────────────────────────

function AssessmentCard({ assessment, onStart, latestResult }: {
  assessment: AssessmentDef;
  onStart: () => void;
  latestResult?: AssessmentResult;
}) {
  const meta = CATEGORY_META[assessment.category];
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#f9f6f0]/50 hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className={clsx('text-xs font-semibold px-3 py-1 rounded-full border', meta.bg, meta.color)}>
          {meta.icon} {meta.label}
        </span>
        {latestResult && (
          <span className={clsx('text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize', SEVERITY_COLOR[latestResult.severity.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200')}>
            Last: {latestResult.severity}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-[#2b213a] text-lg leading-snug">{assessment.name}</h3>
        <p className="text-sm text-[#2b213a]/60 mt-1 leading-relaxed">{assessment.description}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-[#2b213a]/50">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{assessment.estimatedMinutes} min</span>
        <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />{assessment.questions.length} questions</span>
      </div>
      <button
        onClick={onStart}
        className="mt-auto flex items-center justify-center gap-2 w-full bg-[#4a3b69] text-white py-3 rounded-2xl font-medium text-sm hover:bg-[#392d52] transition-colors shadow-sm"
      >
        {latestResult ? 'Retake Assessment' : 'Start Assessment'} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function QuizPanel({ assessment, onComplete, onClose }: {
  assessment: AssessmentDef;
  onComplete: (result: AssessmentResult) => void;
  onClose: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = assessment.questions[currentQ];
  const isAnswered = answers[question.id] !== undefined;
  const isLast = currentQ === assessment.questions.length - 1;
  const progress = ((currentQ) / assessment.questions.length) * 100;

  const handleAnswer = (score: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: score }));
  };

  const handleNext = async () => {
    if (!isAnswered) return;
    if (!isLast) {
      setCurrentQ(c => c + 1);
      return;
    }
    // Submit
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error('Submit failed');
      const data: AssessmentResult = await res.json();
      onComplete(data);
    } catch {
      setError('Could not submit your assessment. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/30 backdrop-blur-sm items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#f9f6f0] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#2b213a]/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-[#2b213a]/50 uppercase font-semibold tracking-wider mb-1">{assessment.name}</p>
              <p className="text-sm text-[#2b213a]/60">Question {currentQ + 1} of {assessment.questions.length}</p>
            </div>
            <button onClick={onClose} className="text-[#2b213a]/40 hover:text-[#2b213a] text-sm underline">Exit</button>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#2b213a]/10 rounded-full">
            <div
              className="h-1.5 bg-gradient-to-r from-[#4a3b69] to-[#a8d5ba] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xl font-medium text-[#2b213a] leading-relaxed">
            {question.text}
          </p>
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={clsx(
                  'w-full text-left px-5 py-4 rounded-2xl border-2 transition-all text-sm font-medium',
                  answers[question.id] === idx
                    ? 'bg-[#4a3b69] text-white border-[#4a3b69]'
                    : 'bg-white text-[#2b213a] border-transparent hover:border-[#4a3b69]/30'
                )}
              >
                <span className="inline-block w-6 h-6 rounded-full border-2 border-current mr-3 text-center text-xs leading-5">
                  {answers[question.id] === idx ? '✓' : idx}
                </span>
                {opt}
              </button>
            ))}
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-[#2b213a]/5 flex gap-3">
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(c => c - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#2b213a]/10 text-[#2b213a]/60 hover:bg-white transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isAnswered || submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-[#4a3b69] text-white py-3 rounded-2xl font-medium text-sm hover:bg-[#392d52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analysing...</>
            ) : isLast ? (
              <><CheckCircle className="w-4 h-4" /> Submit & Get Results</>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, assessmentName, onClose, onRetake }: {
  result: AssessmentResult;
  assessmentName: string;
  onClose: () => void;
  onRetake: () => void;
}) {
  const severityKey = result.severity.toLowerCase();
  const severityClass = SEVERITY_COLOR[severityKey] || 'text-gray-700 bg-gray-50 border-gray-200';
  const date = new Date(result.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex bg-black/30 backdrop-blur-sm items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#f9f6f0] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-[#4a3b69] text-white p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#a8d5ba]" />
          <h3 className="text-2xl font-semibold">Assessment Complete</h3>
          <p className="text-white/70 text-sm mt-1">{date}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-[#2b213a]/60 mb-2">{assessmentName}</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-5xl font-bold text-[#4a3b69]">{result.totalScore}</p>
                <p className="text-xs text-[#2b213a]/50 mt-1">Total Score</p>
              </div>
              <div className={clsx('px-5 py-2 rounded-2xl border-2 text-center capitalize font-semibold', severityClass)}>
                {result.severity}
              </div>
            </div>
          </div>

          {result.aiInsight && (
            <div className="bg-white rounded-2xl p-5 border border-[#a8d5ba]/30">
              <p className="text-xs text-[#4a3b69]/60 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> HAVEN Insight
              </p>
              <p className="text-sm text-[#2b213a]/80 leading-relaxed italic">{result.aiInsight}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              This is a screening tool, not a clinical diagnosis. If you are concerned about your results, please speak with a qualified mental health professional.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-[#2b213a]/10 text-sm text-[#2b213a]/70 hover:bg-white transition-colors font-medium">
              Close
            </button>
            <button onClick={onRetake} className="flex-1 py-3 rounded-2xl bg-[#4a3b69] text-white text-sm font-medium hover:bg-[#392d52] transition-colors shadow-sm">
              Retake
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Assessment() {
  const [assessments, setAssessments] = useState<AssessmentDef[]>([]);
  const [results, setResults]         = useState<AssessmentResult[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentDef | null>(null);
  const [completedResult, setCompletedResult]   = useState<AssessmentResult | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, rRes] = await Promise.all([
        fetch('/api/assessments'),
        fetch('/api/assessments/results'),
      ]);
      if (aRes.ok) setAssessments(await aRes.json());
      if (rRes.ok) setResults(await rRes.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = (result: AssessmentResult) => {
    setResults(prev => [result, ...prev]);
    setActiveAssessment(null);
    setCompletedResult(result);
  };

  const handleDeleteResult = async (id: string) => {
    try {
      await fetch(`/api/assessments/results/${id}`, { method: 'DELETE' });
      setResults(prev => prev.filter(r => r.id !== id));
    } catch { /* silent */ }
  };

  const getLatestResult = (assessmentId: string) =>
    results.find(r => r.assessmentId === assessmentId);

  const getAssessmentName = (id: string) =>
    assessments.find(a => a.id === id)?.name ?? id;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-3xl md:text-4xl font-medium text-[#2b213a] tracking-tight">Assessments</h2>
        <p className="text-[#2b213a]/60 mt-1">
          Validated screening tools to better understand your mental wellbeing. These are not diagnoses.
        </p>
      </header>

      {/* Assessment Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-[#f9f6f0]/50 animate-pulse space-y-4">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded-2xl mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assessments.map(a => (
            <AssessmentCard
              key={a.id}
              assessment={a}
              onStart={() => setActiveAssessment(a)}
              latestResult={getLatestResult(a.id)}
            />
          ))}
        </div>
      )}

      {/* History */}
      {results.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#4a3b69]" />
            <h3 className="text-lg font-medium text-[#2b213a]">Your History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {results.map(r => {
              const severityClass = SEVERITY_COLOR[r.severity.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
              return (
                <div key={r.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-sm text-[#2b213a]">{getAssessmentName(r.assessmentId)}</p>
                      <p className="text-xs text-[#2b213a]/40 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#4a3b69]">{r.totalScore}</p>
                      <p className="text-[10px] text-[#2b213a]/40">score</p>
                    </div>
                    <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full border capitalize whitespace-nowrap', severityClass)}>
                      {r.severity}
                    </span>
                    <button
                      onClick={() => handleDeleteResult(r.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                      title="Delete result"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-[#f9f6f0] border border-[#e2d4f0] rounded-2xl p-5">
        <p className="text-xs text-[#2b213a]/60 leading-relaxed">
          <strong className="text-[#4a3b69]">Important:</strong> These screening tools (PHQ-9, GAD-7, PSS-10) are widely used in clinical settings but they are not substitutes for a professional diagnosis. If your results indicate moderate or severe levels, please consider speaking with a qualified mental health professional or your doctor.
        </p>
      </div>

      {/* Quiz Overlay */}
      {activeAssessment && (
        <QuizPanel
          assessment={activeAssessment}
          onComplete={handleComplete}
          onClose={() => setActiveAssessment(null)}
        />
      )}

      {/* Result Overlay */}
      {completedResult && (
        <ResultPanel
          result={completedResult}
          assessmentName={getAssessmentName(completedResult.assessmentId)}
          onClose={() => setCompletedResult(null)}
          onRetake={() => {
            const a = assessments.find(a => a.id === completedResult.assessmentId) ?? null;
            setCompletedResult(null);
            setActiveAssessment(a);
          }}
        />
      )}
    </div>
  );
}
