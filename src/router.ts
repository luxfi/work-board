import { useEffect, useState } from 'react';

// A tiny hash router — no dependency. The board is a static SPA served with an
// index fallback, so hash routing is the one obvious way: it needs no server
// rewrites and is CSP-safe. Task detail opens as a modal via a `?task=<id>` query
// on any route, so the underlying view stays put (matches Dework).

export type View = 'overview' | 'board' | 'leaderboards' | 'suggestions' | 'explore' | 'space';
export type Tab = 'overview' | 'board' | 'tasks' | 'suggestions';

export type Route = {
  view: View;
  spaceKey?: string;
  tab: Tab;
  taskId?: number; // modal overlay, orthogonal to `view`
};

function parse(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, queryStr] = raw.split('?');
  const seg = path.split('/').filter(Boolean);
  const query = new URLSearchParams(queryStr ?? '');
  const taskRaw = query.get('task');
  const taskId = taskRaw !== null && /^\d+$/.test(taskRaw) ? Number(taskRaw) : undefined;

  if (seg[0] === 'space' && seg[1]) {
    const tab = (['overview', 'board', 'tasks', 'suggestions'] as const).find((t) => t === seg[2]) ?? 'board';
    return { view: 'space', spaceKey: seg[1], tab, taskId };
  }
  const top = seg[0] as View | undefined;
  if (top === 'board') return { view: 'board', tab: 'board', taskId };
  if (top === 'leaderboards') return { view: 'leaderboards', tab: 'overview', taskId };
  if (top === 'suggestions') return { view: 'suggestions', tab: 'suggestions', taskId };
  if (top === 'explore') return { view: 'explore', tab: 'overview', taskId };
  return { view: 'overview', tab: 'overview', taskId };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parse(typeof window === 'undefined' ? '' : window.location.hash),
  );
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

// Navigate by setting the hash. `to` is the path without the leading '#'.
export function navigate(to: string): void {
  const next = to.startsWith('#') ? to : `#${to.startsWith('/') ? '' : '/'}${to}`;
  if (window.location.hash !== next) window.location.hash = next;
}

// Open / close the task-detail modal while preserving the current view.
export function openTask(id: number): void {
  const base = window.location.hash.replace(/^#/, '').split('?')[0] || '/';
  navigate(`${base}?task=${id}`);
}

export function closeTask(): void {
  const base = window.location.hash.replace(/^#/, '').split('?')[0] || '/';
  navigate(base);
}
