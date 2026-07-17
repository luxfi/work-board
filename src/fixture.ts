import { State } from './types';
import type { BountyView } from './types';

// Faithful mirror of LIVE bounty #0 on Zoo 200200 (read from BountyV1 /
// ReputationV1 at build time). Rendered — behind the same path as live data —
// only when the RPC is unreachable, so the UI stays verifiable offline.
export const FIXTURE: BountyView[] = [
  {
    id: 0,
    state: State.Paid,
    token: '0x0000000000000000000000000000000000000000',
    funder: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
    approver: '0xB4e242f9417872A843B2D0b92FCf89055349ABb5',
    arbiter: '0xB4e242f9417872A843B2D0b92FCf89055349ABb5',
    worker: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
    reward: 200000000000000n,
    stake: 100000000000000n,
    claimDeadline: 1784247266n,
    claimWindow: 3600n,
    claimNonce: 0n,
    reviewWindow: 3600n,
    reviewDeadline: 1784247266n,
    issueRef: 'smoke',
    deliverableRef: 'smoke-deliverable',
    reputation: { completed: 1n, earned: 200000000000000n },
  },
];
