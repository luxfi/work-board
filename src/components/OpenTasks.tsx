import { LANES } from '../types';
import type { Lane, Task } from '../types';
import { isZero } from '../format';
import { openTask } from '../router';
import { Avatar, SkillTag, RewardBadge, OpenToBadge, IconDoc, IconCircle, IconChevronDown } from '../ui';

function TaskRow({ task }: { task: Task }) {
  const assigned = !isZero(task.worker);
  return (
    <button
      onClick={() => openTask(task.id)}
      className="flex w-full items-center gap-3 border-b border-white/5 px-2 py-2.5 text-left transition-colors hover:bg-white/4"
    >
      <IconCircle className="h-4 w-4 shrink-0 text-neutral-600" />
      <IconDoc className="h-4 w-4 shrink-0 text-sky-400" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-100">{task.title}</span>
      <div className="hidden items-center gap-1.5 sm:flex">
        {task.skills.map((s) => (
          <SkillTag key={s} skill={s} />
        ))}
      </div>
      <RewardBadge reward={task.parsedReward} />
      <div className="w-32 text-right">
        <OpenToBadge openTo={task.openTo} />
      </div>
      <span className="w-6 shrink-0 text-right">{assigned && <Avatar addr={task.worker} size={20} />}</span>
    </button>
  );
}

function Group({ lane, title, tasks }: { lane: Lane; title: string; tasks: Task[] }) {
  const rows = tasks.filter((t) => t.lane === lane);
  if (rows.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-300">
        <IconChevronDown className="h-4 w-4 text-neutral-500" />
        <IconCircle className="h-4 w-4 text-neutral-500" />
        <span className="font-medium">{title}</span>
        <span className="rounded bg-white/6 px-1.5 text-xs tabular-nums text-neutral-400">{rows.length}</span>
      </div>
      <div>
        {rows.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

export function OpenTasks({ tasks }: { tasks: Task[] }) {
  const anyTasks = tasks.length > 0;
  return (
    <div>
      {!anyTasks ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-neutral-500">
          <IconCircle className="h-6 w-6" />
          <span className="text-sm">No open tasks yet.</span>
        </div>
      ) : (
        LANES.map((def) => <Group key={def.lane} lane={def.lane} title={def.title} tasks={tasks} />)
      )}
    </div>
  );
}
