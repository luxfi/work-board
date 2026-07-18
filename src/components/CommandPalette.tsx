import { useEffect, useMemo, useRef, useState } from 'react';
import { ORG } from '../config';
import type { Task } from '../types';
import { navigate, openTask } from '../router';
import { openConnect } from '../auth';
import { Input, IconSearch, IconGrid, IconBoard, IconTrophy, IconBulb, IconPlus, IconDoc, IconExternal } from '../ui';

// ⌘K command palette — global fuzzy search + quick-nav across views, spaces and
// tasks, plus quick actions. Keyboard-navigable (↑/↓/Enter, Esc). Centered on
// desktop, full-screen bottom-sheet on mobile. The rendered order and the
// selection index share ONE ordered list (`results`) so the highlighted row is
// always the row Enter runs — grouped for display, never a second ordering.
const GROUPS = ['Actions', 'Navigate', 'Spaces', 'Tasks'] as const;
type Group = (typeof GROUPS)[number];
type Cmd = { id: string; label: string; hint?: string; group: Group; icon: React.ReactNode; run: () => void };

// Subsequence fuzzy score: all query chars in order (case-insensitive). Lower is
// better; -1 means no match. A prefix hit scores best, then a substring, then a
// gapped subsequence.
function score(label: string, q: string): number {
  const s = label.toLowerCase();
  const query = q.toLowerCase();
  if (s.startsWith(query)) return 0;
  const idx = s.indexOf(query);
  if (idx >= 0) return 1 + idx / 100;
  let i = 0;
  let gaps = 0;
  for (const c of s) {
    if (i < query.length && c === query[i]) i++;
    else if (i > 0 && i < query.length) gaps++;
  }
  return i === query.length ? 3 + gaps / 100 : -1;
}

export function CommandPalette({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const nav = (path: string) => () => {
      navigate(path);
      onClose();
    };
    const base: Cmd[] = [
      { id: 'new', label: 'New Suggestion', group: 'Actions', icon: <IconPlus className="h-4 w-4" />, run: nav('/suggestions?new=1') },
      { id: 'connect', label: `Connect to ${ORG.workspace}`, group: 'Actions', icon: <IconExternal className="h-4 w-4" />, run: () => { openConnect(); onClose(); } },
      { id: 'overview', label: 'Overview', group: 'Navigate', icon: <IconGrid className="h-4 w-4" />, run: nav('/') },
      { id: 'board', label: 'Combined Board', group: 'Navigate', icon: <IconBoard className="h-4 w-4" />, run: nav('/board') },
      { id: 'leaderboards', label: 'Leaderboards', group: 'Navigate', icon: <IconTrophy className="h-4 w-4" />, run: nav('/leaderboards') },
      { id: 'suggestions', label: 'Community Suggestions', group: 'Navigate', icon: <IconBulb className="h-4 w-4" />, run: nav('/suggestions') },
      { id: 'explore', label: 'Explore bounties', group: 'Navigate', icon: <IconSearch className="h-4 w-4" />, run: nav('/explore') },
    ];
    const spaceCmds: Cmd[] = ORG.spaces.map((s) => ({
      id: `space-${s.key}`,
      label: s.name,
      hint: 'Space',
      group: 'Spaces',
      icon: <span className="text-[15px] leading-none">{s.emoji}</span>,
      run: nav(`/space/${s.key}/board`),
    }));
    const taskCmds: Cmd[] = tasks.map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: `#${t.id}`,
      group: 'Tasks',
      icon: <IconDoc className="h-4 w-4 text-sky-400" />,
      run: () => {
        openTask(t.id);
        onClose();
      },
    }));
    return [...base, ...spaceCmds, ...taskCmds];
  }, [tasks, onClose]);

  // The single source of truth: matches, ordered by group (for display) then by
  // score (best first within a group). Highlight, Enter and hover all index this.
  const results = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, s: q ? score(c.label, q) : 0 }))
      .filter((x) => x.s >= 0);
    scored.sort((a, b) => {
      const g = GROUPS.indexOf(a.c.group) - GROUPS.indexOf(b.c.group);
      return g !== 0 ? g : a.s - b.s;
    });
    return scored.map((x) => x.c);
  }, [commands, q]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); results[sel]?.run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, sel, onClose]);

  useEffect(() => {
    listRef.current?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-start sm:px-4 sm:pt-24" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-[var(--surface)] shadow-2xl ring-1 ring-inset ring-white/10 sm:max-h-[70vh] sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <IconSearch className="h-4 w-4 text-neutral-500" />
          <Input
            variant="unstyled"
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search bounties, spaces, actions…"
            className="w-full bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
          />
          <kbd className="hidden rounded bg-white/6 px-1.5 py-0.5 text-[10px] text-neutral-500 sm:inline">esc</kbd>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {results.length === 0 && <div className="px-4 py-8 text-center text-sm text-neutral-600">No matches</div>}
          {GROUPS.map((g) => {
            const items = results.filter((c) => c.group === g);
            if (items.length === 0) return null;
            return (
              <div key={g} className="mb-1">
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">{g}</div>
                {items.map((c) => {
                  const i = results.indexOf(c);
                  const active = i === sel;
                  return (
                    <button
                      key={c.id}
                      data-sel={active}
                      onMouseMove={() => setSel(i)}
                      onClick={() => c.run()}
                      className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm ${active ? 'bg-white/8 text-neutral-100' : 'text-neutral-300'}`}
                    >
                      <span className={active ? 'text-neutral-200' : 'text-neutral-500'}>{c.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                      {c.hint && <span className="shrink-0 text-xs text-neutral-600">{c.hint}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
