import type { CSSProperties, ReactNode } from 'react';
// Used inside this file. The full set is re-exported under the Icon* names below.
import { Coins as IconCoins, DollarSign as IconDollar, Image as IconImage } from '@luxfi/ui/icons';
import { addrGradient, avatarText, tokenLabel } from './format';
import { skillMeta } from './skills';
import { formatReward } from './reward';
import type { NftMeta } from './reward';
import type { Reward } from './types';
import { NATIVE_SYMBOL, ORG, BRAND_KEY } from './config';
import { BRAND_LOGOS } from './brand-logos';

// Text fields = @luxfi/ui primitives (native <input>/<textarea> under the hood,
// bridging onChangeText<->onChange so keystrokes always round-trip). Re-exported
// here so every view reaches text inputs through the one ../ui primitive surface.
export { Input, Textarea } from '@luxfi/ui';

// ---- Brand accent ----
export const accent: CSSProperties = { backgroundColor: 'var(--brand)' };
export const accentText: CSSProperties = { color: 'var(--brand)' };

// ---- Brand identity (the ONE place the org's logo renders) ----
// BrandMark is the square mark: brand.logoMark (an image src / data URI) when the
// brand supplies one, else a letter tile on the accent. BrandLogo is the full
// sidebar lockup: brand.logo when supplied, else mark + workspace name. Both read
// the logo fields defensively (optional) — ae530aa6 supplies them; until then the
// letter tile / name stand in, and the image appears the moment the field lands.
export function BrandMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const mark = BRAND_LOGOS[BRAND_KEY].logoMark;
  const radius = Math.round(size * 0.28);
  if (mark) {
    return (
      <img
        src={mark}
        alt={ORG.workspace}
        width={size}
        height={size}
        style={{ borderRadius: radius }}
        className={`shrink-0 object-contain ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-bold leading-none text-white ${className}`}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: 'var(--brand)', fontSize: Math.round(size * 0.42) }}
    >
      {ORG.workspace.charAt(0)}
    </span>
  );
}

export function BrandLogo({ className = '' }: { className?: string }) {
  const logo = BRAND_LOGOS[BRAND_KEY].logo;
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      {logo ? (
        <img src={logo} alt={ORG.workspace} className="h-7 w-auto max-w-full object-contain object-left" />
      ) : (
        <>
          <BrandMark size={28} />
          <span className="truncate text-sm font-semibold text-neutral-100">{ORG.workspace}</span>
        </>
      )}
    </span>
  );
}

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
        <span key={a + i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: max - i }} className="rounded-full ring-2 ring-[var(--surface)]">
          <Avatar addr={a} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{ marginLeft: -8, width: size, height: size }}
          className="inline-flex items-center justify-center rounded-full bg-neutral-700 text-[10px] font-semibold text-neutral-200 ring-2 ring-[var(--surface)]"
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
          <IconImage className="h-4 w-4 text-neutral-400" aria-hidden />
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

// ---- Icons ----
//
// One Lux icon set: Lucide, as @hanzo/gui standardises on it, re-exported by
// @luxfi/ui/icons. What was here was a second set — ~37 glyphs hand-drawn
// inline at strokeWidth 1.7 (Lucide is 2), with IconHalfCircle painting a
// filled half-disc over an outline circle, so an "in progress" chip was duotone
// on a board where nothing else was. Names are unchanged, so no view moved.
//
// The three brand marks below stay hand-drawn: a logo is not a UI glyph, and no
// icon set is allowed to redraw someone's mark.
export {
  House as IconHome,
  Plus as IconPlus,
  LayoutGrid as IconGrid,
  Lightbulb as IconBulb,
  Trophy as IconTrophy,
  Kanban as IconBoard,
  List as IconList,
  Clock as IconClock,
  DollarSign as IconDollar,
  Link as IconLink,
  Search as IconSearch,
  ArrowUpDown as IconSort,
  Filter as IconFilter,
  CircleCheck as IconCheckCircle,
  Circle as IconCircle,
  CircleDashed as IconHalfCircle,
  Lock as IconLock,
  Bookmark as IconBookmark,
  ChevronDown as IconChevronDown,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  Info as IconInfo,
  X as IconX,
  Menu as IconMenu,
  Ellipsis as IconDots,
  ExternalLink as IconExternal,
  CircleHelp as IconQuestion,
  Mail as IconMail,
  FileText as IconDoc,
  Coins as IconCoins,
  UserPlus as IconUsersPlus,
  Zap as IconBolt,
  ShieldCheck as IconShield,
  Wallet as IconWallet,
} from '@luxfi/ui/icons';

type IconProps = { className?: string };

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
export const IconGithub = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.2-3.37-1.2-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
);
