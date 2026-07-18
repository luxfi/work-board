// ABI fragments copied from the compiled Foundry artifacts
//   dao/contracts/out-foundry/{Bounty,Reputation}.sol/*.json
//   standard/contracts/governance/Karma.sol
// Only the members this board actually reads are included (no cross-repo import).

export const bountyAbi = [
  {
    type: 'function',
    name: 'bountyCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'bounties',
    inputs: [{ name: 'bountyId_', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'state', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'funder', type: 'address' },
          { name: 'approver', type: 'address' },
          { name: 'arbiter', type: 'address' },
          { name: 'worker', type: 'address' },
          { name: 'reward', type: 'uint256' },
          { name: 'stake', type: 'uint256' },
          { name: 'claimDeadline', type: 'uint64' },
          { name: 'claimWindow', type: 'uint64' },
          { name: 'claimNonce', type: 'uint64' },
          { name: 'reviewWindow', type: 'uint64' },
          { name: 'reviewDeadline', type: 'uint64' },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const;

// ---- Events (assemble refs, activity log, stats and reviewer counts) ----

export const bountyProposedEvent = {
  type: 'event',
  name: 'BountyProposed',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'funder', type: 'address', indexed: true },
    { name: 'approver', type: 'address', indexed: true },
    { name: 'token', type: 'address', indexed: false },
    { name: 'reward', type: 'uint256', indexed: false },
    { name: 'stake', type: 'uint256', indexed: false },
    { name: 'issueRef', type: 'string', indexed: false },
  ],
} as const;

export const bountyFundedEvent = {
  type: 'event',
  name: 'BountyFunded',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'funder', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
  ],
} as const;

export const bountyClaimedEvent = {
  type: 'event',
  name: 'BountyClaimed',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'worker', type: 'address', indexed: true },
    { name: 'stake', type: 'uint256', indexed: false },
    { name: 'claimDeadline', type: 'uint64', indexed: false },
  ],
} as const;

export const workSubmittedEvent = {
  type: 'event',
  name: 'WorkSubmitted',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'worker', type: 'address', indexed: true },
    { name: 'deliverableRef', type: 'string', indexed: false },
  ],
} as const;

export const workAcceptedEvent = {
  type: 'event',
  name: 'WorkAccepted',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'approver', type: 'address', indexed: true },
    { name: 'worker', type: 'address', indexed: true },
  ],
} as const;

export const paymentReleasedEvent = {
  type: 'event',
  name: 'PaymentReleased',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'worker', type: 'address', indexed: true },
    { name: 'reward', type: 'uint256', indexed: false },
    { name: 'stakeReturned', type: 'uint256', indexed: false },
  ],
} as const;

export const bountyCancelledEvent = {
  type: 'event',
  name: 'BountyCancelled',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'funder', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
  ],
} as const;

export const bountyDisputedEvent = {
  type: 'event',
  name: 'BountyDisputed',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'disputer', type: 'address', indexed: true },
    { name: 'reasonRef', type: 'string', indexed: false },
  ],
} as const;

export const bountyFinalizedEvent = {
  type: 'event',
  name: 'BountyFinalized',
  anonymous: false,
  inputs: [
    { name: 'bountyId', type: 'uint256', indexed: true },
    { name: 'finalizer', type: 'address', indexed: true },
    { name: 'worker', type: 'address', indexed: true },
  ],
} as const;

// ---- Reputation (per-DAO worker ledger) ----
export const reputationAbi = [
  {
    type: 'function',
    name: 'completedOf',
    inputs: [{ name: 'worker_', type: 'address' }],
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'earnedOf',
    inputs: [{ name: 'worker_', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ---- Karma (global soul-bound reputation; optional per org) ----
export const karmaAbi = [
  {
    type: 'function',
    name: 'karmaOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ---- NFT reward metadata (ERC-721 tokenURI / name, ERC-1155 uri) ----
export const nftMetaAbi = [
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'uri',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;
