import { useState, useEffect, useRef, useCallback } from 'react';

export type VoiceState =
  | 'idle'
  | 'requesting-permission'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'unsupported';

const GREETING = "Hi, I am HAVEN. Take a slow breath — I'm right here with you. What feels most present for you today?";

export function useVoiceConversation() {
  const [state, setState] = useState<VoiceState>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const conversationIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  const stopRecognition = useCallback(() => {
    try {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    } catch {
      // Ignore
    }
  }, []);

  const speak = useCallback((text: string, onFinished?: () => void) => {
    if (!window.speechSynthesis) return;

    // Stop listening while speaking so mic does not hear itself
    stopRecognition();

    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setState('speaking');
    setAiTranscript(text);

    // Strip markdown characters from text for natural speech synthesis
    const cleanSpeech = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    // Select a pleasant natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      v =>
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.lang === 'en-US' ||
        v.lang.startsWith('en')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (onFinished) onFinished();
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (onFinished) onFinished();
    };

    window.speechSynthesis.speak(utterance);
  }, [stopRecognition]);

  const processUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || !conversationIdRef.current) return;
    
    stopRecognition();
    setState('processing');
    setAiTranscript('');

    try {
      const res = await fetch(
        `/api/chat/${conversationIdRef.current}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text.trim() }),
        }
      );

      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const aiText: string =
        data.assistantMessage?.content ||
        "I hear you. Could you share a little more about what's on your mind?";

      speak(aiText, () => {
        if (shouldRestartRef.current && !isMutedRef.current) {
          startListening();
        } else {
          setState('idle');
        }
      });
    } catch {
      setState('error');
      setError('HAVEN could not connect right now. Tap Try Again or switch to text chat.');
    }
  }, [speak, stopRecognition]);

  const startListening = useCallback(() => {
    if (!isSupported || isMutedRef.current || isSpeakingRef.current) return;

    stopRecognition();

    try {
      const win = window as any;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) return;

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setState('listening');
        setUserTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interim;
        if (currentText) {
          setUserTranscript(currentText);
        }

        if (finalTranscript.trim()) {
          stopRecognition();
          processUserMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Restart after short delay if session is active
          if (shouldRestartRef.current && !isMutedRef.current && !isSpeakingRef.current) {
            setTimeout(() => {
              if (shouldRestartRef.current && !isSpeakingRef.current) {
                startListening();
              }
            }, 600);
          }
        } else if (event.error === 'not-allowed') {
          setState('error');
          setError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'aborted') {
          setState('error');
          setError(`Microphone error: ${event.error}. Tap Try Again to reconnect.`);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (shouldRestartRef.current && !isMutedRef.current && !isSpeakingRef.current && state === 'listening') {
          setTimeout(() => {
            if (shouldRestartRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 300);
        }
      };

      recognition.start();
    } catch {
      setState('error');
      setError('Unable to activate speech recognition. Please tap Try Again.');
    }
  }, [isSupported, processUserMessage, stopRecognition, state]);

  const startConversation = useCallback(async (conversationId: string) => {
    if (!isSupported) {
      setState('unsupported');
      setError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    conversationIdRef.current = conversationId;
    shouldRestartRef.current = true;
    setState('requesting-permission');
    setError(null);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState('error');
      setError('Microphone access was denied. Please click the lock icon in your address bar and allow microphone permissions.');
      return;
    }

    speak(GREETING, () => {
      if (shouldRestartRef.current && !isMutedRef.current) {
        startListening();
      }
    });
  }, [isSupported, speak, startListening]);

  const stopListeningSession = useCallback(() => {
    shouldRestartRef.current = false;
    stopRecognition();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setState('idle');
  }, [stopRecognition]);

  const endSession = useCallback(() => {
    shouldRestartRef.current = false;
    isSpeakingRef.current = false;
    stopRecognition();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setState('idle');
    setUserTranscript('');
    setAiTranscript('');
  }, [stopRecognition]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        stopRecognition();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setState('idle');
      } else {
        shouldRestartRef.current = true;
        startListening();
      }
      return next;
    });
  }, [startListening, stopRecognition]);

  const retry = useCallback(() => {
    setError(null);
    shouldRestartRef.current = true;
    if (conversationIdRef.current) {
      startListening();
    }
  }, [startListening]);

  return {
    state,
    userTranscript,
    aiTranscript,
    error,
    isMuted,
    isSupported,
    startConversation,
    stopListening: stopListeningSession,
    endSession,
    toggleMute,
    retry,
  };
}
