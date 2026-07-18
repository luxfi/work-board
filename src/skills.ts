// Skill taxonomy — the Dework filter chips / task tags. Shared across every org
// (not brand-varying). Each skill has an emoji + a literal Tailwind pill class
// (written out so Tailwind's content scanner emits it — never build dynamically).

export type SkillMeta = { emoji: string; cls: string };

export const SKILL_META: Record<string, SkillMeta> = {
  Development: { emoji: '💻', cls: 'bg-blue-500/10 text-blue-300 ring-blue-500/25' },
  Design: { emoji: '🎨', cls: 'bg-pink-500/10 text-pink-300 ring-pink-500/25' },
  Translation: { emoji: '🌐', cls: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/25' },
  Writing: { emoji: '✍️', cls: 'bg-violet-500/10 text-violet-300 ring-violet-500/25' },
  Marketing: { emoji: '📣', cls: 'bg-orange-500/10 text-orange-300 ring-orange-500/25' },
  Community: { emoji: '🧑‍🤝‍🧑', cls: 'bg-teal-500/10 text-teal-300 ring-teal-500/25' },
  Product: { emoji: '📦', cls: 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/25' },
  Research: { emoji: '🔬', cls: 'bg-sky-500/10 text-sky-300 ring-sky-500/25' },
  Legal: { emoji: '⚖️', cls: 'bg-amber-500/10 text-amber-300 ring-amber-500/25' },
  Operations: { emoji: '🛠️', cls: 'bg-lime-500/10 text-lime-300 ring-lime-500/25' },
  Admin: { emoji: '🗂️', cls: 'bg-slate-500/10 text-slate-300 ring-slate-500/25' },
  'Data Analytics': { emoji: '📊', cls: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25' },
};

// The chip order for the skills filter and the About taxonomy.
export const SKILLS = Object.keys(SKILL_META);

export const LANGUAGES = ['English', 'Chinese', 'Spanish', 'Korean', 'Japanese', 'Russian'];

export function skillMeta(skill: string): SkillMeta {
  return SKILL_META[skill] ?? { emoji: '🏷️', cls: 'bg-neutral-500/10 text-neutral-300 ring-neutral-500/25' };
}
