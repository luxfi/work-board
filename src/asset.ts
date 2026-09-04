import { formatUnits } from 'viem';
import type { Address } from 'viem';
import type { Asset, Bounty } from './types';
import { AssetKind } from './types';
import { isZero, short } from './format';

// A bounty holds two assets. The reward says what it is made of, so nothing is
// guessed: `rewardKind` is read straight off the struct. The stake carries no
// kind of its own — the escrow only ever takes value for it, so a zero token
// address is the chain's coin and anything else is an ERC-20.
export function reward(b: Bounty): Asset {
  return { kind: b.rewardKind as AssetKind, token: b.rewardToken, tokenId: b.rewardTokenId, amount: b.reward };
}

export function stake(b: Bounty): Asset {
  return {
    kind: isZero(b.stakeToken) ? AssetKind.Native : AssetKind.ERC20,
    token: b.stakeToken,
    tokenId: 0n,
    amount: b.stake,
  };
}

// Optional NFT metadata (name + image), resolved from tokenURI/uri when it is an
// on-chain data: URI (CSP-safe). http/ipfs URIs are left to the caller.
export type NftMeta = { name?: string; image?: string; collection?: string };

export function isNft(a: Asset): boolean {
  return a.kind === AssetKind.ERC721 || a.kind === AssetKind.ERC1155;
}

export type Display = {
  primary: string; // "0.0002 ZOO" | "Bored Ape #42" | "5× Sword #7"
  secondary?: string; // token address (short) for ERC-20/NFT
  image?: string; // NFT image, when metadata resolved
  isNft: boolean;
};

// Render an asset for a card / payout line. `nativeSymbol` is the org's coin;
// `tokenLabel` maps an ERC-20 address to a symbol; `meta` is resolved NFT metadata.
// Native and any kind this build does not know share the default branch: a kind
// added to the enum later renders as an amount rather than as an empty cell.
export function format(a: Asset, nativeSymbol: string, tokenLabel: (t: Address) => string, meta?: NftMeta): Display {
  switch (a.kind) {
    case AssetKind.ERC721: {
      const name = meta?.name ?? `${meta?.collection ?? short(a.token)} #${a.tokenId}`;
      return { primary: name, secondary: short(a.token), image: meta?.image, isNft: true };
    }
    case AssetKind.ERC1155: {
      const label = meta?.name ?? `${meta?.collection ?? short(a.token)} #${a.tokenId}`;
      const qty = a.amount > 1n ? `${a.amount}× ` : '';
      return { primary: `${qty}${label}`, secondary: short(a.token), image: meta?.image, isNft: true };
    }
    case AssetKind.ERC20:
      return {
        primary: `${trim(formatUnits(a.amount, 18))} ${tokenLabel(a.token)}`,
        secondary: short(a.token),
        isNft: false,
      };
    default:
      return { primary: `${trim(formatUnits(a.amount, 18))} ${nativeSymbol}`, isNft: false };
  }
}

// Trim trailing zeros from a formatted decimal ("0.000200" -> "0.0002", "1.0" -> "1").
function trim(s: string): string {
  if (!s.includes('.')) return s;
  return s.replace(/\.?0+$/, '');
}
