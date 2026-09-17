import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, CornerDownLeft, Plus, AlertTriangle, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useVoice } from '../hooks/useVoice';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  safetyStatus?: string;
};

type ConversationSummary = {
  id: string;
  title: string | null;
  updatedAt: string;
  _count?: { messages: number };
};

const SUGGESTED_PROMPTS = [
  'I feel overwhelmed today.',
  'Help me understand what I’m feeling.',
  'I need help calming down.',
  'I want to talk about something difficult.',
];

export function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoice();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Load conversations and initial dev conversation
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConversationId) {
          selectConversation(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  useEffect(() => {
    // Check or create default conversation
    fetch('/api/init-dev', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        const cid = data.conversationId || data.conversation?.id;
        if (cid) {
          setActiveConversationId(cid);
          loadConversationMessages(cid);
        }
        loadConversations();
      })
      .catch(() => loadConversations());
  }, []);

  const loadConversationMessages = async (cid: string) => {
    try {
      const res = await fetch(`/api/chat/${cid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    }
  };

  const selectConversation = (cid: string) => {
    setActiveConversationId(cid);
    loadConversationMessages(cid);
  };

  const handleNewConversation = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Reflection' })
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || input;
    if (!text.trim()) return;

    let convId = activeConversationId;
    if (!convId) {
      try {
        const initRes = await fetch('/api/init-dev', { method: 'POST' });
        const initData = await initRes.json();
        convId = initData.conversationId || initData.conversation?.id;
        if (convId) {
          setActiveConversationId(convId);
        } else {
          const createRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Conversation' })
          });
          const newConv = await createRes.json();
          convId = newConv.id;
          setActiveConversationId(convId);
        }
      } catch (e) {
        console.error('Could not ensure active conversation:', e);
        return;
      }
    }

    if (!convId) return;

    if (isListening) {
      stopListening();
    }

    const tempUserMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setTranscript('');
    setIsTyping(true);

    try {
      const response = await fetch(`/api/chat/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      const data = await response.json();
      
      if (data.safety?.shouldShowCrisisUI) {
        setShowCrisisAlert(true);
      }

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, data.userMessage, data.assistantMessage];
      });
      loadConversations();
    } catch (error) {
      console.error('Chat error:', error);
      setTimeout(() => {
        const assistantMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: 'I hear you, and I am holding space for you. Take a slow breath. What is feeling heaviest right now?',
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500">
      {/* Conversations History Sidebar (Desktop) */}
      <div className="hidden lg:flex w-64 flex-col bg-white rounded-3xl p-4 shadow-sm border border-[#f9f6f0]/50 shrink-0">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#f9f6f0] hover:bg-[#e2d4f0]/40 text-[#4a3b69] font-medium rounded-2xl transition-colors text-sm mb-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        <div className="text-xs font-semibold uppercase tracking-wider text-[#2b213a]/40 px-2 mb-2">
          Your Conversations
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={clsx(
                'w-full text-left px-3.5 py-3 rounded-2xl transition-all text-xs flex items-center gap-2.5',
                conv.id === activeConversationId
                  ? 'bg-[#4a3b69] text-white shadow-sm font-medium'
                  : 'hover:bg-[#f9f6f0] text-[#2b213a]/70'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{conv.title || 'Gentle Reflection'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversational Stage */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Stage Header */}
        <header className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-medium text-[#2b213a] tracking-tight">AI Chat Companion</h2>
            <p className="text-xs text-[#2b213a]/60">Reflective, non-judgmental space to unpack your feelings.</p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-[#f9f6f0]/50">
            <div className={clsx(
              "w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#fbc4ab] shadow-[0_0_10px_rgba(168,213,186,0.5)] transition-all duration-700",
              isTyping ? "animate-pulse scale-125" : ""
            )} />
            <span className="text-xs font-medium text-[#2b213a]/70">
              {isTyping ? 'Thinking...' : 'Calm'}
            </span>
          </div>
        </header>

        {/* Crisis Alert Banner if high risk detected */}
        {showCrisisAlert && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-xs text-red-700">
                It sounds like you may be carrying something very heavy or unsafe. You deserve immediate human care.
              </p>
            </div>
            <button
              onClick={() => navigate('/support')}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-sm"
            >
              Get Immediate Help
            </button>
          </div>
        )}

        {/* Chat Messages Stage */}
        <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl shadow-sm border border-[#f9f6f0]/50 p-6 md:p-8 flex flex-col gap-5">
          {messages.length === 0 ? (
            <div className="my-auto text-center space-y-6 max-w-md mx-auto py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#fbc4ab] shadow-[0_0_30px_rgba(168,213,186,0.5)] flex items-center justify-center animate-pulse">
                <Sparkles className="w-7 h-7 text-[#4a3b69]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-[#2b213a]">Take a breath. HAVEN is listening.</h3>
                <p className="text-xs text-[#2b213a]/60">
                  Select a starter below or type what is currently weighing on you.
                </p>
              </div>

              {/* Starter Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="p-3 bg-[#f9f6f0] hover:bg-[#e2d4f0]/40 text-[#2b213a]/80 text-xs rounded-2xl transition-colors border border-transparent hover:border-[#4a3b69]/10"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const timeString = msg.createdAt 
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id}
                  className={clsx(
                    'max-w-[85%] md:max-w-[75%] rounded-3xl p-5 text-sm leading-relaxed flex flex-col gap-1',
                    isUser
                      ? 'bg-[#4a3b69] text-white rounded-br-sm self-end shadow-sm'
                      : 'bg-[#f9f6f0] text-[#2b213a] rounded-bl-sm self-start border border-[#f9f6f0]/50'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {timeString && (
                    <span className={clsx('text-[10px] self-end mt-1', isUser ? 'text-white/60' : 'text-[#2b213a]/40')}>
                      {timeString}
                    </span>
                  )}
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="bg-[#f9f6f0] text-[#2b213a] max-w-[85%] md:max-w-[70%] rounded-3xl rounded-bl-sm p-4 self-start border border-[#f9f6f0]/50 flex gap-2 items-center">
              <span className="w-2 h-2 bg-[#4a3b69]/40 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-[#4a3b69]/40 rounded-full animate-bounce delay-75" />
              <span className="w-2 h-2 bg-[#4a3b69]/40 rounded-full animate-bounce delay-150" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-white p-4 md:p-6 rounded-b-3xl shadow-sm border-t border-[#f9f6f0]/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What feels heaviest right now?..."
              className="w-full bg-[#f9f6f0] border-none rounded-2xl py-4 pl-5 pr-24 focus:ring-2 focus:ring-[#4a3b69]/20 outline-none text-sm text-[#2b213a] placeholder:text-[#2b213a]/40"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={clsx(
                  'p-2.5 transition-colors rounded-full',
                  isListening
                    ? 'text-white bg-red-500 animate-pulse hover:bg-red-600'
                    : 'text-[#2b213a]/40 hover:text-[#4a3b69] hover:bg-white'
                )}
                title={isListening ? 'Stop dictation' : 'Voice Dictate'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-[#4a3b69] text-white rounded-xl shadow-sm hover:bg-[#392d52] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="text-center mt-2.5 text-[11px] text-[#2b213a]/40 flex justify-center items-center gap-1">
            Press <CornerDownLeft className="w-3 h-3" /> to send. HAVEN AI provides empathetic reflection, not clinical diagnosis.
          </div>
        </div>
      </div>
    </div>
  );
}

