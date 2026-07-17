import { createPublicClient, defineChain, http } from 'viem';
import { bountyAbi, bountyProposedEvent, reputationAbi, workSubmittedEvent } from './abi';
import { ADDRESSES, CHAIN_ID, CHAIN_NAME, NATIVE_SYMBOL, RPC_URL } from './config';
import { isZero } from './format';
import type { Bounty, BountyView, Reputation } from './types';

// Resolve a root-relative RPC ('/rpc', dev proxy) to an absolute URL for viem/fetch.
function resolveUrl(u: string): string {
  return u.startsWith('/') && typeof window !== 'undefined' ? window.location.origin + u : u;
}

const rpc = resolveUrl(RPC_URL);

export const zooChain = defineChain({
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: { name: CHAIN_NAME, symbol: NATIVE_SYMBOL, decimals: 18 },
  rpcUrls: { default: { http: [rpc] } },
});

const client = createPublicClient({
  chain: zooChain,
  transport: http(rpc, { batch: true }),
});

// Read the entire work-market and assemble the board. This is the real path.
export async function loadBoard(): Promise<BountyView[]> {
  const count = (await client.readContract({
    address: ADDRESSES.bounty,
    abi: bountyAbi,
    functionName: 'bountyCount',
  })) as bigint;

  const n = Number(count);
  if (n === 0) return [];

  const ids = Array.from({ length: n }, (_, i) => i);

  // Current struct per bounty (batched into one JSON-RPC request).
  const bounties = (await Promise.all(
    ids.map((id) =>
      client.readContract({
        address: ADDRESSES.bounty,
        abi: bountyAbi,
        functionName: 'bounties',
        args: [BigInt(id)],
      }),
    ),
  )) as unknown as Bounty[];

  // issueRef / deliverableRef live only in events, not storage.
  const [proposed, submitted] = await Promise.all([
    client.getLogs({ address: ADDRESSES.bounty, event: bountyProposedEvent, fromBlock: 0n, toBlock: 'latest' }),
    client.getLogs({ address: ADDRESSES.bounty, event: workSubmittedEvent, fromBlock: 0n, toBlock: 'latest' }),
  ]);

  const issueRefById = new Map<number, string>();
  for (const log of proposed) {
    const id = log.args.bountyId;
    const ref = log.args.issueRef;
    if (id !== undefined && ref !== undefined) issueRefById.set(Number(id), ref);
  }
  const deliverableById = new Map<number, string>();
  for (const log of submitted) {
    const id = log.args.bountyId;
    const ref = log.args.deliverableRef;
    if (id !== undefined && ref !== undefined) deliverableById.set(Number(id), ref);
  }

  // Portable on-chain reputation, one lookup per distinct non-zero worker.
  const workers = Array.from(new Set(bounties.filter((b) => !isZero(b.worker)).map((b) => b.worker)));
  const repEntries = await Promise.all(
    workers.map(async (w) => {
      const [completed, earned] = await Promise.all([
        client.readContract({ address: ADDRESSES.reputation, abi: reputationAbi, functionName: 'completedOf', args: [w] }),
        client.readContract({ address: ADDRESSES.reputation, abi: reputationAbi, functionName: 'earnedOf', args: [w] }),
      ]);
      return [w.toLowerCase(), { completed: completed as bigint, earned: earned as bigint }] as const;
    }),
  );
  const repByWorker = new Map<string, Reputation>(repEntries);

  return ids.map((id) => {
    const b = bounties[id];
    return {
      id,
      ...b,
      issueRef: issueRefById.get(id),
      deliverableRef: deliverableById.get(id),
      reputation: repByWorker.get(b.worker.toLowerCase()) ?? { completed: 0n, earned: 0n },
    };
  });
}
