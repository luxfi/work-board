import { useMemo } from 'react';
import { ORG } from '../config';
import type { Workspace } from '../chain';
import type { Task } from '../types';
import { rollupBySpace } from '../tasks';
import { isZero, short, usdFromWei, formatDuration } from '../format';
import { navigate } from '../router';
import { iamConfig, loginOidc } from '../auth';
import {
  AvatarStack,
  StatPill,
  IconClock,
  IconDollar,
  IconDiscord,
  IconTwitter,
  IconLink,
  IconInfo,
  IconUsersPlus,
} from '../ui';
import type { Space } from '../brands';
import type { SpaceRollup } from '../tasks';

function OrgHeader({ ws }: { ws: Workspace }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {ORG.workspace.charAt(0)}
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50">{ORG.workspace}</h1>
          <p className="mt-0.5 text-sm text-neutral-400">{ORG.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatPill icon={<IconClock className="h-3.5 w-3.5" />}>
              Time to payment: <span className="font-semibold text-neutral-100">{formatDuration(ws.stats.avgTimeToPaymentSec)}</span>
            </StatPill>
            <StatPill icon={<IconDollar className="h-3.5 w-3.5" />}>
              Total paid: <span className="font-semibold text-neutral-100">{usdFromWei(ws.stats.totalPaidWei, ORG.usdPerNative)}</span>
            </StatPill>
            <div className="flex items-center gap-1 pl-1">
              {ORG.social.discord && (
                <a href={ORG.social.discord} target="_blank" rel="noreferrer noopener" className="rounded p-1.5 text-neutral-400 hover:bg-white/5 hover:text-neutral-200" title="Discord">
                  <IconDiscord className="h-4 w-4" />
                </a>
              )}
              {ORG.social.twitter && (
                <a href={ORG.social.twitter} target="_blank" rel="noreferrer noopener" className="rounded p-1.5 text-neutral-400 hover:bg-white/5 hover:text-neutral-200" title="Twitter / X">
                  <IconTwitter className="h-4 w-4" />
                </a>
              )}
              {ORG.social.website && (
                <a href={ORG.social.website} target="_blank" rel="noreferrer noopener" className="rounded p-1.5 text-neutral-400 hover:bg-white/5 hover:text-neutral-200" title="Website">
                  <IconLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscordBanner() {
  // "Connect with Discord" starts Discord OAuth through the brand's Hanzo IAM
  // tenant when wired; until then it falls back to the org's Discord invite so
  // the CTA is never dead.
  const viaIam = iamConfig() !== null;
  const btnCls = 'mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90';
  return (
    <div className="rounded-xl bg-indigo-500/8 p-4 ring-1 ring-inset ring-indigo-400/20">
      <div className="flex items-start gap-3">
        <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
        <div className="flex-1">
          <p className="text-sm text-neutral-200">
            The following Discord roles give you access to permissions and private Spaces in this organization. Connect with
            Discord to get access.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-white/8 px-2 py-1 text-xs text-neutral-300 ring-1 ring-inset ring-white/10">
              <IconDiscord className="h-3.5 w-3.5 text-indigo-300" /> {ORG.workspace.toLowerCase()} member
            </span>
          </div>
          {viaIam ? (
            <button onClick={() => loginOidc('discord')} className={btnCls}>
              <IconDiscord className="h-4 w-4" /> Connect with Discord
            </button>
          ) : (
            <a href={ORG.social.discord ?? '#'} target="_blank" rel="noreferrer noopener" className={btnCls}>
              <IconDiscord className="h-4 w-4" /> Connect with Discord
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// peaq-style category card: emoji tile + name + "N open tasks · N contributors".
// Uniform structure so a grid of them reads as one symmetrical block.
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

function SpaceCard({ space, rollup }: { space: Space; rollup: SpaceRollup }) {
  return (
    <button
      onClick={() => navigate(`/space/${space.key}/board`)}
      className="flex items-start gap-3 rounded-xl bg-[var(--surface)] p-4 text-left ring-1 ring-inset ring-white/6 transition-colors hover:bg-[var(--hover)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 text-2xl leading-none ring-1 ring-inset ring-white/8" aria-hidden>
        {space.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-neutral-100">{space.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-500">
          <span className="tabular-nums">{plural(rollup.open, 'open task')}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{plural(rollup.contributors, 'contributor')}</span>
        </div>
      </div>
    </button>
  );
}

function RightRail({ ws, tasks }: { ws: Workspace; tasks: Task[] }) {
  const contributors = useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];
    for (const t of tasks) {
      for (const a of [t.worker, t.funder, t.approver]) {
        const k = a.toLowerCase();
        if (!isZero(a) && !set.has(k)) {
          set.add(k);
          list.push(a);
        }
      }
    }
    return list;
  }, [tasks]);

  const admins = [ORG.addresses.owner, ...(ORG.addresses.governor ? [ORG.addresses.governor] : [])];

  return (
    <div className="flex w-full shrink-0 flex-col gap-6 lg:w-72">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-neutral-200">About</h3>
        <p className="text-sm text-neutral-400">{ORG.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ORG.tags.map((t) => (
            <span key={t} className="rounded bg-white/6 px-2 py-0.5 text-xs text-neutral-300 ring-1 ring-inset ring-white/8">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 text-sm font-semibold text-neutral-200">
          Contributors <span className="text-neutral-500">{ws.stats.contributorCount}</span>
        </h3>
        {contributors.length > 0 ? (
          <AvatarStack addrs={contributors} max={8} />
        ) : (
          <p className="text-xs text-neutral-600">No contributors yet.</p>
        )}
        <button className="mt-3 flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 ring-1 ring-inset ring-white/8 hover:bg-white/10">
          <IconUsersPlus className="h-3.5 w-3.5" /> Invite Contributors
        </button>
      </section>

      <section>
        <h3 className="mb-2.5 text-sm font-semibold text-neutral-200">Admins</h3>
        <div className="flex items-center gap-2">
          <AvatarStack addrs={admins} max={4} />
          <span className="text-xs text-neutral-500" title={ORG.addresses.owner}>
            {ORG.ownerLabel} · {short(ORG.addresses.owner)}
          </span>
        </div>
      </section>
    </div>
  );
}

export function Overview({ ws, tasks }: { ws: Workspace; tasks: Task[] }) {
  const rollups = useMemo(() => rollupBySpace(tasks, ORG.spaces), [tasks]);
  const bountySpaces = ORG.spaces.filter((s) => !s.project);
  const projectSpaces = ORG.spaces.filter((s) => s.project);
  const empty = { open: 0, contributors: 0, total: 0 };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <OrgHeader ws={ws} />
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <DiscordBanner />

          <h2 className="mb-3 mt-7 text-lg font-semibold text-neutral-100">Bounties</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bountySpaces.map((s) => (
              <SpaceCard key={s.key} space={s} rollup={rollups.get(s.key) ?? empty} />
            ))}
          </div>

          {projectSpaces.length > 0 && (
            <>
              <h2 className="mb-3 mt-7 text-lg font-semibold text-neutral-100">Projects based bounties</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {projectSpaces.map((s) => (
                  <SpaceCard key={s.key} space={s} rollup={rollups.get(s.key) ?? empty} />
                ))}
              </div>
            </>
          )}
        </div>

        <RightRail ws={ws} tasks={tasks} />
      </div>
    </div>
  );
}
