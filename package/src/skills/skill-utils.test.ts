import {
  countSkillsBySource,
  filterSkillsBySource,
  getDuplicateSkillName,
  isSkillDraftDirty,
  normalizeSkillDraft,
  searchSkills,
  skillToDraft,
  toSkillSlug,
  validateSkillDraft,
  validateSkillName,
} from './skill-utils';
import type { Skill } from './types';

const SKILLS: Skill[] = [
  { id: '1', name: 'pdf', description: 'PDF', source: 'builtin', enabled: true },
  { id: '2', name: 'review', description: 'Review', source: 'project', enabled: false },
  { id: '3', name: 'deploy', description: 'Deploy', source: 'project', enabled: true },
];

describe('skills/validateSkillName', () => {
  it('accepts lowercase slugs', () => {
    expect(validateSkillName('pdf-forms-2')).toBeNull();
  });

  it('rejects empty, malformed, long and taken names', () => {
    expect(validateSkillName('')).toBe('Name is required');
    expect(validateSkillName('PDF Forms')).toBe('Use lowercase letters, digits and single hyphens');
    expect(validateSkillName('a--b')).toMatch(/single hyphens/);
    expect(validateSkillName('-a')).toMatch(/single hyphens/);
    expect(validateSkillName('a'.repeat(65))).toBe('Use at most 64 characters');
    expect(validateSkillName('pdf', ['pdf'])).toBe('A skill with this name already exists');
  });
});

describe('skills/validateSkillDraft', () => {
  it('reports name and description errors', () => {
    expect(validateSkillDraft({ ...skillToDraft(), name: 'Bad Name', description: '  ' })).toEqual({
      name: 'Use lowercase letters, digits and single hyphens',
      description: 'Description is required',
    });
    expect(
      validateSkillDraft({ ...skillToDraft(), name: 'ok', description: 'x'.repeat(1025) })
    ).toEqual({ description: 'Use at most 1024 characters' });
    expect(validateSkillDraft({ ...skillToDraft(), name: 'ok', description: 'Fine' })).toEqual({});
  });
});

describe('skills/drafts', () => {
  it('creates an empty draft and one from a skill', () => {
    expect(skillToDraft()).toEqual({
      name: '',
      description: '',
      tags: [],
      allowedTools: [],
      content: '',
    });
    expect(skillToDraft({ ...SKILLS[0], tags: ['docs'], content: '# PDF' })).toMatchObject({
      name: 'pdf',
      tags: ['docs'],
      content: '# PDF',
    });
  });

  it('normalizes whitespace and duplicates', () => {
    expect(
      normalizeSkillDraft({
        name: ' pdf ',
        description: ' Fill forms ',
        tags: [' docs', 'docs', ''],
        allowedTools: ['Read', 'Read'],
        content: 'body',
      })
    ).toEqual({
      name: 'pdf',
      description: 'Fill forms',
      tags: ['docs'],
      allowedTools: ['Read'],
      content: 'body',
    });
  });

  it('detects dirty drafts including list changes', () => {
    const base = skillToDraft({ ...SKILLS[0], tags: ['a'] });
    expect(isSkillDraftDirty({ ...base }, base)).toBe(false);
    expect(isSkillDraftDirty({ ...base, tags: ['a', 'b'] }, base)).toBe(true);
    expect(isSkillDraftDirty({ ...base, content: 'x' }, base)).toBe(true);
  });
});

describe('skills/skill-utils source helpers', () => {
  it('filters and counts by source', () => {
    expect(filterSkillsBySource(SKILLS, 'all')).toBe(SKILLS);
    expect(filterSkillsBySource(SKILLS, 'project').map((skill) => skill.id)).toEqual(['2', '3']);
    expect(countSkillsBySource(SKILLS)).toEqual({
      all: 3,
      builtin: 1,
      user: 0,
      project: 2,
      plugin: 0,
      remote: 0,
    });
  });
});

describe('skills/names', () => {
  it('turns text into a slug', () => {
    expect(toSkillSlug('  PDF Forms & Tables! ')).toBe('pdf-forms-tables');
  });

  it('finds a free duplicate name', () => {
    expect(getDuplicateSkillName('pdf', ['pdf'])).toBe('pdf-copy');
    expect(getDuplicateSkillName('pdf', ['pdf', 'pdf-copy', 'pdf-copy-2'])).toBe('pdf-copy-3');
  });
});

describe('skills/searchSkills', () => {
  const catalog: Skill[] = [
    { id: 'a', name: 'deploy', description: 'Ship the web app', source: 'user', enabled: true },
    {
      id: 'b',
      name: 'pdf',
      description: 'Fill forms for deployment',
      source: 'user',
      enabled: true,
      tags: ['docs'],
    },
    {
      id: 'c',
      name: 'review',
      description: 'Read diffs',
      source: 'user',
      enabled: true,
      tags: ['git'],
    },
  ];

  it('keeps the order for a blank query', () => {
    expect(searchSkills(catalog, '  ')).toBe(catalog);
  });

  it('puts fuzzy name and tag matches before description substrings', () => {
    expect(searchSkills(catalog, 'dep').map((skill) => skill.id)).toEqual(['a', 'b']);
    expect(searchSkills(catalog, 'GIT').map((skill) => skill.id)).toEqual(['c']);
  });

  it('does not match descriptions fuzzily', () => {
    expect(searchSkills(catalog, 'swa')).toEqual([]);
    expect(searchSkills(catalog, 'web app').map((skill) => skill.id)).toEqual(['a']);
  });
});
