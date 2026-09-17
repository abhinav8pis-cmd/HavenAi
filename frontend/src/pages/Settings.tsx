import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Volume2, Shield, Download, Trash2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export function Settings() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('haven_name') || 'Alex');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [goals, setGoals] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('haven_goals') || '["stress", "sleep"]');
    } catch {
      return ['stress', 'sleep'];
    }
  });

  // Voice settings
  const [voiceRate, setVoiceRate] = useState(() => Number(localStorage.getItem('haven_voice_rate') || '0.95'));
  const [voicePitch, setVoicePitch] = useState(() => Number(localStorage.getItem('haven_voice_pitch') || '1.05'));
  const [testVoiceSpeaking, setTestVoiceSpeaking] = useState(false);

  // Privacy dialog states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'conversations' | 'account' | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('haven_name', name.trim() || 'Alex');
    localStorage.setItem('haven_goals', JSON.stringify(goals));
    localStorage.setItem('haven_voice_rate', String(voiceRate));
    localStorage.setItem('haven_voice_pitch', String(voicePitch));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Take a moment. I am here with you.");
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.onstart = () => setTestVoiceSpeaking(true);
    utterance.onend = () => setTestVoiceSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [journalRes, moodRes] = await Promise.all([
        fetch('/api/journal'),
        fetch('/api/mood')
      ]);
      const journals = journalRes.ok ? await journalRes.json() : [];
      const moods = moodRes.ok ? await moodRes.json() : [];

      const exportBundle = {
        exportedAt: new Date().toISOString(),
        userName: name,
        wellnessGoals: goals,
        journals,
        moods,
      };

      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `haven-ai-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteType === 'conversations') {
      try {
        await fetch('/api/chat/all', { method: 'DELETE' });
      } catch {}
      setShowDeleteModal(false);
      navigate('/chat');
    } else if (deleteType === 'account') {
      localStorage.clear();
      setShowDeleteModal(false);
      navigate('/onboarding');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl pb-16">
      <header>
        <h2 className="text-3xl md:text-4xl font-medium text-[#2b213a] tracking-tight">Sanctuary Settings & Privacy</h2>
        <p className="text-[#2b213a]/60 mt-1">Manage your identity, voice preferences, and personal data boundaries.</p>
      </header>

      {savedSuccess && (
        <div className="bg-[#a8d5ba]/20 border border-[#a8d5ba] text-[#2b213a] px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <Check className="w-4 h-4 text-[#4a3b69]" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Profile & Name Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#e2d4f0] flex items-center justify-center text-[#4a3b69]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2b213a]">Your Profile</h3>
            <p className="text-xs text-[#2b213a]/50">How HAVEN addresses you</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#2b213a]/60 block mb-2">
              Preferred Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#f9f6f0] rounded-xl border border-transparent focus:border-[#4a3b69]/30 outline-none text-sm text-[#2b213a]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#2b213a]/60 block mb-2">
              Account Email
            </label>
            <input
              type="text"
              value="alex@haven-ai.local"
              disabled
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#4a3b69] hover:bg-[#392d52] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Voice & Speech Controls */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#a8d5ba]/40 flex items-center justify-center text-[#4a3b69]">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2b213a]">Voice Sanctuary Settings</h3>
            <p className="text-xs text-[#2b213a]/50">Customize HAVEN's spoken voice and pace</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#2b213a]/70 mb-2">
              <span>Speech Pace: {voiceRate.toFixed(2)}x</span>
              <span className="text-[10px] text-gray-400">Gentle & Deliberate</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={voiceRate}
              onChange={(e) => setVoiceRate(Number(e.target.value))}
              className="w-full accent-[#4a3b69]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-[#2b213a]/70 mb-2">
              <span>Voice Pitch: {voicePitch.toFixed(2)}</span>
              <span className="text-[10px] text-gray-400">Warm Resonance</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={voicePitch}
              onChange={(e) => setVoicePitch(Number(e.target.value))}
              className="w-full accent-[#4a3b69]"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={testVoiceSpeaking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#f9f6f0] hover:bg-[#e2d4f0]/40 text-[#4a3b69] rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{testVoiceSpeaking ? 'Speaking...' : 'Test Voice Sample'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Data Ownership */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#fbc4ab]/40 flex items-center justify-center text-[#4a3b69]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2b213a]">Privacy & Sanctuary Control</h3>
            <p className="text-xs text-[#2b213a]/50">Your data belongs to you alone</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-gray-100">
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[#2b213a]">Export Your Sanctuary Data</h4>
              <p className="text-xs text-[#2b213a]/60">Download a full JSON archive of your journals, moods, and reflections.</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f9f6f0] hover:bg-[#e2d4f0]/40 text-[#4a3b69] rounded-xl text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Preparing...' : 'Export JSON'}</span>
            </button>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-red-600">Clear Conversation History</h4>
              <p className="text-xs text-[#2b213a]/60">Permanently erase all chat messages and voice transcripts.</p>
            </div>
            <button
              type="button"
              onClick={() => { setDeleteType('conversations'); setShowDeleteModal(true); }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chats</span>
            </button>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-red-700">Delete Sanctuary Account</h4>
              <p className="text-xs text-[#2b213a]/60">Completely wipe all profile info, check-ins, journals, and start fresh.</p>
            </div>
            <button
              type="button"
              onClick={() => { setDeleteType('account'); setShowDeleteModal(true); }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#2b213a]">
                {deleteType === 'account' ? 'Delete entire account?' : 'Clear all conversation history?'}
              </h3>
              <p className="text-xs text-[#2b213a]/70 leading-relaxed">
                This action is immediate and cannot be undone. All related records will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-[#f9f6f0] hover:bg-gray-200 text-[#2b213a] rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

