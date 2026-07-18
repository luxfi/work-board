import type { ReactNode } from 'react';
import { useState } from 'react';
import { ORG } from '../config';
import { PrimaryButton, GhostButton, IconSort, IconFilter, IconSearch } from '../ui';

// Connect / Follow — top-right on every content view. Connect points at the org's
// Hanzo IAM OIDC entry (wired by the CTO agent); until then it falls back to the
// org's Discord so the button is never dead.
export function Topbar({ onSearch }: { onSearch?: () => void }) {
  const connectHref = ORG.iam?.authUrl ?? ORG.social.discord ?? ORG.social.website ?? '#';
  return (
    <div className="absolute right-6 top-5 z-10 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {onSearch && (
          <button
            onClick={onSearch}
            className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-sm text-neutral-400 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10 hover:text-neutral-200"
            aria-label="Search (⌘K)"
          >
            <IconSearch className="h-4 w-4" />
            <span>Search</span>
            <kbd className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-neutral-500">⌘K</kbd>
          </button>
        )}
        <a href={connectHref} target="_blank" rel="noreferrer noopener">
          <PrimaryButton>Connect</PrimaryButton>
        </a>
      </div>
      <GhostButton>★ Follow</GhostButton>
    </div>
  );
}

export type TabDef = { key: string; label: string; icon: ReactNode };

export function Tabs({ tabs, active, onSelect }: { tabs: TabDef[]; active: string; onSelect: (k: string) => void }) {
  return (
    <div className="scroll-x flex items-center gap-1 whitespace-nowrap">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`relative flex items-center gap-1.5 px-2.5 py-2 text-sm transition-colors ${
              on ? 'font-medium text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className={on ? 'text-neutral-200' : 'text-neutral-500'}>{t.icon}</span>
            {t.label}
            {on && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />}
          </button>
        );
      })}
    </div>
  );
}

// Sort / Filter / Search — the board & list toolbar. Search filters by title;
// the value is lifted so a view can apply it (real, not decorative).
export function Toolbar({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  const [openHint, setOpenHint] = useState(false);
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400">
      <button className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-white/5" onClick={() => setOpenHint((v) => !v)}>
        <IconSort className="h-4 w-4" /> Sort
      </button>
      <button className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-white/5" onClick={() => setOpenHint((v) => !v)}>
        <IconFilter className="h-4 w-4" /> Filter
      </button>
      <label className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 ring-1 ring-inset ring-white/8">
        <IconSearch className="h-3.5 w-3.5" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search tasks..."
          className="w-32 bg-transparent text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
        />
      </label>
      {openHint && <span className="text-xs text-neutral-600">sorted by reward · newest</span>}
    </div>
  );
}
