import { AssetKind, State } from './types';
import type { BountyView } from './types';
import type { BrandKey } from './brands';
import { BRAND_KEY } from './config';

// Faithful mirror of LIVE bounty #0 for each brand, in the eighteen-field order
// `bounties(0)` answers in (src/abi.ts pins that order against the artifact).
// Rendered — behind the same path as live data — only when the RPC is
// unreachable, so the UI stays verifiable offline and never leaks another
// chain's addresses.
//
// Reward and stake are both the chain's own coin here, and the kind says so
// rather than the zero address implying it.
const FIXTURES: Record<BrandKey, BountyView[]> = {
  // Zoo 200200, Bounty 0x857c9fE5…1fFD, PAID.
  zoo: [
    {
      id: 0,
      state: State.Paid,
      rewardKind: AssetKind.Native,
      rewardToken: '0x0000000000000000000000000000000000000000',
      rewardTokenId: 0n,
      reward: 200000000000000n,
      stakeToken: '0x0000000000000000000000000000000000000000',
      stake: 100000000000000n,
      funder: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
      approver: '0xB4e242f9417872A843B2D0b92FCf89055349ABb5',
      arbiter: '0xB4e242f9417872A843B2D0b92FCf89055349ABb5',
      worker: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
      claimDeadline: 1784247266n,
      claimWindow: 3600n,
      claimNonce: 0n,
      reviewWindow: 3600n,
      reviewDeadline: 1784247266n,
      rewardCreditedAmount: 200000000000000n,
      settledAt: 1784247266n,
      issueRef: 'smoke',
      deliverableRef: 'smoke-deliverable',
      reputation: { completed: 1n, earned: 200000000000000n },
    },
  ],
  // Pars 494949, Bounty 0x79254D…33c2, PAID.
  pars: [
    {
      id: 0,
      state: State.Paid,
      rewardKind: AssetKind.Native,
      rewardToken: '0x0000000000000000000000000000000000000000',
      rewardTokenId: 0n,
      reward: 200000000000000n,
      stakeToken: '0x0000000000000000000000000000000000000000',
      stake: 100000000000000n,
      funder: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
      approver: '0xDd30113b484671A35Ca236ec5A97C1c5327d72FA',
      arbiter: '0xDd30113b484671A35Ca236ec5A97C1c5327d72FA',
      worker: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
      claimDeadline: 1784330785n,
      claimWindow: 3600n,
      claimNonce: 0n,
      reviewWindow: 3600n,
      reviewDeadline: 1784330820n,
      rewardCreditedAmount: 200000000000000n,
      settledAt: 1784330820n,
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
