import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Plus, Tag } from 'lucide-react';
import clsx from 'clsx';

const MOOD_OPTIONS = [
  { score: 1, emoji: '🌧️', label: 'Very Low' },
  { score: 2, emoji: '🌥️', label: 'Low' },
  { score: 3, emoji: '☁️',  label: 'Okay' },
  { score: 4, emoji: '🌤️', label: 'Good' },
  { score: 5, emoji: '☀️',  label: 'Great' },
];

interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  moodScore?: number;
  tags?: string[];
  createdAt: string;
  reflection?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getMoodEmoji(score?: number): string {
  return MOOD_OPTIONS.find((m) => m.score === score)?.emoji ?? '';
}

// Loading skeleton card
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#f9f6f0]/50 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-3 bg-[#2b213a]/10 rounded w-24" />
        <div className="h-3 bg-[#2b213a]/10 rounded w-6" />
      </div>
      <div className="h-4 bg-[#2b213a]/10 rounded mb-3 w-3/4" />
      <div className="h-3 bg-[#2b213a]/10 rounded mb-2" />
      <div className="h-3 bg-[#2b213a]/10 rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#2b213a]/10 rounded w-1/2" />
    </div>
  );
}

// Entry card (list view)
function EntryCard({
  entry,
  onClick,
}: {
  entry: JournalEntry;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl p-8 shadow-sm border border-[#f9f6f0]/50 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
    >
      <div className="flex justify-between items-start">
        <span className="text-xs text-[#2b213a]/40">{formatDate(entry.createdAt)}</span>
        <span className="text-xl" title={MOOD_OPTIONS.find((m) => m.score === entry.moodScore)?.label}>
          {getMoodEmoji(entry.moodScore)}
        </span>
      </div>
      {entry.title && (
        <h3 className="font-medium text-[#2b213a] line-clamp-1">{entry.title}</h3>
      )}
      <p className="text-[#2b213a]/70 text-sm leading-relaxed line-clamp-3">{entry.content}</p>
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[#e2d4f0]/50 text-[#4a3b69] px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// View/edit panel
function EntryPanel({
  entry,
  onClose,
  onDelete,
}: {
  entry: JournalEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/journal/${entry.id}`, { method: 'DELETE' });
      onDelete(entry.id);
    } catch {
      setDeleteError('Could not delete this entry. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-2xl bg-[#f9f6f0] h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-8 border-b border-[#2b213a]/5">
          <div>
            <p className="text-xs text-[#2b213a]/40">{formatDate(entry.createdAt)}</p>
            {entry.title && <h2 className="text-xl font-medium mt-1">{entry.title}</h2>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2b213a]/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-8 space-y-6">
          {entry.moodScore && (
            <div className="flex items-center gap-2 text-sm text-[#2b213a]/60">
              <span className="text-2xl">{getMoodEmoji(entry.moodScore)}</span>
              <span>Feeling {MOOD_OPTIONS.find((m) => m.score === entry.moodScore)?.label}</span>
            </div>
          )}
          <p className="text-[#2b213a]/80 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-xs bg-[#e2d4f0]/70 text-[#4a3b69] px-3 py-1.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {entry.reflection && (
            <div className="bg-white rounded-2xl p-6 border border-[#a8d5ba]/30">
              <p className="text-xs text-[#4a3b69]/60 uppercase tracking-widest mb-3">HAVEN Reflection</p>
              <p className="text-[#2b213a]/80 italic text-sm leading-relaxed">{entry.reflection}</p>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-[#2b213a]/5">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
            >
              Delete this entry
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
              <p className="text-red-700 text-sm font-medium">
                This entry will be permanently deleted. Are you sure?
              </p>
              {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="bg-white text-[#2b213a] px-4 py-2 rounded-xl text-sm border border-[#2b213a]/10 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// New entry panel
function NewEntryPanel({
  onClose,
  onSave,
  prefillContent,
}: {
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  prefillContent?: string;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(prefillContent ?? '');
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          content,
          moodScore: moodScore || undefined,
          tags,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const savedEntry: JournalEntry = await res.json();

      // Fetch reflection
      setReflectionLoading(true);
      try {
        const refRes = await fetch(
          `/api/journal/${savedEntry.id}/reflect`,
          { method: 'POST' }
        );
        if (refRes.ok) {
          const refData = await refRes.json();
          const reflectionText =
            refData.reflection ?? refData.content ?? refData.message ?? null;
          setReflection(reflectionText);
          savedEntry.reflection = reflectionText ?? undefined;
        }
      } catch {
        // Reflection is optional
      } finally {
        setReflectionLoading(false);
      }

      onSave(savedEntry);
    } catch {
      setSaveError('Could not save your entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={reflection ? undefined : onClose} />
      <div className="w-full max-w-2xl bg-[#f9f6f0] h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-8 border-b border-[#2b213a]/5">
          <h2 className="text-xl font-medium text-[#2b213a]">New Entry</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2b213a]/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-8 space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-white border border-[#2b213a]/10 rounded-2xl px-5 py-3 text-[#2b213a] placeholder:text-[#2b213a]/30 outline-none focus:ring-2 focus:ring-[#4a3b69]/20 text-lg font-medium"
          />

          {/* Content */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is on your mind? Write freely — this space is just for you."
            rows={10}
            className="w-full bg-white border border-[#2b213a]/10 rounded-2xl px-5 py-4 text-[#2b213a] placeholder:text-[#2b213a]/30 outline-none focus:ring-2 focus:ring-[#4a3b69]/20 resize-none leading-relaxed"
          />

          {/* Mood selector */}
          <div>
            <p className="text-sm font-medium text-[#2b213a]/60 mb-3">How are you feeling?</p>
            <div className="flex gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.score}
                  onClick={() => setMoodScore(moodScore === mood.score ? null : mood.score)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all',
                    moodScore === mood.score
                      ? 'bg-[#4a3b69] text-white scale-105'
                      : 'bg-white border border-[#2b213a]/10 hover:border-[#4a3b69]/30'
                  )}
                  title={mood.label}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-[10px] font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags input */}
          <div>
            <p className="text-sm font-medium text-[#2b213a]/60 mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-xs bg-[#e2d4f0]/70 text-[#4a3b69] px-3 py-1.5 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag, press Enter"
                className="flex-1 bg-white border border-[#2b213a]/10 rounded-xl px-4 py-2 text-sm text-[#2b213a] placeholder:text-[#2b213a]/30 outline-none focus:ring-2 focus:ring-[#4a3b69]/20"
              />
              <button
                onClick={addTag}
                className="bg-[#4a3b69] text-white p-2 rounded-xl hover:bg-[#392d52] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {saveError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {saveError}
            </p>
          )}

          {/* HAVEN reflection */}
          {reflectionLoading && (
            <div className="bg-white rounded-2xl p-6 border border-[#a8d5ba]/30 animate-pulse">
              <p className="text-xs text-[#4a3b69]/60 uppercase tracking-widest mb-3">Generating HAVEN reflection...</p>
              <div className="h-3 bg-[#2b213a]/10 rounded mb-2" />
              <div className="h-3 bg-[#2b213a]/10 rounded w-2/3" />
            </div>
          )}
          {reflection && !reflectionLoading && (
            <div className="bg-white rounded-2xl p-6 border border-[#a8d5ba]/30">
              <p className="text-xs text-[#4a3b69]/60 uppercase tracking-widest mb-3">HAVEN Reflection</p>
              <p className="text-[#2b213a]/80 italic text-sm leading-relaxed">{reflection}</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-[#2b213a]/5 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-1 bg-[#4a3b69] text-white py-3 rounded-2xl font-medium hover:bg-[#392d52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-[#2b213a]/10 text-[#2b213a]/70 hover:bg-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function Journal() {
  const [searchParams] = useSearchParams();
  const promptParam = searchParams.get('prompt') ?? undefined;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(!!promptParam);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/journal');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const arr: JournalEntry[] = Array.isArray(data) ? data : data.entries ?? [];
      setEntries(arr);
    } catch {
      setFetchError('Could not load your journal entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSave = (entry: JournalEntry) => {
    setEntries((prev) => [entry, ...prev]);
    setShowNewEntry(false);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedEntry(null);
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-medium text-[#2b213a] tracking-tight">Journal</h2>
          <p className="text-[#2b213a]/60 mt-1">Your private space to reflect and write.</p>
        </div>
        <button
          onClick={() => setShowNewEntry(true)}
          className="bg-[#4a3b69] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#392d52] transition-colors shadow-sm"
        >
          + New Entry
        </button>
      </header>

      {/* Error state */}
      {fetchError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center justify-between">
          <p className="text-red-600 text-sm">{fetchError}</p>
          <button
            onClick={fetchEntries}
            className="text-sm font-medium text-red-700 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#e2d4f0]/50 flex items-center justify-center mb-6 text-4xl">
            📖
          </div>
          <h3 className="text-xl font-medium text-[#2b213a] mb-2">
            Your journal is waiting for you
          </h3>
          <p className="text-[#2b213a]/50 mb-8 max-w-sm">
            Writing about your experiences can help you understand your feelings and track your growth.
          </p>
          <button
            onClick={() => setShowNewEntry(true)}
            className="bg-[#4a3b69] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#392d52] transition-colors"
          >
            Write your first entry
          </button>
        </div>
      )}

      {/* Entry grid */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      )}

      {/* New entry panel */}
      {showNewEntry && (
        <NewEntryPanel
          onClose={() => setShowNewEntry(false)}
          onSave={handleSave}
          prefillContent={promptParam ? `Prompt: "${promptParam}"\n\n` : undefined}
        />
      )}

      {/* View entry panel */}
      {selectedEntry && (
        <EntryPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

