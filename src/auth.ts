import { useSyncExternalStore } from 'react';
import { getAddress } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { ORG, BRAND_KEY } from './config';
import { short } from './format';

// The ONE auth surface for the board. Every login method resolves through the
// brand's Hanzo IAM tenant (OIDC issuer in brands.ts `iam`) — never per-app auth,
// never cross-brand. Two upstream shapes converge on ONE token exchange:
//   • Discord / GitHub — OAuth2 authorization-code + PKCE (public SPA client, no
//     secret): a full-page redirect to the brand IAM `/oauth/authorize`, back to
//     `/auth/callback` with a `code`.
//   • Phantom / WalletConnect — SIWE (EIP-4361) signed against an IAM-minted
//     `web3/nonce`, POSTed to `web3/verify`, which binds the wallet to an IAM
//     identity (WalletLink) and returns the SAME authorization `code`.
// `exchangeCode` then swaps the code for tokens (PKCE, no secret) + userinfo and
// persists one Session. White-label: issuer/clientId come from `brand.iam`, so a
// Zoo build only ever talks to Zoo's IAM tenant.

// EIP-1193 injected wallets (Phantom multichain, MetaMask, Rabby, …).
type Eip1193 = { request(a: { method: string; params?: unknown[] }): Promise<unknown> };
declare global {
  interface Window {
    ethereum?: Eip1193 & { isPhantom?: boolean };
    phantom?: { ethereum?: Eip1193 };
  }
}

export type AuthMethod = 'github' | 'discord' | 'phantom' | 'walletconnect';
export type WalletKind = 'phantom' | 'walletconnect';

export type Session = {
  method: AuthMethod;
  sub: string; // IAM subject (stable user id)
  name: string; // display handle
  avatar?: string; // avatar URL
  address?: string; // linked wallet (wallet methods only)
  expiresAt: number; // epoch ms
};

export type IamConfig = { issuer: string; clientId: string; walletConnectProjectId?: string };

// The brand's IAM tenant, or null when a brand hasn't been wired yet (the Connect
// surface then falls back to the org's social links so no control is ever dead).
export function iamConfig(): IamConfig | null {
  return ORG.iam ?? null;
}

// All endpoints are host-derived from the per-brand issuer (IAM resolves the org
// from the host), so there is one value to set per brand. Canonical /v1 paths.
function endpoints(i: IamConfig) {
  const b = `${i.issuer}/v1/iam`;
  return {
    authorize: `${b}/oauth/authorize`,
    token: `${b}/oauth/token`,
    userinfo: `${b}/oauth/userinfo`,
    logout: `${b}/oauth/logout`,
    web3Nonce: `${b}/web3/nonce`,
    web3Verify: `${b}/web3/verify`,
  };
}

const SCOPE = 'openid profile email';
const SESSION_KEY = `work:session:${BRAND_KEY}`;
const PKCE_KEY = `work:pkce:${BRAND_KEY}`; // transient (sessionStorage)

const redirectUri = () => `${window.location.origin}/auth/callback`;

// ---- Session store: localStorage + a cached snapshot so useSyncExternalStore
// gets a referentially-stable value between renders (re-parse only on change). ----
let cached: Session | null | undefined;
const listeners = new Set<() => void>();

function load(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s || typeof s.expiresAt !== 'number' || s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function snapshot(): Session | null {
  if (cached === undefined) cached = load();
  return cached;
}

function emit() {
  for (const l of listeners) l();
}

function persist(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  cached = s;
  emit();
}

export function getSession(): Session | null {
  return snapshot();
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  cached = null;
  emit();
}

// React binding — one hook every surface reads (Topbar, mobile bar, palette).
export function useAuth(): Session | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) {
      cached = load();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ---- Global "open the Connect sheet" signal (DRY: the sheet lives once in App,
// every Connect affordance dispatches this). ----
const OPEN_EVENT = 'work:connect';
export function openConnect(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}
export function onOpenConnect(cb: () => void): () => void {
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
}

// ---- PKCE (S256) via WebCrypto — no dependency. ----
function randomString(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return b64url(a.buffer);
}

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function pkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomString(32);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(digest) };
}

type PkceState = { verifier: string; state: string; method: AuthMethod };

function stashPkce(s: PkceState) {
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(s));
}
function takePkce(): PkceState | null {
  const raw = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  return raw ? (JSON.parse(raw) as PkceState) : null;
}

// ---- OIDC: Discord / GitHub (authorization-code + PKCE) ----
// Full-page redirect to the brand IAM login, which presents the enabled social
// providers (GitHub live today; Discord once its upstream OAuth app is wired).
export async function loginOidc(method: 'github' | 'discord'): Promise<void> {
  const i = iamConfig();
  if (!i) return;
  const { verifier, challenge } = await pkce();
  const state = randomString(16);
  stashPkce({ verifier, state, method });
  const q = new URLSearchParams({
    client_id: i.clientId,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: redirectUri(),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    // Provider hint — IAM renders the brand login page; a supporting IAM jumps
    // straight to this provider, otherwise the user picks it there. Harmless if
    // ignored, so the button is "Continue with <provider>" either way.
    provider: method === 'github' ? 'provider-github' : 'provider-discord',
  });
  window.location.href = `${endpoints(i).authorize}?${q}`;
}

// ---- Wallet: Phantom / WalletConnect (SIWE → web3/verify → code) ----
async function eip1193(kind: WalletKind): Promise<Eip1193> {
  if (kind === 'phantom') {
    const p = window.phantom?.ethereum ?? (window.ethereum?.isPhantom ? window.ethereum : undefined);
    if (!p) throw new Error('Phantom wallet not found — install the Phantom extension.');
    return p;
  }
  // WalletConnect needs an upstream projectId (see brands.ts iam.walletConnectProjectId)
  // and its provider module; gated so the button only appears when configured.
  throw new Error('WalletConnect is not configured for this brand yet.');
}

export async function loginWallet(kind: WalletKind): Promise<void> {
  const i = iamConfig();
  if (!i) throw new Error('IAM is not configured for this brand.');
  const provider = await eip1193(kind);

  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  const address = getAddress(accounts[0]);

  // 1. IAM mints a single-use CAIP-122 challenge bound to its own host (phishing
  // guard: the wallet signs the IAM domain, not ours).
  const nonceRes = await fetch(`${endpoints(i).web3Nonce}?chain=evm&address=${address}`);
  const nonceJson = (await nonceRes.json()) as { status?: string; msg?: string; data?: Web3Challenge } & Web3Challenge;
  if (nonceJson.status && nonceJson.status !== 'ok') throw new Error(nonceJson.msg || 'web3 nonce failed');
  const ch = nonceJson.data ?? nonceJson;

  // 2. Build the EIP-4361 message from the server challenge (unchanged fields).
  const message = createSiweMessage({
    domain: ch.domain,
    address,
    uri: ch.uri,
    version: '1',
    chainId: ORG.chainId,
    nonce: ch.nonce,
    issuedAt: ch.issuedAt ? new Date(ch.issuedAt) : undefined,
    ...(ch.statement ? { statement: ch.statement } : {}),
    ...(ch.expirationTime ? { expirationTime: new Date(ch.expirationTime) } : {}),
  });

  // 3. personal_sign.
  const signature = (await provider.request({ method: 'personal_sign', params: [message, address] })) as string;

  // 4. Verify → authorization code (carrying the same PKCE the callback expects).
  const { verifier, challenge } = await pkce();
  const state = randomString(16);
  stashPkce({ verifier, state, method: kind });
  const verifyRes = await fetch(endpoints(i).web3Verify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      application: i.clientId,
      method: 'login',
      chain: 'evm',
      scheme: 'evm',
      address,
      message,
      signature,
      type: 'code',
      clientId: i.clientId,
      redirectUri: redirectUri(),
      state,
      scope: SCOPE,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
    }),
  });
  const verifyJson = (await verifyRes.json()) as { status?: string; msg?: string; data?: string };
  if (verifyJson.status !== 'ok' || !verifyJson.data) throw new Error(verifyJson.msg || 'wallet verification failed');
  await exchangeCode(verifyJson.data, verifier, kind, address);
}

type Web3Challenge = {
  domain: string;
  uri: string;
  nonce: string;
  statement?: string;
  issuedAt?: string;
  expirationTime?: string;
};

// ---- Shared: authorization code → tokens (PKCE, no secret) → userinfo → session ----
async function exchangeCode(code: string, verifier: string, method: AuthMethod, address?: string): Promise<void> {
  const i = iamConfig();
  if (!i) throw new Error('IAM is not configured for this brand.');
  const ep = endpoints(i);

  const tokenRes = await fetch(ep.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: i.clientId,
      code_verifier: verifier,
    }),
  });
  const tok = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!tok.access_token) throw new Error(tok.error_description || tok.error || 'token exchange failed');

  const infoRes = await fetch(ep.userinfo, { headers: { Authorization: `Bearer ${tok.access_token}` } });
  const info = (await infoRes.json()) as {
    sub?: string;
    name?: string;
    preferred_username?: string;
    email?: string;
    picture?: string;
  };

  persist({
    method,
    sub: info.sub ?? address ?? 'unknown',
    name: info.preferred_username || info.name || info.email || (address ? short(address) : (info.sub ?? 'Member')),
    avatar: info.picture,
    address,
    expiresAt: Date.now() + (tok.expires_in ? tok.expires_in * 1000 : 3600_000),
  });
}

// ---- OAuth callback (invoked from main.tsx on /auth/callback) ----
export async function handleAuthCallback(): Promise<void> {
  const q = new URLSearchParams(window.location.search);
  const saved = takePkce();
  try {
    const err = q.get('error');
    if (err) throw new Error(q.get('error_description') || err);
    const code = q.get('code');
    const state = q.get('state');
    if (!code || !saved || state !== saved.state) throw new Error('invalid OAuth callback');
    await exchangeCode(code, saved.verifier, saved.method);
  } catch (e) {
    console.error('[auth] callback failed:', e);
  } finally {
    // Drop the code/state from the URL and return to the board.
    window.location.replace('/');
  }
}

export function isAuthCallback(): boolean {
  return window.location.pathname === '/auth/callback';
}
