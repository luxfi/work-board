import { useState } from 'react';
import { ORG } from '../config';
import { BRANDS } from '../brands';
import type { Task } from '../types';
import { SKILLS, skillMeta } from '../skills';
import { TaskCard } from './Board';
import { IconExternal } from '../ui';

// The global explorer. A single-brand build can only read its own chain (CSP), so
// this indexes THIS org's bounties across every Space (skill-filterable) and links
// out to each sibling DAO board — the honest cross-org index until a multi-chain
// aggregator API lands, at which point the grid federates without a UI change.
export function Explore({ tasks }: { tasks: Task[] }) {
  const [active, setActive] = useState<string[]>([]);
  const toggle = (s: string) => setActive((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]));
  const shown = active.length ? tasks.filter((t) => t.skills.some((s) => active.includes(s))) : tasks;

  const others = (Object.keys(BRANDS) as (keyof typeof BRANDS)[]).filter((k) => BRANDS[k].workspace !== ORG.workspace);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <h1 className="text-2xl font-bold text-neutral-50">Explore bounties</h1>
      <p className="mt-1 text-sm text-neutral-400">Browse open work across every Space in {ORG.workspace}, and jump to sibling DAOs.</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {SKILLS.map((s) => {
          const on = active.includes(s);
          const m = skillMeta(s);
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset transition-colors ${
                on ? m.cls : 'text-neutral-400 ring-white/10 hover:bg-white/5'
              }`}
            >
              <span>{m.emoji}</span> {s}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-neutral-500">No bounties match these skills.</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-lg font-semibold text-neutral-100">Other DAOs</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((k) => {
          const b = BRANDS[k];
          return (
            <a
              key={k}
              href={`https://work.${k}.network`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 rounded-xl bg-[#1a1a1e] p-4 ring-1 ring-inset ring-white/6 hover:bg-[#202025]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: b.accent }}>
                {b.workspace.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-neutral-100">{b.workspace}</div>
                <div className="truncate text-xs text-neutral-500">{b.tagline}</div>
              </div>
              <IconExternal className="h-4 w-4 text-neutral-500" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
