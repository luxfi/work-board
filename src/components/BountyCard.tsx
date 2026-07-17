import type { BountyView } from '../types';
import { STATE_TITLE } from '../types';
import { ACCENT } from '../theme';
import { formatAmount, isZero, refToLink, relTime, short, tokenLabel } from '../format';

function AddrRow({ label, addr }: { label: string; addr: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-neutral-500">{label}</span>
      <span className="font-mono text-neutral-300" title={addr}>
        {short(addr)}
      </span>
    </div>
  );
}

function RefRow({ label, value }: { label: string; value: string }) {
  const { href, text } = refToLink(value);
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-neutral-500 shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="truncate text-sky-400 hover:text-sky-300 underline decoration-dotted underline-offset-2"
        >
          {text}
        </a>
      ) : (
        <span className="truncate text-neutral-300">{text}</span>
      )}
    </div>
  );
}

export function BountyCard({ b }: { b: BountyView }) {
  const accent = ACCENT[b.state as keyof typeof ACCENT];
  const claimed = !isZero(b.worker);
  const hasDeadline = b.claimDeadline > 0n || b.reviewDeadline > 0n;

  return (
    <article className="rounded-lg bg-neutral-900 ring-1 ring-inset ring-neutral-800 hover:ring-neutral-700 transition-colors p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-neutral-400">#{b.id}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${accent.badge}`}>{STATE_TITLE[b.state as keyof typeof STATE_TITLE]}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-neutral-100 tabular-nums">{formatAmount(b.reward)}</span>
        <span className="text-xs text-neutral-500">{tokenLabel(b.token)}</span>
        <span className="ml-auto text-xs text-neutral-500 tabular-nums">stake {formatAmount(b.stake)}</span>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <AddrRow label="funder" addr={b.funder} />
        <AddrRow label="approver" addr={b.approver} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500">worker</span>
          {claimed ? (
            <span className="font-mono text-neutral-300" title={b.worker}>
              {short(b.worker)}
            </span>
          ) : (
            <span className="text-neutral-600 italic">unclaimed</span>
          )}
        </div>
      </div>

      {claimed && (
        <div
          className="rounded-md bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30 px-2.5 py-1.5"
          title="Portable on-chain reputation (ReputationV1) — travels with the worker's address, not the platform"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-500/80 font-semibold">
              on-chain rep
            </span>
            <span className="ml-auto text-xs text-emerald-200 tabular-nums">
              {b.reputation.completed.toString()} completed · {formatAmount(b.reputation.earned)} earned
            </span>
          </div>
        </div>
      )}

      {(b.issueRef || b.deliverableRef) && (
        <div className="flex flex-col gap-1 text-xs">
          {b.issueRef && <RefRow label="issue" value={b.issueRef} />}
          {b.deliverableRef && <RefRow label="PR" value={b.deliverableRef} />}
        </div>
      )}

      {hasDeadline && (
        <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1.5 border-t border-neutral-800/70">
          {b.claimDeadline > 0n && <span>claim {relTime(b.claimDeadline)}</span>}
          {b.reviewDeadline > 0n && <span>review {relTime(b.reviewDeadline)}</span>}
        </div>
      )}
    </article>
  );
}
