import { LANES, Lane } from '../types';
import type { LaneDef, Task } from '../types';
import { isZero } from '../format';
import { openTask } from '../router';
import {
  Avatar,
  SkillTag,
  RewardBadge,
  OpenToBadge,
  IconDoc,
  IconCircle,
  IconHalfCircle,
  IconCheckCircle,
  IconUsersPlus,
  IconBolt,
  IconShield,
  IconCoins,
} from '../ui';

function LaneIcon({ lane }: { lane: Lane }) {
  switch (lane) {
    case Lane.ToDo:
      return <IconCircle className="h-4 w-4 text-neutral-500" />;
    case Lane.InProgress:
      return <IconHalfCircle className="h-4 w-4 text-amber-400" />;
    case Lane.InReview:
      return <span className="inline-block h-3.5 w-3.5 rounded-full bg-blue-500 ring-2 ring-inset ring-blue-300/40" />;
    case Lane.Done:
      return <IconCheckCircle className="h-4 w-4 text-emerald-400" />;
  }
}

function EmptyIcon({ icon }: { icon: LaneDef['icon'] }) {
  const cls = 'h-6 w-6 text-neutral-400';
  const map = { invite: <IconUsersPlus className={cls} />, bolt: <IconBolt className={cls} />, review: <IconShield className={cls} />, pay: <IconCoins className={cls} /> };
  return <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">{map[icon]}</span>;
}

export function TaskCard({ task }: { task: Task }) {
  const assigned = !isZero(task.worker);
  return (
    <button
      onClick={() => openTask(task.id)}
      className="group flex w-full flex-col gap-2 rounded-lg bg-[#1e1e22] p-3 text-left ring-1 ring-inset ring-white/8 transition-colors hover:bg-[#26262b]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-neutral-100 group-hover:text-white">{task.title}</span>
        <IconDoc className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
      </div>
      {task.skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {task.skills.map((s) => (
            <SkillTag key={s} skill={s} compact />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          <RewardBadge reward={task.parsedReward} />
          <OpenToBadge openTo={task.openTo} />
        </div>
        {assigned && <Avatar addr={task.worker} size={20} />}
      </div>
    </button>
  );
}

function Column({ def, tasks }: { def: LaneDef; tasks: Task[] }) {
  return (
    <section className="flex w-full min-w-0 flex-col rounded-xl bg-[#151518] ring-1 ring-inset ring-white/6">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <LaneIcon lane={def.lane} />
        <h2 className="text-sm font-semibold text-neutral-200">{def.title}</h2>
        <span className="ml-1 rounded bg-white/6 px-1.5 text-xs tabular-nums text-neutral-400">{tasks.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pb-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
            <EmptyIcon icon={def.icon} />
            <p className="max-w-[13rem] text-xs leading-relaxed text-neutral-500">{def.empty}</p>
          </div>
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
      </div>
    </section>
  );
}

export function Board({ tasks }: { tasks: Task[] }) {
  const byLane = (lane: Lane) => tasks.filter((t) => t.lane === lane);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {LANES.map((def) => (
        <Column key={def.lane} def={def} tasks={byLane(def.lane)} />
      ))}
    </div>
  );
}
