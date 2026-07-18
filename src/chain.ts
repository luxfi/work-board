import { createPublicClient, defineChain, http } from 'viem';
import type { Address } from 'viem';
import {
  bountyAbi,
  bountyCancelledEvent,
  bountyClaimedEvent,
  bountyDisputedEvent,
  bountyFinalizedEvent,
  bountyFundedEvent,
  bountyProposedEvent,
  karmaAbi,
  nftMetaAbi,
  paymentReleasedEvent,
  reputationAbi,
  workAcceptedEvent,
  workSubmittedEvent,
} from './abi';
import { ADDRESSES, CHAIN_ID, CHAIN_NAME, NATIVE_SYMBOL, RPC_URL } from './config';
import { isZero } from './format';
import type { Activity, Bounty, BountyView, Contributor, OrgStats, Reputation } from './types';
import type { NftMeta } from './reward';

// Resolve a root-relative RPC ('/rpc', dev proxy) to an absolute URL for viem/fetch.
function resolveUrl(u: string): string {
  return u.startsWith('/') && typeof window !== 'undefined' ? window.location.origin + u : u;
}

const rpc = resolveUrl(RPC_URL);

export const appChain = defineChain({
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: { name: CHAIN_NAME, symbol: NATIVE_SYMBOL, decimals: 18 },
  rpcUrls: { default: { http: [rpc] } },
});

const client = createPublicClient({
  chain: appChain,
  transport: http(rpc, { batch: true }),
});

// Karma is optional — only read when the org has a canonical Karma deployment.
const KARMA: Address | undefined = ADDRESSES.karma;

// The whole work-market, assembled once: board, activity log, stats, contributors.
// Every view derives from this single on-chain read, so numbers can never drift
// between the header, the board and the leaderboard.
export type Workspace = {
  bounties: BountyView[];
  activity: Activity[];
  stats: OrgStats;
  contributors: Contributor[];
};

export async function loadWorkspace(): Promise<Workspace> {
  const count = (await client.readContract({
    address: ADDRESSES.bounty,
    abi: bountyAbi,
    functionName: 'bountyCount',
  })) as bigint;

  const n = Number(count);
  const ids = Array.from({ length: n }, (_, i) => i);

  // Current struct per bounty (batched into one JSON-RPC request).
  const bountyStructs = (await Promise.all(
    ids.map((id) =>
      client.readContract({ address: ADDRESSES.bounty, abi: bountyAbi, functionName: 'bounties', args: [BigInt(id)] }),
    ),
  )) as unknown as Bounty[];

  // The full event stream in one shot — refs, activity, stats, reviewer counts.
  // Each getLogs is inlined (not wrapped) so viem infers the per-event arg types.
  const range = { address: ADDRESSES.bounty, fromBlock: 0n, toBlock: 'latest' } as const;
  const [proposed, funded, claimed, submitted, accepted, paid, cancelled, disputed, finalized] = await Promise.all([
    client.getLogs({ ...range, event: bountyProposedEvent }),
    client.getLogs({ ...range, event: bountyFundedEvent }),
    client.getLogs({ ...range, event: bountyClaimedEvent }),
    client.getLogs({ ...range, event: workSubmittedEvent }),
    client.getLogs({ ...range, event: workAcceptedEvent }),
    client.getLogs({ ...range, event: paymentReleasedEvent }),
    client.getLogs({ ...range, event: bountyCancelledEvent }),
    client.getLogs({ ...range, event: bountyDisputedEvent }),
    client.getLogs({ ...range, event: bountyFinalizedEvent }),
  ]);

  // Block timestamps for every event block (deduped, batched).
  const blockNums = new Set<bigint>();
  for (const group of [proposed, funded, claimed, submitted, accepted, paid, cancelled, disputed, finalized])
    for (const l of group) if (l.blockNumber != null) blockNums.add(l.blockNumber);
  const tsByBlock = new Map<bigint, number>();
  await Promise.all(
    Array.from(blockNums).map(async (bn) => {
      const block = await client.getBlock({ blockNumber: bn });
      tsByBlock.set(bn, Number(block.timestamp));
    }),
  );
  const tsOf = (bn: bigint | null | undefined): number => (bn != null ? (tsByBlock.get(bn) ?? 0) : 0);

  // Event-only refs.
  const issueRefById = new Map<number, string>();
  for (const l of proposed) if (l.args.issueRef != null) issueRefById.set(Number(l.args.bountyId), l.args.issueRef);
  const deliverableById = new Map<number, string>();
  for (const l of submitted)
    if (l.args.deliverableRef != null) deliverableById.set(Number(l.args.bountyId), l.args.deliverableRef);

  // Reviewer counts (WorkAccepted approver), collected first so a pure reviewer
  // (someone who reviews but never works a task) still appears on the leaderboard.
  const reviewedBy = new Map<string, number>();
  const reviewers: Address[] = [];
  for (const l of accepted) {
    const a = l.args.approver;
    if (a && !isZero(a)) {
      reviewedBy.set(a.toLowerCase(), (reviewedBy.get(a.toLowerCase()) ?? 0) + 1);
      reviewers.push(a);
    }
  }

  // Reputation + Karma for every distinct participant (workers ∪ reviewers).
  const participantsByAddr = new Map<string, Address>();
  for (const b of bountyStructs) if (!isZero(b.worker)) participantsByAddr.set(b.worker.toLowerCase(), b.worker);
  for (const r of reviewers) participantsByAddr.set(r.toLowerCase(), r);
  const participants = Array.from(participantsByAddr.values());
  const repByWorker = await reputationFor(participants);

  const bounties: BountyView[] = ids.map((id) => {
    const b = bountyStructs[id];
    return {
      id,
      ...b,
      issueRef: issueRefById.get(id),
      deliverableRef: deliverableById.get(id),
      reputation: repByWorker.get(b.worker.toLowerCase()) ?? { completed: 0n, earned: 0n },
    };
  });

  // Activity log, newest first.
  const activity: Activity[] = [];
  for (const l of proposed)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'proposed', actor: l.args.funder!, ts: tsOf(l.blockNumber), detail: l.args.issueRef });
  for (const l of funded)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'funded', actor: l.args.funder!, ts: tsOf(l.blockNumber) });
  for (const l of claimed)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'claimed', actor: l.args.worker!, ts: tsOf(l.blockNumber) });
  for (const l of submitted)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'submitted', actor: l.args.worker!, ts: tsOf(l.blockNumber), detail: l.args.deliverableRef });
  for (const l of accepted)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'accepted', actor: l.args.approver!, ts: tsOf(l.blockNumber) });
  for (const l of paid)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'paid', actor: l.args.worker!, ts: tsOf(l.blockNumber), detail: l.args.reward?.toString() });
  for (const l of cancelled)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'cancelled', actor: l.args.funder!, ts: tsOf(l.blockNumber) });
  for (const l of disputed)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'disputed', actor: l.args.disputer!, ts: tsOf(l.blockNumber), detail: l.args.reasonRef });
  for (const l of finalized)
    activity.push({ bountyId: Number(l.args.bountyId), kind: 'finalized', actor: l.args.worker!, ts: tsOf(l.blockNumber) });
  activity.sort((a, b) => b.ts - a.ts);

  // Stats — total paid + avg time-to-payment from events.
  let totalPaidWei = 0n;
  for (const l of paid) totalPaidWei += l.args.reward ?? 0n;
  const proposedTs = new Map<number, number>();
  for (const l of proposed) proposedTs.set(Number(l.args.bountyId), tsOf(l.blockNumber));
  const deltas: number[] = [];
  for (const l of paid) {
    const id = Number(l.args.bountyId);
    const p = proposedTs.get(id);
    const paidAt = tsOf(l.blockNumber);
    if (p && paidAt && paidAt >= p) deltas.push(paidAt - p);
  }
  const avgTimeToPaymentSec = deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;

  // Distinct on-chain participants (workers + funders + approvers).
  const people = new Set<string>();
  for (const b of bountyStructs) {
    for (const a of [b.worker, b.funder, b.approver]) if (!isZero(a)) people.add(a.toLowerCase());
  }

  for (const r of reviewers) people.add(r.toLowerCase());

  const contributors = buildContributors(participants, repByWorker, reviewedBy);

  return {
    bounties,
    activity,
    stats: {
      totalPaidWei,
      paidCount: paid.length,
      avgTimeToPaymentSec,
      contributorCount: people.size,
    },
    contributors,
  };
}

async function reputationFor(workers: Address[]): Promise<Map<string, Reputation>> {
  const entries = await Promise.all(
    workers.map(async (w) => {
      const [completed, earned] = await Promise.all([
        client.readContract({ address: ADDRESSES.reputation, abi: reputationAbi, functionName: 'completedOf', args: [w] }),
        client.readContract({ address: ADDRESSES.reputation, abi: reputationAbi, functionName: 'earnedOf', args: [w] }),
      ]);
      let karma: bigint | undefined;
      if (KARMA) {
        try {
          karma = (await client.readContract({ address: KARMA, abi: karmaAbi, functionName: 'karmaOf', args: [w] })) as bigint;
        } catch {
          karma = undefined; // Karma not yet canonical on this chain — degrade cleanly.
        }
      }
      return [w.toLowerCase(), { completed: completed as bigint, earned: earned as bigint, karma }] as const;
    }),
  );
  return new Map(entries);
}

function buildContributors(
  workers: Address[],
  rep: Map<string, Reputation>,
  reviewedBy: Map<string, number>,
): Contributor[] {
  const rows: Contributor[] = workers.map((w) => {
    const r = rep.get(w.toLowerCase()) ?? { completed: 0n, earned: 0n };
    return {
      address: w,
      completed: r.completed,
      earned: r.earned,
      karma: r.karma,
      reviewed: reviewedBy.get(w.toLowerCase()) ?? 0,
      points: r.completed * 100n, // transparent derived metric (tasks × 100)
    };
  });
  rows.sort((a, b) => (b.completed === a.completed ? Number(b.earned - a.earned) : Number(b.completed - a.completed)));
  return rows;
}

// Optional NFT reward metadata, resolved from an on-chain data: tokenURI/uri only
// (CSP-safe — no external fetch). http/ipfs URIs are skipped (placeholder shown).
export async function loadNftMeta(token: Address, tokenId: bigint, erc1155: boolean): Promise<NftMeta | undefined> {
  try {
    const uri = (await client.readContract({
      address: token,
      abi: nftMetaAbi,
      functionName: erc1155 ? 'uri' : 'tokenURI',
      args: [tokenId],
    })) as string;
    let collection: string | undefined;
    try {
      collection = (await client.readContract({ address: token, abi: nftMetaAbi, functionName: 'name' })) as string;
    } catch {
      collection = undefined;
    }
    if (uri.startsWith('data:application/json')) {
      const json = uri.startsWith('data:application/json;base64,')
        ? atob(uri.slice('data:application/json;base64,'.length))
        : decodeURIComponent(uri.slice(uri.indexOf(',') + 1));
      const meta = JSON.parse(json) as { name?: string; image?: string };
      return { name: meta.name, image: meta.image?.startsWith('data:') ? meta.image : undefined, collection };
    }
    return { collection };
  } catch {
    return undefined;
  }
}
