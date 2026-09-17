import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, MessageCircle, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { useVoiceConversation, type VoiceState } from '../hooks/useVoiceConversation';
import clsx from 'clsx';

const STATE_LABELS: Record<VoiceState, string> = {
  idle: 'Tap the orb or button below to speak with HAVEN.',
  'requesting-permission': 'Requesting microphone access...',
  listening: 'Listening to you...',
  processing: 'HAVEN is thinking...',
  speaking: 'HAVEN is speaking...',
  error: 'Something went wrong.',
  unsupported: 'Voice not available in this browser.',
};

const ORB_CLASSES: Record<VoiceState, string> = {
  idle: 'animate-pulse bg-gradient-radial from-[#a8d5ba] to-[#e2d4f0] shadow-[0_0_60px_rgba(168,213,186,0.5)] cursor-pointer hover:scale-105',
  'requesting-permission': 'animate-pulse bg-gradient-radial from-[#fbc4ab] to-[#e2d4f0] shadow-[0_0_60px_rgba(251,196,171,0.5)]',
  listening: 'bg-gradient-radial from-[#a8d5ba] to-[#4a3b69] shadow-[0_0_90px_rgba(74,59,105,0.7)] scale-110',
  processing: 'bg-gradient-radial from-[#e2d4f0] to-[#4a3b69] shadow-[0_0_90px_rgba(74,59,105,0.6)] animate-pulse',
  speaking: 'bg-gradient-radial from-[#fbc4ab] to-[#f4a261] shadow-[0_0_90px_rgba(244,162,97,0.7)]',
  error: 'bg-gradient-radial from-[#fca5a5] to-[#ef4444] shadow-[0_0_60px_rgba(239,68,68,0.5)]',
  unsupported: 'bg-gradient-radial from-[#d1d5db] to-[#9ca3af] shadow-none',
};

export function VoiceAssistant() {
  const navigate = useNavigate();
  const {
    state,
    userTranscript,
    aiTranscript,
    error,
    isMuted,
    isSupported,
    startConversation,
    endSession,
    toggleMute,
    retry,
  } = useVoiceConversation();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    // Fetch default dev conversation
    fetch('/api/init-dev', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        const cid = data.conversationId || data.conversation?.id;
        if (cid) {
          setConversationId(cid);
        }
      })
      .catch(() => {});
  }, []);

  // Handle user starting the session
  const handleStart = useCallback(() => {
    if (conversationId) {
      setHasInitiated(true);
      startConversation(conversationId);
    }
  }, [conversationId, startConversation]);

  // Warn before leaving active session
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state === 'listening' || state === 'speaking' || state === 'processing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state]);

  const handleEnd = useCallback(() => {
    endSession();
    setHasInitiated(false);
  }, [endSession]);

  const isSessionLive = state === 'listening' || state === 'processing' || state === 'speaking';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-6 relative animate-in fade-in duration-500">
      {/* Voice Sanctuary Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-medium text-[#2b213a] tracking-tight">Voice Sanctuary</h2>
        <p className="text-xs text-[#2b213a]/60 mt-1">Speak naturally. HAVEN listens and reflects with care.</p>
      </div>

      {/* Main Orb Container */}
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <div className="relative flex items-center justify-center">
          {/* Animated pulsing wave rings */}
          {!reducedMotion && isSessionLive && (
            <div
              className="absolute w-72 h-72 rounded-full border-2 border-[#4a3b69]/20 animate-spin"
              style={{ animationDuration: '4s' }}
            />
          )}
          {!reducedMotion && state === 'speaking' && (
            <>
              <div
                className="absolute w-72 h-72 rounded-full bg-[#fbc4ab]/20 animate-ping"
                style={{ animationDuration: '1.8s' }}
              />
              <div
                className="absolute w-60 h-60 rounded-full bg-[#fbc4ab]/20 animate-ping"
                style={{ animationDuration: '1.2s' }}
              />
            </>
          )}

          {/* Interactive Core Orb */}
          <div
            onClick={state === 'idle' ? handleStart : undefined}
            className={clsx(
              'w-48 h-48 sm:w-56 sm:h-56 rounded-full transition-all duration-700 flex items-center justify-center select-none',
              ORB_CLASSES[state]
            )}
            title={state === 'idle' ? 'Click to start voice session' : ''}
          >
            {state === 'idle' && (
              <div className="flex flex-col items-center gap-2 text-[#4a3b69]/80 group">
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
                <span className="text-[11px] font-semibold tracking-wider uppercase">Tap to Speak</span>
              </div>
            )}
          </div>
        </div>

        {/* State description */}
        <div className="text-center space-y-1.5">
          <p className="text-lg md:text-xl font-medium text-[#2b213a]">{STATE_LABELS[state]}</p>
          {state === 'requesting-permission' && (
            <p className="text-xs text-[#2b213a]/60">Allow microphone access in your browser to continue.</p>
          )}
        </div>

        {/* Transcripts Display */}
        <div className="w-full space-y-3">
          {userTranscript && (
            <div className="bg-[#4a3b69] text-white px-5 py-3.5 rounded-3xl rounded-br-sm text-sm leading-relaxed self-end ml-auto max-w-[88%] w-fit text-right shadow-sm animate-in slide-in-from-bottom-2">
              <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider mb-1">You said</p>
              <p className="whitespace-pre-wrap">{userTranscript}</p>
            </div>
          )}
          {aiTranscript && (
            <div className="bg-white text-[#2b213a] px-5 py-4 rounded-3xl rounded-bl-sm text-sm leading-relaxed shadow-sm border border-[#f9f6f0]/60 max-w-[88%] animate-in slide-in-from-bottom-2">
              <p className="text-[#4a3b69]/60 text-[10px] uppercase font-semibold tracking-wider mb-1">HAVEN</p>
              <p className="whitespace-pre-wrap">{aiTranscript}</p>
            </div>
          )}
        </div>

        {/* Error Handling State */}
        {(state === 'error' || state === 'unsupported') && (
          <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {state === 'error' && conversationId && (
                <button
                  onClick={retry}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              )}
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center gap-2 px-4 py-2 bg-[#4a3b69] text-white rounded-xl text-sm hover:bg-[#392d52] transition-colors font-medium shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> Switch to Text Chat
              </button>
            </div>
          </div>
        )}

        {/* Control Action Buttons */}
        {isSupported && state !== 'unsupported' && (
          <div className="flex items-center gap-3">
            {state === 'idle' ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#4a3b69] text-white rounded-2xl font-medium text-sm hover:bg-[#392d52] transition-all shadow-md hover:scale-105"
              >
                <Mic className="w-5 h-5" />
                <span>Start Conversation</span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all shadow-sm',
                    isMuted
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'bg-white text-[#4a3b69] border border-[#e2d4f0] hover:bg-[#f9f6f0]'
                  )}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span className="text-[11px] font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={handleEnd}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-white text-red-600 border border-red-100 hover:bg-red-50 transition-all shadow-sm"
                  aria-label="End session"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span className="text-[11px] font-medium">End Session</span>
                </button>

                <button
                  onClick={() => navigate('/chat')}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-white text-[#2b213a]/70 border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                  aria-label="Switch to text chat"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Text Chat</span>
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-[11px] text-[#2b213a]/40 text-center max-w-sm">
          HAVEN AI is a supportive companion, not a clinical therapy service.
        </p>
      </div>
    </div>
  );
}
