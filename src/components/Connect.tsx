import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ORG } from '../config';
import { short } from '../format';
import {
  iamConfig,
  loginOidc,
  loginWallet,
  logout,
  onOpenConnect,
  openConnect,
  useAuth,
  type AuthMethod,
} from '../auth';
import { Avatar, PrimaryButton, IconGithub, IconDiscord, IconWallet, IconChevronDown, IconX, IconExternal } from '../ui';

// The ONE Connect surface. `ConnectButton` is the trigger on every chrome
// (desktop Topbar + mobile bar): it shows "Connect" when signed out and the
// connected identity (avatar + handle/address) when signed in. `ConnectSheet`
// is the method picker — a bottom-sheet on mobile, centred modal on desktop
// (same pattern as the ⌘K palette), mounted ONCE in App and opened via the
// global `openConnect()` signal so every affordance is DRY.

type Method = {
  id: AuthMethod;
  label: string;
  hint: string;
  icon: ReactNode;
  run: () => Promise<void> | void;
};

// The method list is derived from the brand's IAM config, so a brand that hasn't
// been wired shows none (the sheet then offers the social fallback instead).
function methods(): Method[] {
  const i = iamConfig();
  if (!i) return [];
  const list: Method[] = [
    { id: 'github', label: 'Continue with GitHub', hint: 'Bounties are GitHub-tied', icon: <IconGithub className="h-5 w-5" />, run: () => loginOidc('github') },
    { id: 'discord', label: 'Continue with Discord', hint: 'Roles & private Spaces', icon: <IconDiscord className="h-5 w-5 text-[#5865F2]" />, run: () => loginOidc('discord') },
    { id: 'phantom', label: 'Connect Phantom', hint: 'Sign in with your wallet', icon: <IconWallet className="h-5 w-5 text-[#ab9ff2]" />, run: () => loginWallet('phantom') },
  ];
  if (i.walletConnectProjectId) {
    list.push({ id: 'walletconnect', label: 'WalletConnect', hint: 'Any WC-compatible wallet', icon: <IconWallet className="h-5 w-5 text-sky-400" />, run: () => loginWallet('walletconnect') });
  }
  return list;
}

export function ConnectSheet({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ms = methods();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const activate = async (m: Method) => {
    setError(null);
    setBusy(m.id);
    try {
      await m.run(); // OIDC methods navigate away; wallet methods resolve/throw here
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-start sm:px-4 sm:pt-28" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[var(--surface)] shadow-2xl ring-1 ring-inset ring-white/10 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-100">Connect to {ORG.workspace}</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Sign in through {ORG.workspace} ID to claim bounties.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-300" aria-label="Close">
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-4">
          {ms.length === 0 && (
            // Brand not yet wired to IAM — never a dead surface: offer the socials.
            <div className="flex flex-col gap-2">
              {ORG.social.discord && (
                <a href={ORG.social.discord} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-neutral-100 ring-1 ring-inset ring-white/10 hover:bg-white/10">
                  <IconDiscord className="h-5 w-5 text-[#5865F2]" /> Join the Discord <IconExternal className="ml-auto h-4 w-4 text-neutral-500" />
                </a>
              )}
              {ORG.social.website && (
                <a href={ORG.social.website} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-neutral-100 ring-1 ring-inset ring-white/10 hover:bg-white/10">
                  <IconExternal className="h-5 w-5 text-neutral-400" /> Visit {ORG.workspace}
                </a>
              )}
            </div>
          )}

          {ms.map((m) => (
            <button
              key={m.id}
              onClick={() => activate(m)}
              disabled={busy !== null}
              className="flex min-h-[52px] items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/20 ring-1 ring-inset ring-white/10">{m.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-100">{m.label}</span>
                <span className="block truncate text-xs text-neutral-500">{m.hint}</span>
              </span>
              {busy === m.id && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-600" style={{ borderTopColor: 'var(--brand)' }} />}
            </button>
          ))}

          {error && <p className="px-1 pt-1 text-xs text-amber-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// SheetHost mounts the sheet once and opens it on the global signal. Rendered in App.
export function ConnectSheetHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => onOpenConnect(() => setOpen(true)), []);
  if (!open) return null;
  return <ConnectSheet onClose={() => setOpen(false)} />;
}

// The connected-identity chip + Disconnect popover.
function IdentityMenu() {
  const session = useAuth();
  const [open, setOpen] = useState(false);
  if (!session) return null;
  const label = session.address ? short(session.address) : session.name;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-sm text-neutral-200 ring-1 ring-inset ring-white/12 hover:bg-white/10"
      >
        {session.avatar ? (
          <img src={session.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : session.address ? (
          <Avatar addr={session.address} size={20} />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
            {session.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="max-w-[8rem] truncate font-medium">{label}</span>
        <IconChevronDown className="h-3.5 w-3.5 text-neutral-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg bg-[var(--surface-2)] py-1 shadow-xl ring-1 ring-inset ring-white/10">
            <div className="truncate px-3 py-1.5 text-xs text-neutral-500" title={session.name}>{session.name}</div>
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// The trigger used across chromes: identity when signed in, else "Connect".
export function ConnectButton() {
  const session = useAuth();
  if (session) return <IdentityMenu />;
  return <PrimaryButton onClick={openConnect}>Connect</PrimaryButton>;
}
