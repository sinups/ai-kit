export type SkillSource = 'builtin' | 'user' | 'project' | 'plugin' | 'remote';

export interface Skill {
  /** Unique skill id */
  id: string;
  /** Skill name, a lowercase slug such as `pdf-forms` */
  name: string;
  /** What the skill does and when the agent should use it */
  description: string;
  /** Where the skill comes from */
  source: SkillSource;
  /** Whether the agent may load the skill */
  enabled: boolean;
  /** Skill version */
  version?: string;
  /** Skill author */
  author?: string;
  /** Free-form tags */
  tags?: string[];
  /** Location of the skill file */
  path?: string;
  /** Markdown instructions */
  content?: string;
  /** Tools the skill may use without asking */
  allowedTools?: string[];
  /** Last update time */
  updatedAt?: Date | string | number;
  /** How many times the skill was used */
  usageCount?: number;
}

/** Editable fields of a skill */
export interface SkillDraft {
  name: string;
  description: string;
  tags: string[];
  allowedTools: string[];
  content: string;
}
