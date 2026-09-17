import { fuzzyFilter, type FuzzyKey } from '../primitives/CommandPalette/fuzzy';
import type { Skill, SkillDraft, SkillSource } from './types';

export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024;
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SKILL_SOURCES: SkillSource[] = ['builtin', 'user', 'project', 'plugin', 'remote'];

export const SKILL_SOURCE_LABELS: Record<SkillSource, string> = {
  builtin: 'Built-in',
  user: 'User',
  project: 'Project',
  plugin: 'Plugin',
  remote: 'Remote',
};

export const SKILL_SEARCH_KEYS: FuzzyKey<Skill>[] = ['name', 'tags'];

export type SkillSourceFilter = SkillSource | 'all';

export interface SkillValidationMessages {
  nameRequired: string;
  nameFormat: string;
  nameTooLong: string;
  nameTaken: string;
  descriptionRequired: string;
  descriptionTooLong: string;
}

export const DEFAULT_SKILL_VALIDATION_MESSAGES: SkillValidationMessages = {
  nameRequired: 'Name is required',
  nameFormat: 'Use lowercase letters, digits and single hyphens',
  nameTooLong: `Use at most ${SKILL_NAME_MAX_LENGTH} characters`,
  nameTaken: 'A skill with this name already exists',
  descriptionRequired: 'Description is required',
  descriptionTooLong: `Use at most ${SKILL_DESCRIPTION_MAX_LENGTH} characters`,
};

export type SkillDraftErrors = Partial<Record<'name' | 'description', string>>;

export function validateSkillName(
  name: string,
  takenNames: string[] = [],
  messages: SkillValidationMessages = DEFAULT_SKILL_VALIDATION_MESSAGES
): string | null {
  if (!name) {
    return messages.nameRequired;
  }
  if (name.length > SKILL_NAME_MAX_LENGTH) {
    return messages.nameTooLong;
  }
  if (!SKILL_NAME_PATTERN.test(name)) {
    return messages.nameFormat;
  }
  if (takenNames.includes(name)) {
    return messages.nameTaken;
  }
  return null;
}

export function validateSkillDraft(
  draft: SkillDraft,
  takenNames: string[] = [],
  messages: SkillValidationMessages = DEFAULT_SKILL_VALIDATION_MESSAGES
): SkillDraftErrors {
  const errors: SkillDraftErrors = {};
  const nameError = validateSkillName(draft.name, takenNames, messages);
  if (nameError) {
    errors.name = nameError;
  }
  const description = draft.description.trim();
  if (!description) {
    errors.description = messages.descriptionRequired;
  } else if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    errors.description = messages.descriptionTooLong;
  }
  return errors;
}

export function toSkillSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SKILL_NAME_MAX_LENGTH)
    .replace(/-+$/, '');
}

export function skillToDraft(skill?: Partial<Skill> | null): SkillDraft {
  return {
    name: skill?.name ?? '',
    description: skill?.description ?? '',
    tags: skill?.tags ?? [],
    allowedTools: skill?.allowedTools ?? [],
    content: skill?.content ?? '',
  };
}

export function normalizeSkillDraft(draft: SkillDraft): SkillDraft {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))],
    allowedTools: [...new Set(draft.allowedTools)],
    content: draft.content,
  };
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function isSkillDraftDirty(draft: SkillDraft, baseline: SkillDraft): boolean {
  return (
    draft.name !== baseline.name ||
    draft.description !== baseline.description ||
    draft.content !== baseline.content ||
    !sameList(draft.tags, baseline.tags) ||
    !sameList(draft.allowedTools, baseline.allowedTools)
  );
}

export function filterSkillsBySource(skills: Skill[], source: SkillSourceFilter): Skill[] {
  return source === 'all' ? skills : skills.filter((skill) => skill.source === source);
}

export function countSkillsBySource(skills: Skill[]): Record<SkillSourceFilter, number> {
  const counts: Record<SkillSourceFilter, number> = {
    all: skills.length,
    builtin: 0,
    user: 0,
    project: 0,
    plugin: 0,
    remote: 0,
  };
  for (const skill of skills) {
    counts[skill.source] += 1;
  }
  return counts;
}

export function getDuplicateSkillName(name: string, takenNames: string[]): string {
  const base = `${name}-copy`.slice(0, SKILL_NAME_MAX_LENGTH);
  if (!takenNames.includes(base)) {
    return base;
  }
  for (let index = 2; ; index++) {
    const candidate = `${base.slice(0, SKILL_NAME_MAX_LENGTH - String(index).length - 1)}-${index}`;
    if (!takenNames.includes(candidate)) {
      return candidate;
    }
  }
}

export function searchSkills(skills: Skill[], query: string): Skill[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return skills;
  }
  const fuzzy = fuzzyFilter(skills, needle, SKILL_SEARCH_KEYS).map((result) => result.item);
  const found = new Set(fuzzy);
  const byDescription = skills.filter(
    (skill) => !found.has(skill) && skill.description.toLowerCase().includes(needle)
  );
  return [...fuzzy, ...byDescription];
}
