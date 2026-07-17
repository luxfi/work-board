import { useMemo, useState } from 'react';
import { ADDRESSES, CHAIN_ID, ORG_NAME, OWNER_LABEL, REFRESH_MS } from './config';
import { COLUMNS, State } from './types';
import { short, tokenLabel } from './format';
import { useBounties, type Source } from './useBounties';
import { Column } from './components/Column';

const REFRESH_S = Math.round(REFRESH_MS / 1000);

function SourceBadge({ source }: { source: Source | null }) {
  if (source === null) return null;
  const live = source === 'live';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
      <span className={`font-medium tracking-wide ${live ? 'text-emerald-300' : 'text-amber-300'}`}>
        {live ? 'LIVE' : 'FIXTURE'}
      </span>
    </span>
  );
}

function Header() {
  return (
    <header className="px-5 pt-5 pb-4 border-b border-neutral-800">
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-100">
          {ORG_NAME} <span className="text-neutral-500 font-normal">— Work Board</span>
        </h1>
        <span className="text-xs text-neutral-500">
          chain {CHAIN_ID}
          {' · '}BountyV1{' '}
          <span className="font-mono text-neutral-400" title={ADDRESSES.bounty}>
            {short(ADDRESSES.bounty, 6, 6)}
          </span>
          {' · '}owner{' '}
          <span className="text-neutral-400" title={ADDRESSES.owner}>
            {OWNER_LABEL}
          </span>
        </span>
      </div>
      <p className="mt-1.5 text-xs text-neutral-500 max-w-2xl">
        A permissionless on-chain bounty board. Worker reputation is recorded in{' '}
        <span className="text-emerald-400/90">ReputationV1</span> and travels with the address —
        portable, not platform-locked.
      </p>
    </header>
  );
}

function Banner({ source, error }: { source: Source | null; error: string | null }) {
  if (!error) return null;
  const fixture = source === 'fixture';
  const msg = fixture
    ? 'Live RPC unreachable — showing the dev fixture of bounty #0 so the board stays verifiable.'
    : 'Refresh failed — showing the last good on-chain data.';
  return (
    <div className="mx-5 mt-3 rounded-md bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 px-3 py-2 text-xs text-amber-200">
      <span className="font-medium">{msg}</span>
      <span className="text-amber-200/60 font-mono ml-2 break-all">{error.slice(0, 160)}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-500">
      <span className="h-6 w-6 rounded-full border-2 border-neutral-700 border-t-emerald-400 animate-spin" />
      <span className="text-sm">Reading the work-market…</span>
    </div>
  );
}

const selectClass =
  'bg-neutral-900 ring-1 ring-inset ring-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:ring-neutral-600';

export function App() {
  const { data, loading, error, source, updatedAt } = useBounties();
  const [stateFilter, setStateFilter] = useState<State | 'all'>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');

  const bounties = data ?? [];

  // Distinct tokens present, for the token filter.
  const tokens = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of bounties) seen.set(b.token.toLowerCase(), tokenLabel(b.token));
    return Array.from(seen.entries());
  }, [bounties]);

  const filtered = useMemo(
    () => bounties.filter((b) => tokenFilter === 'all' || b.token.toLowerCase() === tokenFilter),
    [bounties, tokenFilter],
  );

  const columns = COLUMNS.filter((c) => stateFilter === 'all' || c.state === stateFilter);
  const showEmpty = source === 'live' && bounties.length === 0;

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <div className="px-5 py-2 flex items-center gap-3 text-xs border-b border-neutral-900">
        <SourceBadge source={source} />
        <span className="text-neutral-500 tabular-nums">{bounties.length} bounties</span>
        {updatedAt && (
          <span className="text-neutral-600">updated {new Date(updatedAt).toLocaleTimeString()}</span>
        )}
        <span className="text-neutral-600 ml-auto">auto-refresh {REFRESH_S}s</span>
      </div>

      <div className="px-5 py-3 flex items-center gap-4 flex-wrap border-b border-neutral-900">
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          state
          <select
            className={selectClass}
            value={stateFilter === 'all' ? 'all' : String(stateFilter)}
            onChange={(e) => setStateFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as State))}
          >
            <option value="all">all</option>
            {COLUMNS.map((c) => (
              <option key={c.state} value={c.state}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          token
          <select className={selectClass} value={tokenFilter} onChange={(e) => setTokenFilter(e.target.value)}>
            <option value="all">all</option>
            {tokens.map(([addr, label]) => (
              <option key={addr} value={addr}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Banner source={source} error={error} />

      {loading && data === null ? (
        <Spinner />
      ) : showEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-neutral-500">
          <span className="text-2xl">◇</span>
          <span className="text-sm">No bounties on-chain yet.</span>
        </div>
      ) : (
        <main className="flex-1 overflow-x-auto p-5">
          <div className="flex gap-4 min-w-max items-start">
            {columns.map((c) => (
              <Column key={c.state} def={c} bounties={filtered.filter((b) => b.state === c.state)} />
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
