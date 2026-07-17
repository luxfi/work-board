import type { Address } from 'viem';

// BountyV1 lifecycle. uint8 on-chain; Accepted (5) is unused by the contract.
export enum State {
  None = 0,
  Open = 1,
  Funded = 2,
  Claimed = 3,
  Submitted = 4,
  Accepted = 5,
  Paid = 6,
  Disputed = 7,
  Cancelled = 8,
}

// The current bounties(i) struct, decoded.
export type Bounty = {
  state: number;
  token: Address;
  funder: Address;
  approver: Address;
  arbiter: Address;
  worker: Address;
  reward: bigint;
  stake: bigint;
  claimDeadline: bigint;
  claimWindow: bigint;
  claimNonce: bigint;
  reviewWindow: bigint;
  reviewDeadline: bigint;
};

export type Reputation = { completed: bigint; earned: bigint };

// A bounty assembled for the board: struct + event-only refs + worker reputation.
export type BountyView = Bounty & {
  id: number;
  issueRef?: string;
  deliverableRef?: string;
  reputation: Reputation;
};

export type ColumnDef = { state: State; title: string };

// Board columns, left to right.
export const COLUMNS: ColumnDef[] = [
  { state: State.Open, title: 'Open' },
  { state: State.Funded, title: 'Funded' },
  { state: State.Claimed, title: 'Claimed' },
  { state: State.Submitted, title: 'In Review' },
  { state: State.Paid, title: 'Paid' },
  { state: State.Disputed, title: 'Disputed' },
  { state: State.Cancelled, title: 'Cancelled' },
];

export const STATE_TITLE: Record<State, string> = {
  [State.None]: 'None',
  [State.Open]: 'Open',
  [State.Funded]: 'Funded',
  [State.Claimed]: 'Claimed',
  [State.Submitted]: 'In Review',
  [State.Accepted]: 'Accepted',
  [State.Paid]: 'Paid',
  [State.Disputed]: 'Disputed',
  [State.Cancelled]: 'Cancelled',
};
