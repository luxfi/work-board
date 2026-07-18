import { useEffect, useState } from 'react';
import { ORG } from '../config';
import { PrimaryButton, IconPlus, IconChevronDown, IconBulb, IconX } from '../ui';
import { timeAgo } from '../format';

// Community Suggestions — governance ideation. Persisted client-side (localStorage,
// keyed per brand) so it is genuinely functional today and survives reloads; the
// same shape swaps to an IAM-backed or on-chain store later without a UI change.
type Suggestion = { id: string; title: string; body: string; votes: number; ts: number; voted: boolean };

const KEY = `work-suggestions:${ORG.workspace}`;

function load(): Suggestion[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Suggestion[]) : [];
  } catch {
    return [];
  }
}

function save(list: Suggestion[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — in-memory only for this session */
  }
}

function NewSuggestionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, body: string) => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-28" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-[#1c1c20] p-5 shadow-2xl ring-1 ring-inset ring-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your suggestion here"
            className="w-full bg-transparent text-lg font-semibold text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
          <button onClick={onClose} className="ml-3 rounded p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-300">
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='Add more details about your suggestion here. Type "/" to insert.'
          rows={4}
          className="mt-3 w-full resize-none bg-transparent text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
        />
        <div className="mt-4">
          <PrimaryButton
            className="w-full py-2.5"
            onClick={() => {
              if (title.trim()) onCreate(title.trim(), body.trim());
            }}
          >
            Create
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function Suggestions() {
  const [list, setList] = useState<Suggestion[]>(() => load());
  const [modal, setModal] = useState(false);

  // Sidebar "New Suggestion" links to /suggestions?new=1 — open the modal on mount.
  useEffect(() => {
    if (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('new') === '1') setModal(true);
  }, []);

  useEffect(() => save(list), [list]);

  const create = (title: string, body: string) => {
    setList((l) => [{ id: crypto.randomUUID(), title, body, votes: 1, ts: Date.now() / 1000, voted: true }, ...l]);
    setModal(false);
  };
  const toggleVote = (id: string) =>
    setList((l) => l.map((s) => (s.id === id ? { ...s, voted: !s.voted, votes: s.votes + (s.voted ? -1 : 1) } : s)));

  const trending = [...list].sort((a, b) => b.votes - a.votes);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <button className="flex items-center gap-1.5 text-lg font-semibold text-neutral-100">
          Trending <IconChevronDown className="h-4 w-4 text-neutral-500" />
        </button>
        <PrimaryButton onClick={() => setModal(true)}>
          <IconPlus className="h-4 w-4" /> Add a suggestion
        </PrimaryButton>
      </div>

      {trending.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-neutral-500">
          <IconBulb className="h-8 w-8 opacity-40" />
          <p className="text-sm">No suggestions yet — be the first to propose one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {trending.map((s) => (
            <div key={s.id} className="flex items-start gap-3 rounded-lg bg-[#1a1a1e] p-3 ring-1 ring-inset ring-white/6">
              <button
                onClick={() => toggleVote(s.id)}
                className={`flex w-12 shrink-0 flex-col items-center rounded-md py-1.5 ring-1 ring-inset transition-colors ${
                  s.voted ? 'bg-white/8 ring-white/15 text-neutral-100' : 'ring-white/8 text-neutral-400 hover:bg-white/5'
                }`}
                style={s.voted ? { color: 'var(--brand)' } : undefined}
              >
                <span className="text-xs">▲</span>
                <span className="text-sm font-semibold tabular-nums">{s.votes}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-100">{s.title}</div>
                {s.body && <div className="mt-0.5 text-sm text-neutral-400">{s.body}</div>}
                <div className="mt-1 text-xs text-neutral-600">{timeAgo(s.ts)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <NewSuggestionModal onClose={() => setModal(false)} onCreate={create} />}
    </div>
  );
}
