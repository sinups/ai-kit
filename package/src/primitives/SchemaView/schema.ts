export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface JsonSchema {
  type?: JsonSchemaType | JsonSchemaType[];
  title?: string;
  description?: string;
  format?: string;
  default?: unknown;
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  minimum?: number;
  maximum?: number;
}

export type SchemaRow = {
  /** Unique row id: property names joined with `.`, `[]` for array items, `~n` for union variants */
  path: string;
  /** Path of the parent row, `null` for top-level rows */
  parentPath: string | null;
  /** Property name, or the variant title for union variants */
  name: string;
  /** Readable type, for example `string`, `object[]` or `string | null` */
  type: string;
  required: boolean;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  /** Nesting level, `0` for top-level rows */
  depth: number;
  /** Whether rows with this row as `parentPath` follow it */
  hasChildren: boolean;
};

function variantsOf(schema: JsonSchema): JsonSchema[] | undefined {
  return schema.oneOf ?? schema.anyOf;
}

export function getSchemaTypeLabel(schema: JsonSchema): string {
  const variants = variantsOf(schema);
  if (variants && variants.length > 0 && !schema.type) {
    return Array.from(new Set(variants.map(getSchemaTypeLabel))).join(' | ');
  }
  if (Array.isArray(schema.type)) {
    return schema.type
      .map((type) => (type === 'array' ? getSchemaTypeLabel({ ...schema, type }) : type))
      .join(' | ');
  }
  if (schema.type === 'array') {
    if (!schema.items) {
      return 'array';
    }
    const item = getSchemaTypeLabel(schema.items);
    return item.includes(' | ') ? `(${item})[]` : `${item}[]`;
  }
  if (schema.type) {
    return schema.type;
  }
  if (schema.properties) {
    return 'object';
  }
  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }
  if (schema.enum) {
    return 'enum';
  }
  return 'any';
}

function getEnum(schema: JsonSchema): unknown[] | undefined {
  if (schema.enum) {
    return schema.enum;
  }
  const variants = variantsOf(schema);
  if (variants && variants.length > 0 && variants.every((variant) => variant.const !== undefined)) {
    return variants.map((variant) => variant.const);
  }
  return undefined;
}

function hasNestedRows(schema: JsonSchema): boolean {
  if (schema.properties && Object.keys(schema.properties).length > 0) {
    return true;
  }
  if (schema.items) {
    return hasNestedRows(schema.items);
  }
  const variants = variantsOf(schema);
  return Boolean(variants?.some(hasNestedRows));
}

export function flattenSchema(schema: JsonSchema): SchemaRow[] {
  const rows: SchemaRow[] = [];
  const ancestors = new Set<JsonSchema>();

  const pushRow = (
    property: JsonSchema,
    row: Pick<SchemaRow, 'path' | 'parentPath' | 'name' | 'required' | 'depth'>
  ) => {
    const index = rows.length;
    rows.push({
      ...row,
      type: getSchemaTypeLabel(property),
      description:
        property.description ?? (row.name === property.title ? undefined : property.title),
      default: property.default,
      enum: getEnum(property),
      format: property.format,
      minimum: property.minimum,
      maximum: property.maximum,
      hasChildren: false,
    });
    pushChildren(property, row.path, row.path, row.depth + 1);
    rows[index].hasChildren = rows.length > index + 1;
  };

  const pushChildren = (
    parent: JsonSchema,
    parentPath: string | null,
    prefix: string,
    depth: number
  ) => {
    if (ancestors.has(parent)) {
      return;
    }
    ancestors.add(parent);

    const required = new Set(parent.required ?? []);
    for (const [name, property] of Object.entries(parent.properties ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      pushRow(property, { path, parentPath, name, required: required.has(name), depth });
    }

    if (parent.items) {
      pushChildren(parent.items, parentPath, `${prefix}[]`, depth);
    }

    const variants = variantsOf(parent);
    if (variants?.some(hasNestedRows)) {
      variants.forEach((variant, index) => {
        pushRow(variant, {
          path: `${prefix}~${index}`,
          parentPath,
          name: variant.title ?? `Option ${index + 1}`,
          required: false,
          depth,
        });
      });
    }

    ancestors.delete(parent);
  };

  pushChildren(schema, null, '', 0);
  return rows;
}

export function getVisibleSchemaRows(
  rows: SchemaRow[],
  expanded: ReadonlySet<string>
): SchemaRow[] {
  const visible: SchemaRow[] = [];
  let hiddenBelow = Infinity;
  for (const row of rows) {
    if (row.depth > hiddenBelow) {
      continue;
    }
    hiddenBelow = Infinity;
    visible.push(row);
    if (row.hasChildren && !expanded.has(row.path)) {
      hiddenBelow = row.depth;
    }
  }
  return visible;
}

export function getDefaultExpandedPaths(rows: SchemaRow[], depth: number): Set<string> {
  return new Set(rows.filter((row) => row.hasChildren && row.depth < depth).map((row) => row.path));
}
