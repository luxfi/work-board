import { State } from './types';

// Per-state accent classes. Written out as literal strings so Tailwind's
// content scanner can see (and emit) every one — never build these dynamically.
type Accent = { dot: string; badge: string };

export const ACCENT: Record<State, Accent> = {
  [State.None]: {
    dot: 'bg-neutral-500',
    badge: 'bg-neutral-500/10 text-neutral-400 ring-1 ring-inset ring-neutral-500/30',
  },
  [State.Open]: {
    dot: 'bg-sky-400',
    badge: 'bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/30',
  },
  [State.Funded]: {
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-500/30',
  },
  [State.Claimed]: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30',
  },
  [State.Submitted]: {
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/30',
  },
  [State.Accepted]: {
    dot: 'bg-teal-400',
    badge: 'bg-teal-500/10 text-teal-300 ring-1 ring-inset ring-teal-500/30',
  },
  [State.Paid]: {
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
  },
  [State.Disputed]: {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30',
  },
  [State.Cancelled]: {
    dot: 'bg-neutral-500',
    badge: 'bg-neutral-500/10 text-neutral-400 ring-1 ring-inset ring-neutral-500/30',
  },
};
