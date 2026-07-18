import { useEffect, useState } from 'react';
import { ORG } from '../config';
import type { Workspace } from '../chain';
import { loadNftMeta } from '../chain';
import type { NftMeta } from '../reward';
import { isNft } from '../reward';
import type { Task, Activity, ActivityKind } from '../types';
import { STATE_TITLE, State, RewardType } from '../types';
import { closeTask } from '../router';
import { short, isZero, absDate, timeAgo, refToLink, formatAmount } from '../format';
import {
  Avatar,
  Input,
  SkillTag,
  RewardBadge,
  OpenToBadge,
  PrimaryButton,
  IconX,
  IconDots,
  IconBookmark,
  IconTwitter,
  IconInfo,
  IconLock,
  IconExternal,
} from '../ui';

const VERB: Record<ActivityKind, string> = {
  proposed: 'created this task',
  funded: 'funded the bounty',
  claimed: 'claimed the task',
  submitted: 'submitted work',
  accepted: 'accepted the work',
  paid: 'was paid',
  disputed: 'opened a dispute',
  resolved: 'resolved the dispute',
  cancelled: 'cancelled the bounty',
  slashed: 'stake slashed',
  finalized: 'finalized the task',
};

type Comment = { id: string; author: string; body: string; ts: number };

function commentsKey(id: number) {
  return `work-comments:${ORG.workspace}:${id}`;
}
function loadComments(id: number): Comment[] {
  try {
    return JSON.parse(localStorage.getItem(commentsKey(id)) ?? '[]') as Comment[];
  } catch {
    return [];
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
      {children}
    </div>
  );
}

export function TaskDetail({ task, ws }: { task: Task; ws: Workspace }) {
  const [meta, setMeta] = useState<NftMeta | undefined>();
  const [comments, setComments] = useState<Comment[]>(() => loadComments(task.id));
  const [draft, setDraft] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isNft(task.parsedReward) && (task.parsedReward.type === RewardType.ERC721 || task.parsedReward.type === RewardType.ERC1155)) {
      const r = task.parsedReward;
      void loadNftMeta(r.token, r.tokenId, r.type === RewardType.ERC1155).then(setMeta);
    }
  }, [task.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeTask();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activity = ws.activity.filter((a) => a.bountyId === task.id).sort((a, b) => a.ts - b.ts);
  const assigned = !isZero(task.worker);
  const reviewer = !isZero(task.approver) ? task.approver : !isZero(task.arbiter) ? task.arbiter : null;
  const issue = task.issueRef ? refToLink(task.issueRef) : null;
  const deliverable = task.deliverableRef ? refToLink(task.deliverableRef) : null;

  const addComment = () => {
    if (!draft.trim()) return;
    const next = [...comments, { id: crypto.randomUUID(), author: 'you', body: draft.trim(), ts: Date.now() / 1000 }];
    setComments(next);
    try {
      localStorage.setItem(commentsKey(task.id), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-start sm:px-4 sm:py-10" onClick={closeTask}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-t-2xl bg-[var(--surface)] shadow-2xl ring-1 ring-inset ring-white/10 sm:max-h-[86vh] sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/6 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span>{ORG.workspace}</span>
              <span>/</span>
              <span className="capitalize">{task.spaceKey}</span>
              <span>/</span>
              <span>#{task.id}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-xl font-semibold text-neutral-50">{task.title}</h2>
              <IconBookmark className="h-4 w-4 text-neutral-500" />
              {ORG.social.twitter && <IconTwitter className="h-4 w-4 text-neutral-500" />}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded p-1.5 text-neutral-500 hover:bg-white/5"><IconDots className="h-4 w-4" /></button>
            <button onClick={closeTask} className="rounded p-1.5 text-neutral-500 hover:bg-white/5"><IconX className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_240px]">
          {/* main */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {task.openTo && <OpenToBadge openTo={task.openTo} />}
              <RewardBadge reward={task.parsedReward} meta={meta} />
              {task.skills.map((s) => (
                <SkillTag key={s} skill={s} />
              ))}
            </div>

            {task.openTo && !dismissed && (
              <div className="mt-4 rounded-lg bg-sky-500/8 p-4 ring-1 ring-inset ring-sky-400/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2.5">
                    <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                    <div>
                      <p className="text-sm font-medium text-neutral-100">
                        This task is {task.openTo === 'bids' ? 'Open to Bids' : 'Open to Applications'}.
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                        Click "I'm Interested" to express your interest to work on this task. If you're a good fit, the reviewer
                        will assign you; then you can claim, submit your work and get paid on-chain.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setDismissed(true)} className="text-xs text-neutral-500 hover:text-neutral-300">Dismiss ✕</button>
                </div>
              </div>
            )}

            {/* description — the on-chain facts + the linked off-chain spec (issueRef) */}
            <div className="mt-5 border-l-2 border-white/10 pl-4 text-sm leading-relaxed text-neutral-300">
              <p className="text-neutral-400">
                On-chain bounty <span className="font-mono text-neutral-300">#{task.id}</span> on {ORG.chainName} · escrowed reward{' '}
                <span className="text-emerald-300">{formatAmount(task.reward)} {task.token === '0x0000000000000000000000000000000000000000' ? ORG.nativeSymbol : short(task.token)}</span>
                {task.stake > 0n && <> · claim stake <span className="text-neutral-200">{formatAmount(task.stake)}</span></>}.
              </p>
              {issue && (
                <p className="mt-2">
                  Spec:{' '}
                  {issue.href ? (
                    <a href={issue.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300">
                      {issue.text} <IconExternal className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-neutral-200">{issue.text}</span>
                  )}
                </p>
              )}
              {deliverable && (
                <p className="mt-1">
                  Deliverable:{' '}
                  {deliverable.href ? (
                    <a href={deliverable.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300">
                      {deliverable.text} <IconExternal className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-neutral-200">{deliverable.text}</span>
                  )}
                </p>
              )}
            </div>

            {task.state === State.Open || task.state === State.Funded ? (
              <div className="mt-5">
                <PrimaryButton onClick={addComment}>
                  <IconLock className="h-4 w-4" /> I'm interested
                </PrimaryButton>
              </div>
            ) : null}

            {/* activity — real on-chain events */}
            <div className="mt-7">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Activity</div>
              <div className="flex flex-col gap-3">
                {activity.length === 0 && <p className="text-sm text-neutral-600">No on-chain activity yet.</p>}
                {activity.map((a: Activity, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Avatar addr={a.actor} size={22} />
                    <span className="text-neutral-300">
                      <span className="font-mono text-neutral-200">{short(a.actor)}</span> {VERB[a.kind]}
                    </span>
                    <span className="ml-auto text-xs text-neutral-600" title={absDate(a.ts)}>{a.ts ? absDate(a.ts) : ''}</span>
                  </div>
                ))}

                {/* applicant proposals / comments (functional; swappable to IAM/on-chain) */}
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-white/4 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Avatar addr={`0x${c.author}`} size={20} />
                      <span className="font-medium text-neutral-200">{c.author}</span>
                      <span className="text-xs text-neutral-600">{timeAgo(c.ts)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-neutral-300">{c.body}</p>
                  </div>
                ))}

                <div className="mt-1 flex items-center gap-2">
                  <Input
                    variant="unstyled"
                    value={draft}
                    onChangeText={setDraft}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    placeholder="Add a comment or application…"
                    className="flex-1 rounded-md bg-white/5 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 ring-1 ring-inset ring-white/8 focus:outline-none"
                  />
                  <PrimaryButton onClick={addComment}>Send</PrimaryButton>
                </div>
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="flex flex-col gap-5">
            <Field label="Status">
              <span className="inline-flex items-center gap-1.5 text-sm text-neutral-200">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
                {STATE_TITLE[task.state as State]}
              </span>
            </Field>
            <Field label="Assignee">
              {assigned ? (
                <span className="flex items-center gap-2 text-sm text-neutral-200">
                  <Avatar addr={task.worker} size={22} /> <span className="font-mono">{short(task.worker)}</span>
                </span>
              ) : (
                <span className="text-sm text-neutral-500">No task assignee…</span>
              )}
            </Field>
            {reviewer && (
              <Field label="Reviewers">
                <span className="flex items-center gap-2 text-sm text-neutral-200">
                  <Avatar addr={reviewer} size={22} /> <span className="font-mono">{short(reviewer)}</span>
                </span>
              </Field>
            )}
            {task.reputation.karma !== undefined && assigned && (
              <Field label="Global Karma">
                <span className="text-sm text-fuchsia-300" title="Portable soul-bound Karma across every DAO">
                  {formatAmount(task.reputation.karma)} K
                </span>
              </Field>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
