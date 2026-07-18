import { useEffect, useState } from 'react';
import { REFRESH_MS, ORG } from './config';
import { loadWorkspace } from './chain';
import type { Workspace } from './chain';
import { FIXTURE } from './fixture';
import { enrichTasks } from './tasks';
import { isZero } from './format';
import { State } from './types';
import type { Contributor, Task } from './types';

export type Source = 'live' | 'fixture';

export type WorkspaceState = {
  ws: Workspace | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  source: Source | null;
  updatedAt: number | null;
};

// Build a workspace from bounty structs alone (no event stream) — the offline
// fixture path. Stats that need block timestamps (time-to-payment, activity) are
// left empty rather than faked.
function workspaceFromBounties(bounties: typeof FIXTURE): Workspace {
  let totalPaidWei = 0n;
  let paidCount = 0;
  const people = new Set<string>();
  const workers: Contributor[] = [];
  const seen = new Set<string>();
  for (const b of bounties) {
    if (b.state === State.Paid) {
      totalPaidWei += b.reward;
      paidCount += 1;
    }
    for (const a of [b.worker, b.funder, b.approver]) if (!isZero(a)) people.add(a.toLowerCase());
    if (!isZero(b.worker) && !seen.has(b.worker.toLowerCase())) {
      seen.add(b.worker.toLowerCase());
      workers.push({
        address: b.worker,
        completed: b.reputation.completed,
        earned: b.reputation.earned,
        karma: b.reputation.karma,
        reviewed: 0,
        points: b.reputation.completed * 100n,
      });
    }
  }
  return {
    bounties,
    activity: [],
    stats: { totalPaidWei, paidCount, avgTimeToPaymentSec: 0, contributorCount: people.size },
    contributors: workers,
  };
}

// Polls the whole work-market every REFRESH_MS. On failure keep the last good live
// data (stale) if we had it, otherwise fall back to the fixture so the UI renders.
export function useWorkspace(): WorkspaceState {
  const [state, setState] = useState<WorkspaceState>({
    ws: null,
    tasks: [],
    loading: true,
    error: null,
    source: null,
    updatedAt: null,
  });

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const ws = await loadWorkspace();
        if (!alive) return;
        setState({
          ws,
          tasks: enrichTasks(ws.bounties, ORG.spaces),
          loading: false,
          error: null,
          source: 'live',
          updatedAt: Date.now(),
        });
      } catch (err) {
        if (!alive) return;
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) =>
          prev.source === 'live' && prev.ws
            ? { ...prev, loading: false, error: message }
            : {
                ws: workspaceFromBounties(FIXTURE),
                tasks: enrichTasks(FIXTURE, ORG.spaces),
                loading: false,
                error: message,
                source: 'fixture',
                updatedAt: Date.now(),
              },
        );
      }
    }

    void tick();
    const timer = setInterval(() => void tick(), REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return state;
}
