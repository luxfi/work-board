import type { Address } from 'viem';

// The one place a white-label lives. A brand is selected at BUILD time by the
// VITE_BRAND build-arg (see Dockerfile / docker.yml); default is 'zoo'. Every
// brand-varying value — chain, addresses, owner label, header/title text, and
// the RPC host baked into the CSP — is a field here, so standing up a new board
// is a data change, not a code change. `zoo` reproduces the original hardcoded
// values exactly, so the default (Zoo) build is byte-for-byte unchanged.

export type Brand = {
  chainId: number;
  chainName: string;
  nativeSymbol: string;
  addresses: {
    bounty: Address;
    escrow: Address;
    reputation: Address;
    owner: Address;
  };
  ownerLabel: string;
  // Organisation name shown in the header and <title>; the board renders it as
  // `${org} — Work Board`.
  org: string;
  // Canonical public RPC. Baked into the bundle at build time (also the source
  // of the CSP connect-src host). Overridable per-build via VITE_RPC_URL.
  rpcUrl: string;
};

export const BRANDS = {
  zoo: {
    chainId: 200200,
    chainName: 'Zoo',
    nativeSymbol: 'ZOO',
    addresses: {
      bounty: '0x3EDb4a0104614b4aC12D5babCE984291aE8BE8E7',
      escrow: '0x095E68282aea751Cc70A2Be565270f1B6AB0229C',
      reputation: '0xed976852e8c2b1283e4F475845046B679224460D',
      owner: '0x229599f227231d8C90fcF1a78589F5DC4b7A6962',
    },
    ownerLabel: 'Zoo DAO Safe',
    org: 'Zoo DAO',
    rpcUrl: 'https://api.zoo.network/v1/bc/C/rpc',
  },
  pars: {
    chainId: 494949,
    chainName: 'Pars',
    nativeSymbol: 'PARS',
    addresses: {
      bounty: '0x316B41c886c7D4B4e38cBB08a243776Ed977cf1F',
      escrow: '0xD5890D32d603a04E35ec7dBAbDCD0CA400f07E92',
      reputation: '0x155d1363c23467929FB709FCFa0afC51F3497aB6',
      owner: '0x4CEA4ac1C874a340B06e0422E77a477463C3a542',
    },
    ownerLabel: 'Pars DAO Safe',
    org: 'Pars DAO',
    rpcUrl: 'https://api.pars.network/v1/bc/C/rpc',
  },
} as const satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;

export const DEFAULT_BRAND: BrandKey = 'zoo';

// Resolve a build-arg string to a brand, defaulting to Zoo for anything unknown
// so a bad VITE_BRAND can never produce a blank board.
export function resolveBrandKey(name: string | undefined): BrandKey {
  return name && name in BRANDS ? (name as BrandKey) : DEFAULT_BRAND;
}

export function resolveBrand(name: string | undefined): Brand {
  return BRANDS[resolveBrandKey(name)];
}

// Header + <title> derive from one field, so they can never drift apart.
export function brandTitle(b: Brand): string {
  return `${b.org} — Work Board`;
}
