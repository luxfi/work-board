import type { Space } from './brands';
import type { BountyView, Task } from './types';
import { laneOf, openToOf } from './types';
import { parseReward } from './reward';

// Enrich on-chain bounties into Dework Tasks: resolve the Space (bounty category),
// a human title, skills and the reward model. The Space assignment is config-driven
// (Bounty has no on-chain category) — a bounty routes to the first Space whose
// `match` prefix its issueRef starts with, else the catch-all Space.

export function defaultSpaceKey(spaces: Space[]): string {
  const catchAll = spaces.find((s) => !s.match || s.match.length === 0);
  return (catchAll ?? spaces[0])?.key ?? 'general';
}

export function resolveSpaceKey(issueRef: string | undefined, spaces: Space[]): string {
  const ref = (issueRef ?? '').toLowerCase();
  if (ref) {
    for (const s of spaces) {
      if (s.match && s.match.some((p) => ref.startsWith(p.toLowerCase()))) return s.key;
    }
  }
  return defaultSpaceKey(spaces);
}

// A readable title from the issueRef. GitHub refs → "repo #n"; URLs → last path
// segment; a bare slug → itself; nothing → "Task #id".
export function deriveTitle(issueRef: string | undefined, id: number): string {
  const ref = (issueRef ?? '').trim();
  if (!ref) return `Task #${id}`;
  const gh = ref.match(/^([\w.-]+)\/([\w.-]+)#(\d+)$/);
  if (gh) return `${gh[2]} #${gh[3]}`;
  if (/^https?:\/\//i.test(ref)) {
    const tail = ref.replace(/\/+$/, '').split('/').pop();
    return tail || ref;
  }
  return ref.charAt(0).toUpperCase() + ref.slice(1);
}

export function enrichTask(b: BountyView, spaces: Space[]): Task {
  const spaceKey = resolveSpaceKey(b.issueRef, spaces);
  const space = spaces.find((s) => s.key === spaceKey);
  return {
    ...b,
    title: deriveTitle(b.issueRef, b.id),
    spaceKey,
    skills: space?.skills ?? [],
    lane: laneOf(b.state),
    openTo: openToOf(b.state),
    parsedReward: parseReward(b),
  };
}

export function enrichTasks(bounties: BountyView[], spaces: Space[]): Task[] {
  return bounties.map((b) => enrichTask(b, spaces));
}

// Per-space rollups for the Overview category cards: open-task count + distinct
// contributors (workers who have touched a task in that space).
export type SpaceRollup = { open: number; contributors: number; total: number };

export function rollupBySpace(tasks: Task[], spaces: Space[]): Map<string, SpaceRollup> {
  const out = new Map<string, SpaceRollup>();
  for (const s of spaces) out.set(s.key, { open: 0, contributors: 0, total: 0 });
  const workersBySpace = new Map<string, Set<string>>();
  for (const s of spaces) workersBySpace.set(s.key, new Set());
  for (const t of tasks) {
    const r = out.get(t.spaceKey);
    if (!r) continue;
    r.total += 1;
    if (t.lane === 'todo') r.open += 1;
    const w = t.worker.toLowerCase();
    if (w !== '0x0000000000000000000000000000000000000000') workersBySpace.get(t.spaceKey)?.add(w);
  }
  for (const s of spaces) {
    const r = out.get(s.key);
    if (r) r.contributors = workersBySpace.get(s.key)?.size ?? 0;
  }
  return out;
}
