import { useMemo, useState } from 'react';
import { ORG } from '../config';
import type { Task } from '../types';
import { LANES } from '../types';
import type { Tab } from '../router';
import { navigate } from '../router';
import { isZero } from '../format';
import { Board } from './Board';
import { OpenTasks } from './OpenTasks';
import { Suggestions } from './Suggestions';
import { Tabs, Toolbar } from './chrome';
import { AvatarStack, SkillTag, IconGrid, IconBoard, IconList, IconBulb } from '../ui';
import type { TabDef } from './chrome';

const TAB_DEFS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: <IconGrid className="h-4 w-4" /> },
  { key: 'board', label: 'Board', icon: <IconBoard className="h-4 w-4" /> },
  { key: 'tasks', label: 'Open Tasks', icon: <IconList className="h-4 w-4" /> },
  { key: 'suggestions', label: 'Community Suggestions', icon: <IconBulb className="h-4 w-4" /> },
];

function SpaceOverview({ tasks, spaceSkills }: { tasks: Task[]; spaceSkills: string[] }) {
  const counts = LANES.map((l) => ({ title: l.title, n: tasks.filter((t) => t.lane === l.lane).length }));
  const contributors = useMemo(() => {
    const set = new Set<string>();
    const out: string[] = [];
    for (const t of tasks) if (!isZero(t.worker) && !set.has(t.worker.toLowerCase())) (set.add(t.worker.toLowerCase()), out.push(t.worker));
    return out;
  }, [tasks]);
  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <div key={c.title} className="rounded-lg bg-[#1a1a1e] p-3 ring-1 ring-inset ring-white/6">
            <div className="text-2xl font-bold tabular-nums text-neutral-100">{c.n}</div>
            <div className="text-xs text-neutral-500">{c.title}</div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold text-neutral-200">Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {spaceSkills.map((s) => (
            <SkillTag key={s} skill={s} />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold text-neutral-200">Contributors</div>
        {contributors.length > 0 ? <AvatarStack addrs={contributors} max={10} /> : <p className="text-xs text-neutral-600">None yet.</p>}
      </div>
    </div>
  );
}

export function SpaceView({ tasks, spaceKey, tab }: { tasks: Task[]; spaceKey: string; tab: Tab }) {
  const [query, setQuery] = useState('');
  const space = ORG.spaces.find((s) => s.key === spaceKey);
  const spaceTasks = tasks.filter((t) => t.spaceKey === spaceKey);
  const shown = query ? spaceTasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())) : spaceTasks;

  if (!space) {
    return <div className="p-8 text-sm text-neutral-500">Unknown space.</div>;
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl leading-none">{space.emoji}</span>
        <h1 className="text-2xl font-bold text-neutral-50">{space.name}</h1>
      </div>
      <div className="mb-6 mt-3 flex items-center justify-between border-b border-white/6 pr-32">
        <Tabs tabs={TAB_DEFS} active={tab} onSelect={(k) => navigate(`/space/${spaceKey}/${k}`)} />
        {(tab === 'board' || tab === 'tasks') && (
          <div className="pb-2">
            <Toolbar query={query} onQuery={setQuery} />
          </div>
        )}
      </div>

      {tab === 'overview' && <SpaceOverview tasks={spaceTasks} spaceSkills={space.skills} />}
      {tab === 'board' && <Board tasks={shown} />}
      {tab === 'tasks' && <OpenTasks tasks={shown} />}
      {tab === 'suggestions' && <Suggestions />}
    </div>
  );
}
