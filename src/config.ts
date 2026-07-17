import type { Address } from 'viem';

// The one place chain / addresses / RPC live.

export const CHAIN_ID = 200200;
export const CHAIN_NAME = 'Zoo';
export const NATIVE_SYMBOL = 'ZOO';

// Dev: '/rpc' is proxied by Vite to the port-forwarded node (see vite.config.ts).
// Prod: build with VITE_RPC_URL=https://api.zoo.network/v1/bc/C/rpc
export const RPC_URL: string = import.meta.env.VITE_RPC_URL ?? '/rpc';

export const ADDRESSES = {
  bounty: '0x3EDb4a0104614b4aC12D5babCE984291aE8BE8E7',
  escrow: '0x095E68282aea751Cc70A2Be565270f1B6AB0229C',
  reputation: '0xed976852e8c2b1283e4F475845046B679224460D',
  owner: '0x229599f227231d8C90fcF1a78589F5DC4b7A6962',
} as const satisfies Record<string, Address>;

export const OWNER_LABEL = 'Zoo DAO Safe';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const REFRESH_MS = 15_000;
