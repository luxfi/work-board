import type { BountyView, ColumnDef } from '../types';
import { ACCENT } from '../theme';
import { BountyCard } from './BountyCard';

export function Column({ def, bounties }: { def: ColumnDef; bounties: BountyView[] }) {
  const accent = ACCENT[def.state];
  return (
    <section className="w-80 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
        <h2 className="text-sm font-medium text-neutral-200">{def.title}</h2>
        <span className="ml-auto text-xs text-neutral-500 tabular-nums">{bounties.length}</span>
      </div>
      <div className="flex flex-col gap-3 rounded-lg bg-neutral-900/30 ring-1 ring-inset ring-neutral-800/70 p-2 min-h-24">
        {bounties.length === 0 ? (
          <div className="text-xs text-neutral-600 px-2 py-6 text-center select-none">—</div>
        ) : (
          bounties.map((b) => <BountyCard key={b.id} b={b} />)
        )}
      </div>
    </section>
  );
}
