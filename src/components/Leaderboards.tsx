import { useMemo, useState } from 'react';
import type { Address } from 'viem';
import type { Workspace } from '../chain';
import type { Contributor } from '../types';
import { formatAmount, short } from '../format';
import { Avatar, Input, IconSearch, IconTrophy } from '../ui';

type Window = 'all' | '30d' | '7d';

// Windowed rows from the event stream (real, honest): tasks paid + earned by
// worker, and reviews by approver, both within the window. Includes reviewer-only
// addresses so the Reviewers table populates in 7d/30d too. All-time uses the
// cumulative Reputation totals (authoritative), so the default view can't drift.
function windowedContributors(ws: Workspace, days: number): Contributor[] {
  const cut = Date.now() / 1000 - days * 86400;
  const acc = new Map<string, { addr: Address; done: bigint; earned: bigint; reviewed: number }>();
  const get = (a: Address) => {
    const key = a.toLowerCase();
    const row = acc.get(key) ?? { addr: a, done: 0n, earned: 0n, reviewed: 0 };
    acc.set(key, row);
    return row;
  };
  for (const a of ws.activity) {
    if (a.ts < cut) continue;
    if (a.kind === 'paid') {
      const r = get(a.actor);
      r.done += 1n;
      r.earned += a.detail ? BigInt(a.detail) : 0n;
    } else if (a.kind === 'accepted') {
      get(a.actor).reviewed += 1;
    }
  }
  return Array.from(acc.values())
    .map((r) => ({
      address: r.addr,
      completed: r.done,
      earned: r.earned,
      karma: ws.contributors.find((c) => c.address.toLowerCase() === r.addr.toLowerCase())?.karma,
      reviewed: r.reviewed,
      points: r.done * 100n,
    }))
    .sort((a, b) => (b.completed === a.completed ? Number(b.earned - a.earned) : Number(b.completed - a.completed)));
}

function WindowToggle({ value, onChange }: { value: Window; onChange: (w: Window) => void }) {
  const opts: [Window, string][] = [
    ['7d', '7d'],
    ['30d', '30d'],
    ['all', 'All time'],
  ];
  return (
    <div className="flex items-center gap-1">
      {opts.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={value === k ? { backgroundColor: 'var(--brand)' } : undefined}
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            value === k ? 'text-white' : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Search({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-neutral-400 ring-1 ring-inset ring-white/8">
      <IconSearch className="h-3.5 w-3.5" />
      <Input variant="unstyled" placeholder={placeholder} className="w-36 bg-transparent text-neutral-200 placeholder:text-neutral-600 focus:outline-none" />
    </label>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-xs font-medium text-neutral-500 ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-neutral-600">
      <IconTrophy className="h-8 w-8 opacity-40" />
      <span className="text-sm">No Data</span>
    </div>
  );
}

// Task Points = global Karma when the org has a Karma deployment; until then a
// transparent proxy (tasks × 100) so the column is never blank. "Task Points = Karma."
function taskPoints(c: Contributor): string {
  return c.karma !== undefined ? formatAmount(c.karma) : c.points.toString();
}

function ContributorTable({ rows }: { rows: Contributor[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="scroll-x">
    <table className="w-full min-w-[460px]">
      <thead>
        <tr className="border-b border-white/6">
          <Th>Rank</Th>
          <Th>Username</Th>
          <Th right>Tasks Done</Th>
          <Th right>Task Points</Th>
          <Th right>Earned</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => (
          <tr key={c.address} className="border-b border-white/4 hover:bg-white/3">
            <td className="px-3 py-2.5 text-sm tabular-nums text-neutral-400">{i + 1}</td>
            <td className="px-3 py-2.5">
              <span className="flex items-center gap-2">
                <Avatar addr={c.address} size={22} />
                <span className="font-mono text-sm text-neutral-200">{short(c.address)}</span>
              </span>
            </td>
            <td className="px-3 py-2.5 text-right text-sm tabular-nums text-neutral-200">{c.completed.toString()}</td>
            <td className="px-3 py-2.5 text-right text-sm tabular-nums text-fuchsia-300" title="Task Points = global Karma (portable across every DAO)">{taskPoints(c)}</td>
            <td className="px-3 py-2.5 text-right text-sm tabular-nums text-emerald-300">{formatAmount(c.earned)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function ReviewerTable({ rows }: { rows: Contributor[] }) {
  const reviewers = rows.filter((r) => r.reviewed > 0).sort((a, b) => b.reviewed - a.reviewed);
  if (reviewers.length === 0) return <Empty />;
  return (
    <div className="scroll-x">
    <table className="w-full min-w-[460px]">
      <thead>
        <tr className="border-b border-white/6">
          <Th>Rank</Th>
          <Th>Username</Th>
          <Th right>Tasks Reviewed</Th>
          <Th right>Task Points</Th>
        </tr>
      </thead>
      <tbody>
        {reviewers.map((c, i) => (
          <tr key={c.address} className="border-b border-white/4 hover:bg-white/3">
            <td className="px-3 py-2.5 text-sm tabular-nums text-neutral-400">{i + 1}</td>
            <td className="px-3 py-2.5">
              <span className="flex items-center gap-2">
                <Avatar addr={c.address} size={22} />
                <span className="font-mono text-sm text-neutral-200">{short(c.address)}</span>
              </span>
            </td>
            <td className="px-3 py-2.5 text-right text-sm tabular-nums text-neutral-200">{c.reviewed}</td>
            <td className="px-3 py-2.5 text-right text-sm tabular-nums text-fuchsia-300" title="Task Points = global Karma">
              {c.karma !== undefined ? formatAmount(c.karma) : c.reviewed * 100}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export function Leaderboards({ ws }: { ws: Workspace }) {
  const [win, setWin] = useState<Window>('all');

  // One windowed base set feeds both tables: Top Contributors filters to people
  // who completed work; Top Reviewers (below) filters to reviewers. Reviewer-only
  // addresses stay in the base so they surface in the Reviewers table.
  const base = useMemo(
    () => (win === 'all' ? ws.contributors : windowedContributors(ws, win === '7d' ? 7 : 30)),
    [ws, win],
  );
  const contributorRows = useMemo(() => base.filter((c) => c.completed > 0n), [base]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-6">
      <h1 className="mb-5 text-2xl font-bold text-neutral-100">Leaderboards</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-xl bg-[var(--surface)] ring-1 ring-inset ring-white/6">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <h2 className="text-sm font-semibold text-neutral-200">Top Contributors</h2>
            <WindowToggle value={win} onChange={setWin} />
            <div className="ml-auto">
              <Search placeholder="Search contributors..." />
            </div>
          </div>
          <ContributorTable rows={contributorRows} />
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl bg-[var(--surface)] ring-1 ring-inset ring-white/6">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <h2 className="text-sm font-semibold text-neutral-200">Top Reviewers</h2>
            <WindowToggle value={win} onChange={setWin} />
            <div className="ml-auto">
              <Search placeholder="Search reviewers..." />
            </div>
          </div>
          <ReviewerTable rows={base} />
        </div>
      </div>

      <div className="mt-6 min-w-0 overflow-hidden rounded-xl bg-[var(--surface)] ring-1 ring-inset ring-white/6">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-200">All Contributors</h2>
          <Search placeholder="Search contributors..." />
        </div>
        {ws.contributors.length === 0 ? (
          <Empty />
        ) : (
          <div className="scroll-x">
          <table className="w-full min-w-[460px]">
            <thead>
              <tr className="border-b border-white/6">
                <Th>Username</Th>
                <Th right>Roles</Th>
              </tr>
            </thead>
            <tbody>
              {ws.contributors.map((c) => (
                <tr key={c.address} className="border-b border-white/4 hover:bg-white/3">
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <Avatar addr={c.address} size={22} />
                      <span className="font-mono text-sm text-neutral-200">{short(c.address)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="inline-flex gap-1">
                      {c.reviewed > 0 && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[11px] text-blue-300 ring-1 ring-inset ring-blue-500/25">Reviewer</span>}
                      <span className="rounded bg-white/6 px-1.5 py-0.5 text-[11px] text-neutral-300 ring-1 ring-inset ring-white/10">Contributor</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
