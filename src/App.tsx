import { useEffect, useMemo, useState } from 'react';
import { ORG, CHAIN_ID } from './config';
import { useWorkspace } from './useWorkspace';
import type { Source } from './useWorkspace';
import { useRoute } from './router';
import { Sidebar } from './components/Sidebar';
import { Topbar, Toolbar } from './components/chrome';
import { Overview } from './components/Overview';
import { SpaceView } from './components/Space';
import { Board } from './components/Board';
import { Leaderboards } from './components/Leaderboards';
import { Suggestions } from './components/Suggestions';
import { Explore } from './components/Explore';
import { TaskDetail } from './components/TaskDetail';
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
    <div className="px-8 py-6">
      <div className="mb-5 flex items-center justify-between pr-32">
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

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto bg-[#0f0f11]">
        <Topbar />
        {loading && ws === null ? <Spinner /> : ws ? <Routed ws={ws} tasks={tasks} /> : null}
      </main>
      {modalTask && ws && <TaskDetail task={modalTask} ws={ws} />}
      <StatusPill source={source} updatedAt={updatedAt} error={error} />
    </div>
  );
}
