import { useEffect, useMemo, useState } from 'react';
import { ORG, CHAIN_ID } from './config';
import { useWorkspace } from './useWorkspace';
import type { Source } from './useWorkspace';
import { useRoute } from './router';
import { IconRail, Sidebar } from './components/Sidebar';
import { Topbar, Toolbar } from './components/chrome';
import { Overview } from './components/Overview';
import { SpaceView } from './components/Space';
import { Board } from './components/Board';
import { Leaderboards } from './components/Leaderboards';
import { Suggestions } from './components/Suggestions';
import { Explore } from './components/Explore';
import { TaskDetail } from './components/TaskDetail';
import { CommandPalette } from './components/CommandPalette';
import { ConnectButton, ConnectSheetHost } from './components/Connect';
import { IconMenu, IconSearch } from './ui';
import type { Task } from './types';
import type { Workspace } from './chain';

function StatusPill({ source, updatedAt, error }: { source: Source | null; updatedAt: number | null; error: string | null }) {
  if (source === null) return null;
  const live = source === 'live';
  return (
    <div className="fixed bottom-3 left-3 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-neutral-400 ring-1 ring-inset ring-white/10 backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'}`} />
      <span className={live ? 'text-emerald-300' : 'text-amber-300'}>{live ? 'LIVE' : 'FIXTURE'}</span>
      <span className="text-neutral-600">· chain {CHAIN_ID}</span>
      {updatedAt && <span className="text-neutral-600">· {new Date(updatedAt).toLocaleTimeString()}</span>}
      {error && !live && <span className="max-w-[16rem] truncate text-amber-400/70" title={error}>· {error.slice(0, 40)}</span>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700" style={{ borderTopColor: 'var(--brand)' }} />
      <span className="text-sm">Reading the work-market…</span>
    </div>
  );
}

function CombinedBoard({ tasks }: { tasks: Task[] }) {
  const [query, setQuery] = useState('');
  const shown = query ? tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())) : tasks;
  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:pr-32">
        <h1 className="text-2xl font-bold text-neutral-50">Combined Board</h1>
        <Toolbar query={query} onQuery={setQuery} />
      </div>
      <Board tasks={shown} />
    </div>
  );
}

function Routed({ ws, tasks }: { ws: Workspace; tasks: Task[] }) {
  const route = useRoute();
  switch (route.view) {
    case 'overview':
      return <Overview ws={ws} tasks={tasks} />;
    case 'board':
      return <CombinedBoard tasks={tasks} />;
    case 'leaderboards':
      return <Leaderboards ws={ws} />;
    case 'suggestions':
      return <Suggestions />;
    case 'explore':
      return <Explore tasks={tasks} />;
    case 'space':
      return <SpaceView tasks={tasks} spaceKey={route.spaceKey!} tab={route.tab} />;
    default:
      return <Overview ws={ws} tasks={tasks} />;
  }
}

export function App() {
  const { ws, tasks, loading, error, source, updatedAt } = useWorkspace();
  const route = useRoute();

  // Inject the per-brand accent once; every accented element reads var(--brand).
  useEffect(() => {
    document.documentElement.style.setProperty('--brand', ORG.accent);
  }, []);

  const modalTask = useMemo(
    () => (route.taskId !== undefined ? tasks.find((t) => t.id === route.taskId) ?? null : null),
    [route.taskId, tasks],
  );

  // Mobile: the sidebar is an off-canvas drawer. Close it on any route change.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [route.view, route.spaceKey, route.tab]);

  // ⌘K / Ctrl-K toggles the command palette from anywhere; it also closes on nav.
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setPaletteOpen(false), [route.view, route.spaceKey, route.tab, route.taskId]);

  return (
    <div className="flex h-full">
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMenuOpen(false)} />}
      {/* nav = 64px icon rail + 256px sidebar; static on desktop, off-canvas drawer on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <IconRail onNavigate={() => setMenuOpen(false)} />
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </div>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)]">
        {/* mobile top bar (hamburger + workspace + Connect) */}
        <div
          className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--rail)]/95 px-3 py-2 backdrop-blur md:hidden"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
        >
          <button onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/5" aria-label="Open menu">
            <IconMenu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 font-semibold text-neutral-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              {ORG.workspace.charAt(0)}
            </span>
            {ORG.workspace}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setPaletteOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/5" aria-label="Search">
              <IconSearch className="h-5 w-5" />
            </button>
            <ConnectButton />
          </div>
        </div>

        {/* desktop Connect / Follow */}
        <div className="hidden md:block">
          <Topbar onSearch={() => setPaletteOpen(true)} />
        </div>

        <div className="flex flex-1 flex-col">
          {loading && ws === null ? <Spinner /> : ws ? <Routed ws={ws} tasks={tasks} /> : null}
        </div>
      </main>

      {modalTask && ws && <TaskDetail task={modalTask} ws={ws} />}
      {paletteOpen && <CommandPalette tasks={tasks} onClose={() => setPaletteOpen(false)} />}
      <ConnectSheetHost />
      <StatusPill source={source} updatedAt={updatedAt} error={error} />
    </div>
  );
}
