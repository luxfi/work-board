// ABI fragments copied from the compiled Foundry artifacts
//   contracts/out-foundry/BountyV1.sol/BountyV1.json
//   contracts/out-foundry/ReputationV1.sol/ReputationV1.json
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
