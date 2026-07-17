import { useEffect, useState } from 'react';
import { REFRESH_MS } from './config';
import { loadBoard } from './chain';
import { FIXTURE } from './fixture';
import type { BountyView } from './types';

export type Source = 'live' | 'fixture';

export type BoardState = {
  data: BountyView[] | null;
  loading: boolean;
  error: string | null;
  source: Source | null;
  updatedAt: number | null;
};

// Polls the live board every REFRESH_MS. On failure: keep the last good live
// data if we had it (stale), otherwise fall back to the fixture so the UI renders.
export function useBounties(): BoardState {
  const [state, setState] = useState<BoardState>({
    data: null,
    loading: true,
    error: null,
    source: null,
    updatedAt: null,
  });

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const data = await loadBoard();
        if (!alive) return;
        setState({ data, loading: false, error: null, source: 'live', updatedAt: Date.now() });
      } catch (err) {
        if (!alive) return;
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) =>
          prev.source === 'live' && prev.data
            ? { ...prev, loading: false, error: message }
            : { data: FIXTURE, loading: false, error: message, source: 'fixture', updatedAt: Date.now() },
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
