import type { ReactNode } from 'react';
import { ORG } from '../config';
import { useRoute, navigate } from '../router';
import type { Route } from '../router';
import {
  BrandMark,
  BrandLogo,
  IconPlus,
  IconGrid,
  IconBulb,
  IconTrophy,
  IconBoard,
  IconChevronsLeft,
  IconQuestion,
  IconMail,
  IconDoc,
} from '../ui';

// The far-left 64px icon rail — a SEPARATE column beside the 256px sidebar
// (canonical Dework). Home + org-switcher "+". Both collapse into the mobile drawer.
export function IconRail({ onNavigate }: { onNavigate?: () => void }) {
  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };
  return (
    <div
      className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-[var(--border)] bg-[var(--rail)] pt-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <button onClick={() => go('/')} className="flex h-10 w-10 items-center justify-center" title="Home" aria-label={`${ORG.workspace} home`}>
        <BrandMark size={40} className="shadow-sm" />
      </button>
      <button onClick={() => go('/explore')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-neutral-400 ring-1 ring-inset ring-white/8 hover:text-neutral-200" title="Browse bounties across all DAOs">
        <IconPlus className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
        active ? 'bg-white/8 font-medium text-neutral-100' : 'text-[color:var(--muted)] hover:bg-white/5 hover:text-neutral-200'
      }`}
    >
      <span className={active ? 'text-neutral-200' : 'text-neutral-500'}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function isSpace(route: Route, key: string): boolean {
  return route.view === 'space' && route.spaceKey === key;
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">{children}</div>
);

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRoute();
  const spaces = ORG.spaces.filter((s) => !s.project);
  const projects = ORG.spaces.filter((s) => s.project);
  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--rail)]">
      {/* workspace */}
      <button onClick={() => go('/')} className="mx-3 mt-3 flex items-center gap-2.5 rounded-md px-1 py-1 text-left hover:bg-white/5" style={{ marginTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <BrandLogo className="flex-1" />
        <IconChevronsLeft className="h-4 w-4 text-neutral-600" />
      </button>

      {/* New Suggestion */}
      <div className="px-3 pt-3">
        <button onClick={() => go('/suggestions?new=1')} className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-md bg-white/6 px-3 py-1.5 text-sm font-medium text-neutral-200 ring-1 ring-inset ring-white/10 hover:bg-white/10">
          <IconPlus className="h-4 w-4" /> New Suggestion
        </button>
      </div>

      {/* primary nav */}
      <nav className="mt-3 flex flex-col gap-0.5 px-3">
        <NavItem active={route.view === 'overview'} icon={<IconGrid className="h-4 w-4" />} label="Overview" onClick={() => go('/')} />
        <NavItem active={route.view === 'suggestions'} icon={<IconBulb className="h-4 w-4" />} label="Community Suggestions" onClick={() => go('/suggestions')} />
        <NavItem active={route.view === 'leaderboards'} icon={<IconTrophy className="h-4 w-4" />} label="Leaderboards" onClick={() => go('/leaderboards')} />
        <NavItem active={route.view === 'board'} icon={<IconBoard className="h-4 w-4" />} label="Combined Board" onClick={() => go('/board')} />
      </nav>

      {/* bounties (spaces) */}
      <div className="mt-5 px-3">
        <Label>Bounties</Label>
        <nav className="flex flex-col gap-0.5">
          {spaces.map((s) => (
            <NavItem key={s.key} active={isSpace(route, s.key)} icon={<span className="text-[15px] leading-none">{s.emoji}</span>} label={s.name} onClick={() => go(`/space/${s.key}/board`)} />
          ))}
        </nav>
      </div>

      {projects.length > 0 && (
        <div className="mt-5 px-3">
          <Label>Projects Based Bounties</Label>
          <nav className="flex flex-col gap-0.5">
            {projects.map((s) => (
              <NavItem key={s.key} active={isSpace(route, s.key)} icon={<span className="text-[15px] leading-none">{s.emoji}</span>} label={s.name} onClick={() => go(`/space/${s.key}/board`)} />
            ))}
          </nav>
        </div>
      )}

      {/* footer */}
      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-4 pt-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
        {[
          { icon: <IconQuestion className="h-4 w-4" />, label: 'Ask a question' },
          { icon: <IconMail className="h-4 w-4" />, label: 'Give us feedback' },
          { icon: <IconDoc className="h-4 w-4" />, label: 'Read our docs' },
        ].map((f) => (
          <a key={f.label} href={ORG.social.website ?? '#'} target="_blank" rel="noreferrer noopener" className="flex min-h-[40px] items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-white/5 hover:text-neutral-300">
            {f.icon} {f.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
