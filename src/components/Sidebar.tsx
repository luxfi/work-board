import type { ReactNode } from 'react';
import { ORG } from '../config';
import { useRoute, navigate } from '../router';
import type { Route } from '../router';
import {
  IconHome,
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
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
        active ? 'bg-white/8 font-medium text-neutral-100' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
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

export function Sidebar() {
  const route = useRoute();
  const spaces = ORG.spaces.filter((s) => !s.project);
  const projects = ORG.spaces.filter((s) => s.project);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#26262b] bg-[#141417]">
      {/* org switcher rail */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <button
          onClick={() => navigate('/')}
          style={{ backgroundColor: 'var(--brand)' }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
          title="Home"
        >
          <IconHome className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => navigate('/explore')}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-neutral-400 ring-1 ring-inset ring-white/8 hover:text-neutral-200"
          title="Browse bounties across all DAOs"
        >
          <IconPlus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* workspace */}
      <button onClick={() => navigate('/')} className="mx-3 mt-3 flex items-center gap-2.5 rounded-md px-1 py-1 text-left hover:bg-white/5">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {ORG.workspace.charAt(0)}
        </span>
        <span className="flex-1 truncate text-sm font-semibold text-neutral-100">{ORG.workspace}</span>
        <IconChevronsLeft className="h-4 w-4 text-neutral-600" />
      </button>

      {/* New Suggestion */}
      <div className="px-3 pt-3">
        <button
          onClick={() => navigate('/suggestions?new=1')}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-white/6 px-3 py-1.5 text-sm font-medium text-neutral-200 ring-1 ring-inset ring-white/10 hover:bg-white/10"
        >
          <IconPlus className="h-4 w-4" /> New Suggestion
        </button>
      </div>

      {/* primary nav */}
      <nav className="mt-3 flex flex-col gap-0.5 px-3">
        <NavItem active={route.view === 'overview'} icon={<IconGrid className="h-4 w-4" />} label="Overview" onClick={() => navigate('/')} />
        <NavItem active={route.view === 'suggestions'} icon={<IconBulb className="h-4 w-4" />} label="Community Suggestions" onClick={() => navigate('/suggestions')} />
        <NavItem active={route.view === 'leaderboards'} icon={<IconTrophy className="h-4 w-4" />} label="Leaderboards" onClick={() => navigate('/leaderboards')} />
        <NavItem active={route.view === 'board'} icon={<IconBoard className="h-4 w-4" />} label="Combined Board" onClick={() => navigate('/board')} />
      </nav>

      {/* bounties (spaces) */}
      <div className="mt-5 px-3">
        <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Bounties</div>
        <nav className="flex flex-col gap-0.5">
          {spaces.map((s) => (
            <NavItem
              key={s.key}
              active={isSpace(route, s.key)}
              icon={<span className="text-[15px] leading-none">{s.emoji}</span>}
              label={s.name}
              onClick={() => navigate(`/space/${s.key}/board`)}
            />
          ))}
        </nav>
      </div>

      {projects.length > 0 && (
        <div className="mt-5 px-3">
          <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Projects Based Bounties</div>
          <nav className="flex flex-col gap-0.5">
            {projects.map((s) => (
              <NavItem
                key={s.key}
                active={isSpace(route, s.key)}
                icon={<span className="text-[15px] leading-none">{s.emoji}</span>}
                label={s.name}
                onClick={() => navigate(`/space/${s.key}/board`)}
              />
            ))}
          </nav>
        </div>
      )}

      {/* footer */}
      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-4 pt-6">
        <a href={ORG.social.website ?? '#'} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-white/5 hover:text-neutral-300">
          <IconQuestion className="h-4 w-4" /> Ask a question
        </a>
        <a href={ORG.social.website ?? '#'} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-white/5 hover:text-neutral-300">
          <IconMail className="h-4 w-4" /> Give us feedback
        </a>
        <a href={ORG.social.website ?? '#'} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-white/5 hover:text-neutral-300">
          <IconDoc className="h-4 w-4" /> Read our docs
        </a>
      </div>
    </aside>
  );
}
