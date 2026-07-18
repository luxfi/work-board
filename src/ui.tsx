import type { CSSProperties, ReactNode } from 'react';
import { addrGradient, avatarText, tokenLabel } from './format';
import { skillMeta } from './skills';
import { formatReward } from './reward';
import type { NftMeta } from './reward';
import type { Reward } from './types';
import { NATIVE_SYMBOL } from './config';

// ---- Brand accent ----
export const accent: CSSProperties = { backgroundColor: 'var(--brand)' };
export const accentText: CSSProperties = { color: 'var(--brand)' };

// ---- Avatar (deterministic identity for an address) ----
export function Avatar({ addr, size = 24, title }: { addr: string; size?: number; title?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white/90 ring-1 ring-inset ring-white/10"
      style={{ width: size, height: size, background: addrGradient(addr), fontSize: Math.max(8, size * 0.36) }}
      title={title ?? addr}
    >
      {avatarText(addr)}
    </span>
  );
}

export function AvatarStack({ addrs, max = 7, size = 26 }: { addrs: string[]; max?: number; size?: number }) {
  const shown = addrs.slice(0, max);
  const extra = addrs.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <span key={a + i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: max - i }} className="rounded-full ring-2 ring-[#17171a]">
          <Avatar addr={a} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{ marginLeft: -8, width: size, height: size }}
          className="inline-flex items-center justify-center rounded-full bg-neutral-700 text-[10px] font-semibold text-neutral-200 ring-2 ring-[#17171a]"
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

// ---- Skill tag (emoji + coloured pill) ----
export function SkillTag({ skill, compact = false }: { skill: string; compact?: boolean }) {
  const m = skillMeta(skill);
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ring-1 ring-inset ${m.cls}`}>
      <span aria-hidden>{m.emoji}</span>
      {!compact && <span>{skill}</span>}
    </span>
  );
}

// ---- Reward badge (native / ERC-20 / NFT) ----
export function RewardBadge({ reward, meta, size = 'sm' }: { reward: Reward; meta?: NftMeta; size?: 'sm' | 'lg' }) {
  const d = formatReward(reward, NATIVE_SYMBOL, tokenLabel, meta);
  const big = size === 'lg';
  return (
    <span className={`inline-flex items-center gap-1.5 ${big ? 'text-base' : 'text-xs'}`}>
      {d.isNft ? (
        d.image ? (
          <img src={d.image} alt="" className="h-4 w-4 rounded object-cover ring-1 ring-white/10" />
        ) : (
          <span aria-hidden>🖼️</span>
        )
      ) : (
        <IconCoins className="h-3.5 w-3.5 text-emerald-400" />
      )}
      <span className={`font-semibold tabular-nums ${d.isNft ? 'text-fuchsia-200' : 'text-emerald-300'}`}>{d.primary}</span>
    </span>
  );
}

// ---- Open-to badge ----
export function OpenToBadge({ openTo }: { openTo: 'bids' | 'applications' | null }) {
  if (!openTo) return null;
  const label = openTo === 'bids' ? 'Open to Bids' : 'Open to Applications';
  const cls =
    openTo === 'bids'
      ? 'bg-sky-500/10 text-sky-300 ring-sky-500/25'
      : 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/25';
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ring-1 ring-inset ${cls}`}>
      <IconDollar className="h-3 w-3" />
      {label}
    </span>
  );
}

// ---- Buttons ----
export function PrimaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      style={accent}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-200 ring-1 ring-inset ring-white/12 transition-colors hover:bg-white/5 ${className}`}
    >
      {children}
    </button>
  );
}

// ---- Stat pill (header: Time to payment / Total paid) ----
export function StatPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-neutral-300 ring-1 ring-inset ring-white/8">
      <span className="text-neutral-400">{icon}</span>
      {children}
    </span>
  );
}

// ---- Icons (inline SVG, stroke=currentColor) ----
type IconProps = { className?: string };
const S = 'none';
function svg(path: ReactNode, vb = '0 0 24 24') {
  return function Icon({ className = 'h-4 w-4' }: IconProps) {
    return (
      <svg viewBox={vb} fill={S} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        {path}
      </svg>
    );
  };
}

export const IconHome = svg(<path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />);
export const IconPlus = svg(<path d="M12 5v14M5 12h14" />);
export const IconGrid = svg(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>);
export const IconBulb = svg(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></>);
export const IconTrophy = svg(<><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 21h6M10 17v4M14 17v4" /></>);
export const IconBoard = svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>);
export const IconList = svg(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />);
export const IconClock = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconDollar = svg(<><path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5 9.2 9.5 12 9.5s5 1.1 5 3-2.2 3-5 3-5-1.1-5-3" /></>);
export const IconLink = svg(<><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>);
export const IconSearch = svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconSort = svg(<path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l-3 3M17 4l3 3" />);
export const IconFilter = svg(<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />);
export const IconCheckCircle = svg(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>);
export const IconCircle = svg(<circle cx="12" cy="12" r="8.5" />);
export const IconHalfCircle = svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" /></>);
export const IconLock = svg(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const IconBookmark = svg(<path d="M6 4h12v16l-6-4-6 4V4Z" />);
export const IconChevronDown = svg(<path d="m6 9 6 6 6-6" />);
export const IconChevronRight = svg(<path d="m9 6 6 6-6 6" />);
export const IconChevronsLeft = svg(<path d="m11 7-5 5 5 5M18 7l-5 5 5 5" />);
export const IconInfo = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);
export const IconX = svg(<path d="M6 6l12 12M18 6 6 18" />);
export const IconDots = svg(<path d="M5 12h.01M12 12h.01M19 12h.01" />);
export const IconExternal = svg(<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></>);
export const IconQuestion = svg(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01" /></>);
export const IconMail = svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
export const IconDoc = svg(<><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4" /></>);
export const IconCoins = svg(<><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3" /><path d="M15 11c2.8.2 6 1.4 6 3.5S17.4 18 15 18M9 15v2c0 1.7 2.7 3 6 3" /></>);
export const IconUsersPlus = svg(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M18 8v6M15 11h6" /></>);
export const IconBolt = svg(<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />);
export const IconShield = svg(<><path d="M12 3 5 6v5c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>);
export const IconDiscord = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20 5.3A18 18 0 0 0 15.6 4l-.3.5A13 13 0 0 1 12 4a13 13 0 0 1-3.3.5L8.4 4A18 18 0 0 0 4 5.3C1.7 8.7 1.1 12 1.4 15.3A18 18 0 0 0 6.9 18l.7-1c-.6-.2-1.2-.5-1.7-.9l.4-.3a12.7 12.7 0 0 0 11.4 0l.4.3c-.5.4-1.1.7-1.7.9l.7 1a18 18 0 0 0 5.5-2.7c.4-3.8-.6-7.1-2.7-10ZM8.7 13.5c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Zm6.6 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Z" />
  </svg>
);
export const IconTwitter = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8L2 3h6.2l4.3 5.6L17.5 3Zm-2.1 16h1.7L8.7 4.8H6.9L15.4 19Z" />
  </svg>
);
