import type { Address } from 'viem';

// Bounty lifecycle. uint8 on-chain; Accepted (5) is unused by the current contract
// but reserved by the enum.
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

// The current bounties(i) struct, decoded. `rewardType`/`tokenId` are optional:
// Bounty has neither (every reward is native/ERC-20). the finished Bounty (CTO agent) adds
// them; chain.ts populates them when present so the reward model is future-proof.
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
  rewardType?: number; // RewardType; undefined => infer from token (native/erc20)
  tokenId?: bigint; // ERC-721/1155 token id
};

// Portable reputation. `earned` is the per-DAO Reputation total; `karma` is the
// GLOBAL soul-bound Karma score (optional — only when the org has a Karma address).
export type Reputation = { completed: bigint; earned: bigint; karma?: bigint };

// A bounty assembled for the board: struct + event-only refs + worker reputation.
export type BountyView = Bounty & {
  id: number;
  issueRef?: string;
  deliverableRef?: string;
  reputation: Reputation;
};

// ---- Reward model (native / ERC-20 / ERC-721 / ERC-1155) ----
export enum RewardType {
  Native = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
}

export type Reward =
  | { type: RewardType.Native; amount: bigint }
  | { type: RewardType.ERC20; token: Address; amount: bigint }
  | { type: RewardType.ERC721; token: Address; tokenId: bigint }
  | { type: RewardType.ERC1155; token: Address; tokenId: bigint; amount: bigint };

// ---- Board lanes (the Dework 4-column board) ----
export enum Lane {
  ToDo = 'todo',
  InProgress = 'progress',
  InReview = 'review',
  Done = 'done',
}

export type LaneDef = {
  lane: Lane;
  title: string;
  empty: string; // empty-state copy (matches Dework)
  icon: 'invite' | 'bolt' | 'review' | 'pay';
};

// Left→right, with Dework's exact empty-state framing.
export const LANES: LaneDef[] = [
  { lane: Lane.ToDo, title: 'To Do', empty: 'Put out tasks, let contributors explore and apply', icon: 'invite' },
  { lane: Lane.InProgress, title: 'In Progress', empty: 'Keep track of contributor tasks in progress', icon: 'bolt' },
  { lane: Lane.InReview, title: 'In Review', empty: 'When a contributor is done, review the work', icon: 'review' },
  { lane: Lane.Done, title: 'Done', empty: 'Pay for completed tasks in crypto using any token', icon: 'pay' },
];

// State → lane. Disputed/Cancelled/None are off-board (surfaced in the task detail).
export function laneOf(state: number): Lane | null {
  switch (state) {
    case State.Open:
    case State.Funded:
      return Lane.ToDo;
    case State.Claimed:
      return Lane.InProgress;
    case State.Submitted:
      return Lane.InReview;
    case State.Accepted:
    case State.Paid:
      return Lane.Done;
    default:
      return null;
  }
}

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

// "Open to Bids" (a task anyone can claim by staking) vs "Open to Applications"
// (a reviewer assigns). Derived from lifecycle state; both surface as a badge.
export type OpenTo = 'bids' | 'applications' | null;

export function openToOf(state: number): OpenTo {
  if (state === State.Open || state === State.Funded) return 'bids';
  return null;
}

// A Task is a BountyView enriched with presentation metadata (title, space, skills,
// lane, reward, open-to). This is what every Dework view renders.
export type Task = BountyView & {
  title: string;
  spaceKey: string;
  skills: string[];
  lane: Lane | null;
  openTo: OpenTo;
  parsedReward: Reward;
};

// ---- Activity log (assembled from the bounty event stream, with block ts) ----
export type ActivityKind =
  | 'proposed'
  | 'funded'
  | 'claimed'
  | 'submitted'
  | 'accepted'
  | 'paid'
  | 'disputed'
  | 'resolved'
  | 'cancelled'
  | 'slashed'
  | 'finalized';

export type Activity = {
  bountyId: number;
  kind: ActivityKind;
  actor: Address;
  ts: number; // unix seconds (block timestamp)
  detail?: string; // issueRef / deliverableRef / amount summary
};

// ---- Leaderboard ----
export type Contributor = {
  address: Address;
  completed: bigint; // tasks done (Reputation.completedOf)
  earned: bigint; // per-DAO earned (Reputation.earnedOf)
  karma?: bigint; // global Karma (optional)
  reviewed: number; // tasks reviewed (as approver, from events)
  points: bigint; // task points (derived from completed + earned)
};

// ---- Org-level stats (Bounty events) ----
export type OrgStats = {
  totalPaidWei: bigint; // Σ PaymentReleased.reward
  paidCount: number;
  avgTimeToPaymentSec: number; // avg(paid.ts − proposed.ts)
  contributorCount: number; // distinct workers/funders/approvers
};
