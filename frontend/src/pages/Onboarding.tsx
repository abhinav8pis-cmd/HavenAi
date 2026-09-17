import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, ArrowRight, ArrowLeft, Mic, MessageCircle, Check } from 'lucide-react';
import clsx from 'clsx';

const WELLNESS_GOALS = [
  { id: 'stress', label: 'Reduce daily stress', desc: 'Find calm when overwhelmed' },
  { id: 'sleep', label: 'Improve sleep & rest', desc: 'Quiet the racing thoughts at night' },
  { id: 'confidence', label: 'Build gentle confidence', desc: 'Honor your progress and worth' },
  { id: 'emotions', label: 'Manage heavy emotions', desc: 'Process feelings without judgment' },
  { id: 'lonely', label: 'Feel less alone', desc: 'Have a patient listener anytime' },
  { id: 'habits', label: 'Build healthy reflection habits', desc: 'Daily mindful check-ins' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(localStorage.getItem('haven_name') || '');
  const [goals, setGoals] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('haven_goals') || '[]');
    } catch {
      return [];
    }
  });
  const [preferredMode, setPreferredMode] = useState<'voice' | 'chat'>('voice');

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  const handleComplete = () => {
    localStorage.setItem('haven_name', name.trim() || 'Friend');
    localStorage.setItem('haven_goals', JSON.stringify(goals));
    localStorage.setItem('haven_mode', preferredMode);
    localStorage.setItem('haven_onboarded', 'true');
    
    if (preferredMode === 'voice') {
      navigate('/voice');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f6f0] text-[#2b213a] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#a8d5ba]/20 via-[#fbc4ab]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#e2d4f0]/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header with Progress Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#fbc4ab] shadow-sm animate-pulse" />
          <span className="font-bold tracking-wide text-sm text-[#4a3b69]">HAVEN AI</span>
        </div>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-[#4a3b69]' : s < step ? 'w-3 bg-[#a8d5ba]' : 'w-3 bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Main Step Content */}
      <div className="max-w-xl mx-auto w-full my-auto py-8 z-10 animate-in fade-in duration-400">
        {step === 1 && (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#fbc4ab] shadow-[0_0_50px_rgba(168,213,186,0.6)] flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-[#4a3b69]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#2b213a]">Welcome to HAVEN AI</h2>
              <p className="text-[#2b213a]/70 text-base max-w-md mx-auto leading-relaxed">
                “A calmer place to check in with yourself.”
              </p>
            </div>
            <p className="text-sm text-[#2b213a]/60 max-w-sm mx-auto">
              A private digital sanctuary to talk, reflect, unburden your mind, and honor how you are arriving today.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#4a3b69] hover:bg-[#392d52] text-white font-medium rounded-2xl transition-all shadow-md inline-flex items-center justify-center gap-2"
              >
                <span>Step into Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#e2d4f0] flex items-center justify-center text-[#4a3b69]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2b213a] mb-2">Our Sanctuary Promise</h3>
              <p className="text-sm text-[#2b213a]/70">We believe emotional health requires absolute trust and safety.</p>
            </div>

            <div className="space-y-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-sm text-[#2b213a]/80">
              <div className="flex gap-3 items-start">
                <span className="text-lg">🔒</span>
                <p><strong>Private by design:</strong> Your reflections and check-ins remain your own sanctuary.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-lg">🌱</span>
                <p><strong>Non-judgmental:</strong> No clinical labels, no diagnostic certainty, just empathetic reflection.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-lg">🚨</span>
                <p><strong>Not emergency care:</strong> HAVEN AI is an accessible companion, not a certified therapist or crisis line.</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep(1)}
                className="text-sm font-medium text-[#2b213a]/50 hover:text-[#2b213a] inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-[#4a3b69] hover:bg-[#392d52] text-white font-medium rounded-2xl transition-all shadow-sm inline-flex items-center gap-2 text-sm"
              >
                <span>I Understand & Agree</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#fbc4ab]/40 flex items-center justify-center text-[#4a3b69]">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2b213a] mb-2">What should HAVEN call you?</h3>
              <p className="text-sm text-[#2b213a]/70">A first name or nickname helps create a familiar space.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or nickname..."
                className="w-full px-5 py-3.5 bg-[#f9f6f0] rounded-2xl border border-transparent focus:border-[#4a3b69]/30 outline-none text-base text-[#2b213a] font-medium"
                autoFocus
              />
              <p className="text-xs text-[#2b213a]/50">
                You can leave this blank or skip if you prefer to remain anonymous.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-[#2b213a]/50 hover:text-[#2b213a] inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setName('Friend'); setStep(4); }}
                  className="px-4 py-3 text-sm text-[#2b213a]/60 hover:text-[#2b213a] font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-[#4a3b69] hover:bg-[#392d52] text-white font-medium rounded-2xl transition-all shadow-sm inline-flex items-center gap-2 text-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2b213a] mb-2">What are your wellness intentions?</h3>
              <p className="text-sm text-[#2b213a]/70">Choose what feels relevant right now. You can change these anytime.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WELLNESS_GOALS.map((goal) => {
                const isSelected = goals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={clsx(
                      'p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-2',
                      isSelected
                        ? 'bg-[#4a3b69] text-white border-[#4a3b69] shadow-sm'
                        : 'bg-white hover:bg-gray-50 border-gray-100 text-[#2b213a]'
                    )}
                  >
                    <div>
                      <h4 className="font-semibold text-sm">{goal.label}</h4>
                      <p className={clsx('text-xs mt-1', isSelected ? 'text-white/80' : 'text-[#2b213a]/60')}>
                        {goal.desc}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-[#a8d5ba]" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep(3)}
                className="text-sm font-medium text-[#2b213a]/50 hover:text-[#2b213a] inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(5)}
                  className="px-4 py-3 text-sm text-[#2b213a]/60 hover:text-[#2b213a] font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-3 bg-[#4a3b69] hover:bg-[#392d52] text-white font-medium rounded-2xl transition-all shadow-sm inline-flex items-center gap-2 text-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2b213a] mb-2">How would you like to interact?</h3>
              <p className="text-sm text-[#2b213a]/70">You can always switch between spoken voice and typing anytime.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPreferredMode('voice')}
                className={clsx(
                  'p-6 rounded-3xl border text-left transition-all relative overflow-hidden',
                  preferredMode === 'voice'
                    ? 'bg-[#4a3b69] text-white border-[#4a3b69] shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-100 text-[#2b213a]'
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <Mic className={clsx('w-5 h-5', preferredMode === 'voice' ? 'text-[#a8d5ba]' : 'text-[#4a3b69]')} />
                </div>
                <h4 className="font-semibold text-lg mb-1">Voice Sanctuary</h4>
                <p className={clsx('text-xs leading-relaxed', preferredMode === 'voice' ? 'text-white/80' : 'text-[#2b213a]/70')}>
                  Speak naturally aloud. HAVEN listens and replies with a calming voice. Hands-free & natural.
                </p>
                <span className="inline-block mt-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-[#a8d5ba] text-[#2b213a] rounded-full">
                  Recommended
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredMode('chat')}
                className={clsx(
                  'p-6 rounded-3xl border text-left transition-all',
                  preferredMode === 'chat'
                    ? 'bg-[#4a3b69] text-white border-[#4a3b69] shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-100 text-[#2b213a]'
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <MessageCircle className={clsx('w-5 h-5', preferredMode === 'chat' ? 'text-[#a8d5ba]' : 'text-[#4a3b69]')} />
                </div>
                <h4 className="font-semibold text-lg mb-1">Text Journal & Chat</h4>
                <p className={clsx('text-xs leading-relaxed', preferredMode === 'chat' ? 'text-white/80' : 'text-[#2b213a]/70')}>
                  Take your time to type through thoughts, pause, and read responses at your own pace.
                </p>
              </button>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep(4)}
                className="text-sm font-medium text-[#2b213a]/50 hover:text-[#2b213a] inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3.5 bg-[#4a3b69] hover:bg-[#392d52] text-white font-medium rounded-2xl transition-all shadow-md inline-flex items-center gap-2 text-sm"
              >
                <span>Enter Your Sanctuary</span>
                <Sparkles className="w-4 h-4 text-[#a8d5ba]" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto w-full text-center text-xs text-[#2b213a]/40 z-10">
        Step {step} of 5 • HAVEN AI Mental Wellness Sanctuary
      </div>
    </div>
  );
}
