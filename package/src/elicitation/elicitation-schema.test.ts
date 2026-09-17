import {
  buildElicitationContent,
  getElicitationDraft,
  getElicitationFields,
  getElicitationHost,
  validateElicitationField,
  type ElicitationRequestedSchema,
} from './elicitation-schema';

const SCHEMA: ElicitationRequestedSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name', minLength: 2 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 18, maximum: 99 },
    subscribe: { type: 'boolean', default: true },
    plan: { type: 'string', enum: ['free', 'pro'], enumNames: ['Free', 'Pro'] },
    region: { type: 'string', oneOf: [{ const: 'eu', title: 'Europe' }] },
    tags: { type: 'array', minItems: 1, maxItems: 2, items: { enum: ['a', 'b', 'c'] } },
    unsupported: { type: 'array', items: {} },
  },
  required: ['name', 'plan'],
};

describe('getElicitationFields', () => {
  it('maps schema properties to field kinds and options', () => {
    const fields = getElicitationFields(SCHEMA);
    expect(fields.map((f) => [f.name, f.kind])).toEqual([
      ['name', 'text'],
      ['email', 'text'],
      ['age', 'number'],
      ['subscribe', 'boolean'],
      ['plan', 'select'],
      ['region', 'select'],
      ['tags', 'multiselect'],
    ]);
    const plan = fields.find((f) => f.name === 'plan');
    expect(plan).toMatchObject({
      required: true,
      options: [
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
      ],
    });
    expect(fields.find((f) => f.name === 'region')).toMatchObject({
      options: [{ value: 'eu', label: 'Europe' }],
    });
    expect(fields.find((f) => f.name === 'email')).toMatchObject({ inputType: 'email' });
  });

  it('builds a draft from defaults', () => {
    const draft = getElicitationDraft(getElicitationFields(SCHEMA));
    expect(draft).toMatchObject({ name: '', subscribe: true, tags: [], age: '' });
  });
});

describe('validateElicitationField', () => {
  const fields = getElicitationFields(SCHEMA);
  const byName = (name: string) => fields.find((f) => f.name === name)!;

  it('checks required, length, format and bounds', () => {
    expect(validateElicitationField(byName('name'), '')).toBe('Required');
    expect(validateElicitationField(byName('name'), 'a')).toBe('Must be at least 2 characters');
    expect(validateElicitationField(byName('email'), '')).toBeNull();
    expect(validateElicitationField(byName('email'), 'nope')).toBe('Enter a valid email');
    expect(validateElicitationField(byName('age'), 17)).toBe('Must be at least 18');
    expect(validateElicitationField(byName('age'), 20.5)).toBe('Must be a whole number');
    expect(validateElicitationField(byName('tags'), ['a', 'b', 'c'])).toBe('Select at most 2');
    expect(validateElicitationField(byName('plan'), 'enterprise')).toBe('Select an option');
  });

  it('validates uri and date formats', () => {
    const [uri, date] = getElicitationFields({
      type: 'object',
      properties: {
        site: { type: 'string', format: 'uri' },
        day: { type: 'string', format: 'date' },
      },
    });
    expect(validateElicitationField(uri, 'not a url')).toBe('Enter a valid URL');
    expect(validateElicitationField(uri, 'https://example.com')).toBeNull();
    expect(validateElicitationField(date, '2026-13-45')).toBe('Enter a valid date');
    expect(validateElicitationField(date, '2026-09-16')).toBeNull();
  });
});

describe('buildElicitationContent', () => {
  it('returns errors and skips empty optional fields', () => {
    const fields = getElicitationFields(SCHEMA);
    const draft = getElicitationDraft(fields);

    expect(buildElicitationContent(fields, draft).errors).toEqual({
      name: 'Required',
      plan: 'Required',
    });

    const result = buildElicitationContent(fields, {
      ...draft,
      name: 'Ada',
      plan: 'pro',
      age: '42',
      tags: ['a'],
    });
    expect(result.errors).toEqual({});
    expect(result.content).toEqual({
      name: 'Ada',
      plan: 'pro',
      age: 42,
      subscribe: true,
      tags: ['a'],
    });
  });
});

describe('getElicitationHost', () => {
  it('accepts only http(s) links', () => {
    expect(getElicitationHost('https://auth.example.com/login')).toBe('auth.example.com');
    expect(getElicitationHost('ftp://files.example.com/x')).toBeNull();
    expect(getElicitationHost('nope')).toBeNull();
  });
});
