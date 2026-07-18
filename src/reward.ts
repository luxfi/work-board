import { formatUnits } from 'viem';
import type { Address } from 'viem';
import type { Bounty, Reward } from './types';
import { RewardType } from './types';
import { isZero, short } from './format';

// Resolve a bounty's on-chain reward into the reward model. Today the Bounty struct
// carries only (token, reward): native when token==0, else ERC-20. The finished
// contract adds `rewardType` + `tokenId`; when present we honour them, so NFT rewards
// render the moment that struct lands — no UI change required. "Pay in crypto OR NFTs."
export function parseReward(b: Bounty): Reward {
  const t = b.rewardType;
  if (t === RewardType.ERC721) return { type: RewardType.ERC721, token: b.token, tokenId: b.tokenId ?? 0n };
  if (t === RewardType.ERC1155)
    return { type: RewardType.ERC1155, token: b.token, tokenId: b.tokenId ?? 0n, amount: b.reward };
  if (t === RewardType.ERC20 || (t === undefined && !isZero(b.token)))
    return { type: RewardType.ERC20, token: b.token, amount: b.reward };
  return { type: RewardType.Native, amount: b.reward };
}

// Optional NFT metadata (name + image), resolved from tokenURI/uri when it is an
// on-chain data: URI (CSP-safe). http/ipfs URIs are left to the caller.
export type NftMeta = { name?: string; image?: string; collection?: string };

export function isNft(r: Reward): boolean {
  return r.type === RewardType.ERC721 || r.type === RewardType.ERC1155;
}

export type RewardDisplay = {
  primary: string; // "0.0002 ZOO" | "Bored Ape #42" | "5× Sword #7"
  secondary?: string; // token address (short) for ERC-20/NFT
  image?: string; // NFT image, when metadata resolved
  isNft: boolean;
};

// Render a reward for a card / payout line. `nativeSymbol` is the org's coin;
// `tokenLabel` maps an ERC-20 address to a symbol; `meta` is resolved NFT metadata.
export function formatReward(
  r: Reward,
  nativeSymbol: string,
  tokenLabel: (t: Address) => string,
  meta?: NftMeta,
): RewardDisplay {
  switch (r.type) {
    case RewardType.Native:
      return { primary: `${trim(formatUnits(r.amount, 18))} ${nativeSymbol}`, isNft: false };
    case RewardType.ERC20:
      return {
        primary: `${trim(formatUnits(r.amount, 18))} ${tokenLabel(r.token)}`,
        secondary: short(r.token),
        isNft: false,
      };
    case RewardType.ERC721: {
      const name = meta?.name ?? `${meta?.collection ?? short(r.token)} #${r.tokenId}`;
      return { primary: name, secondary: short(r.token), image: meta?.image, isNft: true };
    }
    case RewardType.ERC1155: {
      const label = meta?.name ?? `${meta?.collection ?? short(r.token)} #${r.tokenId}`;
      const qty = r.amount > 1n ? `${r.amount}× ` : '';
      return { primary: `${qty}${label}`, secondary: short(r.token), image: meta?.image, isNft: true };
    }
  }
}

// Trim trailing zeros from a formatted decimal ("0.000200" -> "0.0002", "1.0" -> "1").
function trim(s: string): string {
  if (!s.includes('.')) return s;
  return s.replace(/\.?0+$/, '');
}
