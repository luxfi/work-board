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
