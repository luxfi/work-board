import { formatEther } from 'viem';
import type { Address } from 'viem';
import { ZERO_ADDRESS, NATIVE_SYMBOL } from './config';

export function isZero(addr: string): boolean {
  return addr.toLowerCase() === ZERO_ADDRESS;
}

// Truncate an address: 0x1234…abcd
export function short(addr: string, head = 6, tail = 4): string {
  if (!addr || addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

// Reward/stake are stored in wei; render with the native symbol or a short token addr.
export function tokenLabel(token: Address): string {
  return isZero(token) ? NATIVE_SYMBOL.toLowerCase() : short(token);
}

export function formatAmount(value: bigint): string {
  return formatEther(value);
}

// owner/repo#n -> GitHub issue link; a bare URL -> itself; anything else -> plain text.
const GH_REF = /^([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)#(\d+)$/;

export function refToLink(ref: string): { href?: string; text: string } {
  const t = ref.trim();
  if (!t) return { text: '' };
  if (/^https?:\/\//i.test(t)) return { href: t, text: t };
  const m = t.match(GH_REF);
  if (m) return { href: `https://github.com/${m[1]}/issues/${m[2]}`, text: t };
  return { text: t };
}

// "$4,036.88" from a wei native amount and a native→USD rate (header stat).
export function usdFromWei(wei: bigint, usdPerNative: number): string {
  const native = Number(formatEther(wei));
  const usd = native * usdPerNative;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// "9.0 days" / "3.5 hours" / "12 min" from a duration in seconds (header stat).
export function formatDuration(sec: number): string {
  if (sec <= 0) return '—';
  const days = sec / 86400;
  if (days >= 1) return `${days.toFixed(1)} days`;
  const hours = sec / 3600;
  if (hours >= 1) return `${hours.toFixed(1)} hours`;
  return `${Math.max(1, Math.round(sec / 60))} min`;
}

// Absolute timestamp like "May 21, 2026 1:54 PM" (activity log).
export function absDate(unixSec: number): string {
  if (!unixSec) return '';
  return new Date(unixSec * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Relative age like "19 days ago" / "3 hours ago" from unix seconds.
export function timeAgo(unixSec: number): string {
  if (!unixSec) return '';
  const diff = Date.now() / 1000 - unixSec;
  const steps: [number, number, string][] = [
    [60, 1, 'second'],
    [3600, 60, 'minute'],
    [86400, 3600, 'hour'],
    [2592000, 86400, 'day'],
    [31536000, 2592000, 'month'],
    [Number.POSITIVE_INFINITY, 31536000, 'year'],
  ];
  for (const [limit, div, unit] of steps) {
    if (Math.abs(diff) < limit) {
      const n = Math.max(1, Math.floor(Math.abs(diff) / div));
      return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
    }
  }
  return '';
}

// Deterministic avatar for an address: a two-stop gradient + 2-char monogram.
// Same address → same colours everywhere (identity, not decoration).
export function addrGradient(addr: string): string {
  const h = hashAddr(addr);
  const a = h % 360;
  const b = (h * 7 + 90) % 360;
  return `linear-gradient(135deg, hsl(${a} 65% 45%), hsl(${b} 60% 35%))`;
}

export function avatarText(addr: string): string {
  return addr.slice(2, 4).toUpperCase();
}

function hashAddr(addr: string): number {
  let h = 0;
  for (let i = 2; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  return h;
}

// Compact relative time from a unix-seconds deadline. 0 => not set => ''.
export function relTime(unixSec: bigint): string {
  if (unixSec === 0n) return '';
  const diff = Number(unixSec) - Date.now() / 1000; // >0 future, <0 past
  const abs = Math.abs(diff);
  const steps: [limit: number, div: number, suffix: string][] = [
    [60, 1, 's'],
    [3600, 60, 'm'],
    [86400, 3600, 'h'],
    [2592000, 86400, 'd'],
    [31536000, 2592000, 'mo'],
    [Number.POSITIVE_INFINITY, 31536000, 'y'],
  ];
  let out = '0s';
  for (const [limit, div, suffix] of steps) {
    if (abs < limit) {
      out = `${Math.max(0, Math.floor(abs / div))}${suffix}`;
      break;
    }
  }
  return diff >= 0 ? `in ${out}` : `${out} ago`;
}
