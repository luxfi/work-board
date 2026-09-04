import { describe, expect, it } from 'vitest';
import { decodeFunctionResult, encodeAbiParameters } from 'viem';
import { bountyAbi, bountyProposedEvent } from './abi';
import { FIXTURE } from './fixture';
import { reward, stake } from './asset';
import { AssetKind, State } from './types';

// The chain's answer for a bounty whose every field carries a distinct value, so
// a component read one slot out of step lands somewhere it can be seen.
const FUNDER = '0x1111111111111111111111111111111111111111';
const APPROVER = '0x2222222222222222222222222222222222222222';
const ARBITER = '0x3333333333333333333333333333333333333333';
const WORKER = '0x4444444444444444444444444444444444444444';
const NFT = '0x5555555555555555555555555555555555555555';
const STAKE_TOKEN = '0x6666666666666666666666666666666666666666';

// The eighteen components `bounties(uint256)` answers with — name, type and a
// value of its own — copied from dao/contracts/out-foundry/Bounty.sol/Bounty.json.
// The artifact lives in another repository, so it is pinned here rather than
// read: a test that reaches across repositories measures a checkout. Order is
// the pin, the encoded vector and the expected decode all at once, so the three
// cannot drift apart.
const FIELDS: readonly (readonly [string, string, unknown])[] = [
  ['state', 'uint8', State.Submitted],
  ['rewardKind', 'uint8', AssetKind.ERC721],
  ['rewardToken', 'address', NFT],
  ['rewardTokenId', 'uint256', 7n],
  ['reward', 'uint256', 1n],
  ['stakeToken', 'address', STAKE_TOKEN],
  ['stake', 'uint256', 500n],
  ['funder', 'address', FUNDER],
  ['approver', 'address', APPROVER],
  ['arbiter', 'address', ARBITER],
  ['worker', 'address', WORKER],
  ['claimDeadline', 'uint64', 11n],
  ['claimWindow', 'uint64', 12n],
  ['claimNonce', 'uint64', 13n],
  ['reviewWindow', 'uint64', 14n],
  ['reviewDeadline', 'uint64', 15n],
  ['rewardCreditedAmount', 'uint256', 16n],
  ['settledAt', 'uint64', 17n],
];

type Component = { name: string; type: string };
const components = (): readonly Component[] => {
  const fn = bountyAbi.find((m) => m.name === 'bounties');
  const out = (fn as { outputs?: readonly { components?: readonly Component[] }[] } | undefined)?.outputs?.[0];
  return out?.components ?? [];
};

const answer = () =>
  encodeAbiParameters(
    [{ type: 'tuple', components: FIELDS.map(([name, type]) => ({ name, type })) }],
    [Object.fromEntries(FIELDS.map(([name, , value]) => [name, value]))],
  );

describe('the bounties tuple', () => {
  /**
   * Order is the entire content of a tuple decode. Every component is a static
   * type, so a list of the wrong length or order does not revert: it reads that
   * many words off the front and calls them whatever this file says. The board
   * carried a thirteen-field list, which reported rewardKind as the reward token
   * and moved every address after it up a slot — a board that looked populated
   * and credited the wrong people.
   */
  it('is the struct order the artifact declares', () => {
    expect(components().map((c) => `${c.name} ${c.type}`)).toEqual(FIELDS.map(([name, type]) => `${name} ${type}`));
  });

  /**
   * The pin above is a list of names; this is the decode those names drive. Put
   * a component in the wrong slot and the assertions below move with it, which
   * is what a mis-ordered board actually looks like from the outside.
   */
  it('lands every field of a real answer in its own slot', () => {
    const b = decodeFunctionResult({ abi: bountyAbi, functionName: 'bounties', data: answer() });

    expect(b.state).toBe(State.Submitted);
    expect(b.rewardKind).toBe(AssetKind.ERC721);
    expect(b.rewardToken).toBe(NFT);
    expect(b.rewardTokenId).toBe(7n);
    expect(b.reward).toBe(1n);
    expect(b.stakeToken).toBe(STAKE_TOKEN);
    expect(b.stake).toBe(500n);
    expect(b.funder).toBe(FUNDER);
    expect(b.approver).toBe(APPROVER);
    expect(b.arbiter).toBe(ARBITER);
    expect(b.worker).toBe(WORKER);
    expect(b.claimDeadline).toBe(11n);
    expect(b.claimWindow).toBe(12n);
    expect(b.claimNonce).toBe(13n);
    expect(b.reviewWindow).toBe(14n);
    expect(b.reviewDeadline).toBe(15n);
    expect(b.rewardCreditedAmount).toBe(16n);
    expect(b.settledAt).toBe(17n);
  });

  /** A reward that is an NFT and a stake that is not: neither reads off one field. */
  it('reads the reward asset and the stake asset apart', () => {
    const b = decodeFunctionResult({ abi: bountyAbi, functionName: 'bounties', data: answer() });

    expect(reward(b)).toEqual({ kind: AssetKind.ERC721, token: NFT, tokenId: 7n, amount: 1n });
    expect(stake(b)).toEqual({ kind: AssetKind.ERC20, token: STAKE_TOKEN, tokenId: 0n, amount: 500n });
  });

  /** A stake in the chain's own coin is native, and its token address says so. */
  it('calls a zero-token stake native', () => {
    const b = FIXTURE[0] ?? { stakeToken: '0x0000000000000000000000000000000000000000', stake: 1n };
    expect(stake(b as never).kind).toBe(AssetKind.Native);
  });
});

describe('BountyProposed', () => {
  /**
   * Ten parameters. The three added when the reward asset was split from the
   * stake asset — rewardKind, rewardTokenId, stakeToken — sit among the
   * unindexed ones, so a seven-parameter fragment decodes the data section into
   * the wrong names and issueRef, the only string, comes back as noise.
   */
  it('carries both assets and the issue ref', () => {
    expect(bountyProposedEvent.inputs.map((i) => `${i.name} ${i.type}${i.indexed ? ' indexed' : ''}`)).toEqual([
      'bountyId uint256 indexed',
      'funder address indexed',
      'approver address indexed',
      'rewardKind uint8',
      'rewardToken address',
      'rewardTokenId uint256',
      'reward uint256',
      'stakeToken address',
      'stake uint256',
      'issueRef string',
    ]);
  });
});

describe('the offline fixture', () => {
  /** A fixture in the old shape would enshrine the decode it was written under. */
  it('mirrors the struct field for field', () => {
    for (const b of FIXTURE) {
      for (const c of components()) expect(b).toHaveProperty(c.name);
      expect(reward(b).kind).toBe(AssetKind.Native);
    }
  });
});
