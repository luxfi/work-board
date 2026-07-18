import type { Address } from 'viem';
// NOTE: brand logo .svg imports live in ./brand-logos.ts, NOT here. vite.config.ts
// imports this module for the build-time title/CSP, and the config bundler can't
// parse .svg imports (it reads the SVG markup as JSX). Keep brands.ts asset-free.

// The one place a white-label lives. A brand is selected at BUILD time by the
// VITE_BRAND build-arg (see Dockerfile / docker.yml); default is 'zoo'. Every
// brand-varying value — chain, addresses, owner label, header/title text, the RPC
// host baked into the CSP, and all Dework presentation (tagline, accent, logos,
// socials, Spaces/categories) — is a field here, so standing up a new board is a
// data change, not a code change. Never cross brands: a Zoo build shows only Zoo.

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
  // Optional secondary/highlight hex (e.g. Pars gold). Omit for single-accent brands.
  accentSecondary?: string;
  usdPerNative: number; // native → USD for the "Total paid: $X" header stat
  social: { discord?: string; twitter?: string; website?: string };
  tags: string[]; // About-panel chips
  spaces: Space[];
  // Hanzo IAM (OIDC) — the brand's identity tenant. `issuer` is the per-brand host
  // (lux.id / pars.id / hanzo.id / zoo.id); IAM resolves the org from that host and
  // white-labels the login page. `clientId` is the `<org>-work` public SPA client
  // (authorization-code + PKCE, no secret). Discord / GitHub / Phantom / WalletConnect
  // all resolve through this ONE tenant (see src/auth.ts). Optional
  // walletConnectProjectId enables the WalletConnect method (needs an upstream
  // WalletConnect Cloud projectId in KMS). Unset ⇒ the Connect surface falls back to
  // socials, so a control is never dead.
  iam?: { issuer: string; clientId: string; walletConnectProjectId?: string };
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
    accent: '#6c5efb',
    usdPerNative: 1,
    social: { discord: 'https://discord.gg/zoo', twitter: 'https://twitter.com/zoo_labs', website: 'https://zoo.ngo' },
    tags: ['DeAI', 'DeSci', 'Research', 'Open Source', 'AI'],
    spaces: [
      { key: 'engineering', name: 'Engineering', emoji: '⚙️', skills: ['Development', 'Product'], match: ['zooai/', 'zoo-'] },
      { key: 'research', name: 'AI & Research', emoji: '🧬', skills: ['Research', 'Data Analytics'], match: ['research/', 'zoo-research'] },
      { key: 'ecosystem', name: 'Ecosystem & Partnerships', emoji: '🤝', skills: ['Partnerships', 'Business Development'] },
      { key: 'community', name: 'Community & Social', emoji: '💬', skills: ['Community', 'Marketing'] },
      { key: 'content', name: 'Content Creation', emoji: '🎬', skills: ['Writing', 'Design'] },
      { key: 'governance', name: 'Governance', emoji: '🏛️', skills: ['Legal', 'Operations'], match: ['zips/'] },
    ],
    // NOTE: zoo.id has no DNS yet — pending an A record → the hanzo-k8s LB
    // (129.212.164.5, same as lux.id/pars.id) + the zoo org's domain set to zoo.id
    // in IAM so its authorize/token resolve to zoo.id (today id.zoo.network leaks
    // authorize→hanzo.id). Until then Connect degrades to socials for Zoo.
    iam: { issuer: 'https://zoo.id', clientId: 'zoo-work' },
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
    accent: '#1C3879',
    accentSecondary: '#D4AF37',
    usdPerNative: 1,
    social: { website: 'https://pars.network' },
    tags: ['Community', 'L1', 'Governance'],
    spaces: [
      { key: 'engineering', name: 'Engineering', emoji: '⚙️', skills: ['Development', 'Product'] },
      { key: 'ecosystem', name: 'Ecosystem & Partnerships', emoji: '🤝', skills: ['Partnerships', 'Business Development'] },
      { key: 'community', name: 'Community & Social', emoji: '💬', skills: ['Community', 'Marketing'] },
      { key: 'content', name: 'Content Creation', emoji: '🎬', skills: ['Writing', 'Design'] },
      { key: 'education', name: 'Education & Research', emoji: '📚', skills: ['Education', 'Research'] },
      { key: 'governance', name: 'Governance', emoji: '🏛️', skills: ['Legal', 'Operations'], match: ['pips/'] },
    ],
    iam: { issuer: 'https://pars.id', clientId: 'pars-work' },
    rpcUrl: 'https://api.pars.network/v1/bc/C/rpc',
  },
  lux: {
    chainId: 96369,
    chainName: 'Lux',
    nativeSymbol: 'LUX',
    addresses: {
      // TODO: no work-market deployed yet (Lux frozen / Hanzo key-gap)
      bounty: '0x0000000000000000000000000000000000000000',
      escrow: '0x0000000000000000000000000000000000000000',
      reputation: '0x0000000000000000000000000000000000000000',
      owner: '0x0000000000000000000000000000000000000000',
    },
    ownerLabel: 'Lux DAO Safe',
    org: 'Lux DAO',
    workspace: 'Lux',
    tagline: 'Quantum-safe multi-consensus L1',
    accent: '#7000FF',
    usdPerNative: 1,
    social: { discord: 'https://discord.gg/lux', twitter: 'https://x.com/luxfi', website: 'https://lux.network' },
    tags: ['Consensus', 'Post-Quantum', 'L1', 'DeFi', 'Open Source'],
    spaces: [
      { key: 'engineering', name: 'Engineering', emoji: '⚙️', skills: ['Development', 'Product'], match: ['luxfi/', 'lux-'] },
      { key: 'ecosystem', name: 'Ecosystem & Partnerships', emoji: '🤝', skills: ['Partnerships', 'Business Development'] },
      { key: 'community', name: 'Community & Social', emoji: '💬', skills: ['Community', 'Marketing'] },
      { key: 'content', name: 'Content Creation', emoji: '🎬', skills: ['Writing', 'Design'] },
      { key: 'research', name: 'Research', emoji: '🔬', skills: ['Research', 'Cryptography'] },
      { key: 'governance', name: 'Governance', emoji: '🏛️', skills: ['Legal', 'Operations'] },
    ],
    iam: { issuer: 'https://lux.id', clientId: 'lux-work' },
    rpcUrl: 'https://api.lux.network/v1/bc/C/rpc',
  },
  hanzo: {
    chainId: 36963,
    chainName: 'Hanzo',
    nativeSymbol: 'AI',
    addresses: {
      // TODO: no work-market deployed yet (Lux frozen / Hanzo key-gap)
      bounty: '0x0000000000000000000000000000000000000000',
      escrow: '0x0000000000000000000000000000000000000000',
      reputation: '0x0000000000000000000000000000000000000000',
      owner: '0x0000000000000000000000000000000000000000',
    },
    ownerLabel: 'Hanzo DAO Safe',
    org: 'Hanzo DAO',
    workspace: 'Hanzo',
    tagline: 'Frontier AI & foundational models',
    accent: '#ea580c',
    usdPerNative: 1,
    social: { discord: 'https://discord.gg/hanzo', website: 'https://hanzo.ai' },
    tags: ['AI', 'LLM', 'MCP', 'Agents', 'Open Source'],
    spaces: [
      { key: 'engineering', name: 'Engineering', emoji: '⚙️', skills: ['Development', 'Product'], match: ['hanzoai/', 'hanzo-'] },
      { key: 'research', name: 'AI & Research', emoji: '🧠', skills: ['Research', 'Machine Learning'] },
      { key: 'ecosystem', name: 'Ecosystem & Partnerships', emoji: '🤝', skills: ['Partnerships', 'Business Development'] },
      { key: 'community', name: 'Community & Social', emoji: '💬', skills: ['Community', 'Marketing'] },
      { key: 'content', name: 'Content Creation', emoji: '🎬', skills: ['Writing', 'Design'] },
      { key: 'governance', name: 'Governance', emoji: '🏛️', skills: ['Legal', 'Operations'] },
    ],
    iam: { issuer: 'https://hanzo.id', clientId: 'hanzo-work' },
    rpcUrl: 'https://api.hanzo.network/v1/bc/C/rpc',
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
