import type { Address } from 'viem';

// The one place a white-label lives. A brand is selected at BUILD time by the
// VITE_BRAND build-arg (see Dockerfile / docker.yml); default is 'zoo'. Every
// brand-varying value — chain, addresses, owner label, header/title text, the RPC
// host baked into the CSP, and all Dework presentation (tagline, accent, socials,
// Spaces/categories) — is a field here, so standing up a new board is a data
// change, not a code change. Never cross brands: a Zoo build shows only Zoo.

// A Space is a bounty category (Dework "Space"). One Bounty serves the whole
// org, so a bounty is routed to a Space by matching its issueRef against `match`
// prefixes (config, not on-chain). `safe` is the sub-DAO / working-group treasury
// where one exists; else the org DAO Safe owns it. `project: true` renders the
// Space under "Projects based bounties" instead of "Bounties".
export type Space = {
  key: string;
  name: string;
  emoji: string;
  skills: string[];
  match?: string[];
  safe?: Address;
  project?: boolean;
};

export type Brand = {
  chainId: number;
  chainName: string;
  nativeSymbol: string;
  addresses: {
    bounty: Address;
    escrow: Address;
    reputation: Address;
    owner: Address;
    // Global soul-bound Karma (optional — set once canonical on this chain).
    karma?: Address;
    // DAO governor / fractal module (admins panel; optional).
    governor?: Address;
  };
  ownerLabel: string;
  // Organisation name shown in the header and <title>; `${org} — Work Board`.
  org: string;
  // Dework workspace name (sidebar + header), e.g. "Zoo".
  workspace: string;
  tagline: string;
  // Accent hex — primary buttons, active nav, highlights. Per-brand, never cross.
  accent: string;
  usdPerNative: number; // native → USD for the "Total paid: $X" header stat
  social: { discord?: string; twitter?: string; website?: string };
  tags: string[]; // About-panel chips
  spaces: Space[];
  // Hanzo IAM (OIDC) endpoints — Connect / Connect-with-Discord targets. Wired by
  // the CTO agent; optional until then.
  iam?: { authUrl: string; discordUrl: string };
  // Canonical public RPC. Baked into the bundle at build time (also the source of
  // the CSP connect-src host). Overridable per-build via VITE_RPC_URL.
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
      governor: '0xc23e396acA1CbB0D0cF1debc8371eDddbf52430e',
      // karma: set by CTO agent once canonical on 200200 (pod-split today).
    },
    ownerLabel: 'Zoo DAO Safe',
    org: 'Zoo DAO',
    workspace: 'Zoo',
    tagline: 'Open AI research network — DeAI & DeSci',
    accent: '#22c55e',
    usdPerNative: 1,
    social: { discord: 'https://discord.gg/zoo', twitter: 'https://twitter.com/zoo_labs', website: 'https://zoo.ngo' },
    tags: ['DeAI', 'DeSci', 'Research', 'Open Source', 'AI'],
    spaces: [
      { key: 'engineering', name: 'Engineering', emoji: '⚙️', skills: ['Development', 'Product'], match: ['zooai/', 'zoo-'] },
      { key: 'research', name: 'AI & Research', emoji: '🧬', skills: ['Research', 'Data Analytics'], match: ['research/', 'zoo-research'] },
      { key: 'community', name: 'Community & Social', emoji: '💬', skills: ['Community', 'Marketing'] },
      { key: 'content', name: 'Content Creation', emoji: '🎬', skills: ['Writing', 'Design'] },
      { key: 'governance', name: 'Governance', emoji: '🏛️', skills: ['Legal', 'Operations'], match: ['zips/'] },
    ],
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
    workspace: 'Pars',
    tagline: 'The community L1',
    accent: '#3b82f6',
    usdPerNative: 1,
    social: { website: 'https://pars.network' },
    tags: ['Community', 'L1', 'Governance'],
    spaces: [
      { key: 'engineering', name: 'Engineering', emoji: '⚙️', skills: ['Development', 'Product'] },
      { key: 'community', name: 'Community & Social', emoji: '💬', skills: ['Community', 'Marketing'] },
      { key: 'content', name: 'Content Creation', emoji: '🎬', skills: ['Writing', 'Design'] },
    ],
    rpcUrl: 'https://api.pars.network/v1/bc/C/rpc',
  },
  // lux + hanzo brands land in the batch-3 white-label pass, together with their
  // fixtures, CI matrix entries and k8s manifests (post flag-day / deploying).
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
