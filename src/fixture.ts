import { State } from './types';
import type { BountyView } from './types';
import type { BrandKey } from './brands';
import { BRAND_KEY } from './config';

// Faithful mirror of LIVE bounty #0 for each brand (read from that brand's
// BountyV1 / ReputationV1). Rendered — behind the same path as live data — only
// when the RPC is unreachable, so the UI stays verifiable offline and never
// leaks another chain's addresses.
const FIXTURES: Record<BrandKey, BountyView[]> = {
  zoo: [
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
  ],
  // Mirror of LIVE bounty #0 on Pars 494949 (BountyV1 0x316B…cf1F, PAID).
  pars: [
    {
      id: 0,
      state: State.Paid,
      token: '0x0000000000000000000000000000000000000000',
      funder: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
      approver: '0xDd30113b484671A35Ca236ec5A97C1c5327d72FA',
      arbiter: '0xDd30113b484671A35Ca236ec5A97C1c5327d72FA',
      worker: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
      reward: 200000000000000n,
      stake: 100000000000000n,
      claimDeadline: 1784330785n,
      claimWindow: 3600n,
      claimNonce: 0n,
      reviewWindow: 3600n,
      reviewDeadline: 1784330820n,
      issueRef: 'smoke',
      deliverableRef: 'smoke-deliverable',
      reputation: { completed: 1n, earned: 200000000000000n },
    },
  ],
  // lux + hanzo: work-market staged (not yet deployed) → no live bounty #0 to mirror.
  // Empty until their contracts land; the UI shows an empty board offline, not another chain's data.
  lux: [],
  hanzo: [],
};

export const FIXTURE: BountyView[] = FIXTURES[BRAND_KEY];
