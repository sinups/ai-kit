import type { DiffSource, FileChange } from './types';

const INVOICE_BEFORE = `import { roundMoney } from './money';
import type { Invoice, LineItem } from './types';

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

function lineTotal(item: LineItem): number {
  return item.quantity * item.unitPrice;
}

export function calculateTotals(invoice: Invoice): InvoiceTotals {
  const subtotal = invoice.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const tax = subtotal * invoice.taxRate;
  return {
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
    total: roundMoney(subtotal + tax),
  };
}

export function isOverdue(invoice: Invoice, now = new Date()): boolean {
  if (invoice.paidAt) {
    return false;
  }
  return invoice.dueAt.getTime() < now.getTime();
}

export function formatInvoiceNumber(invoice: Invoice): string {
  return \`INV-\${String(invoice.number).padStart(5, '0')}\`;
}
`;

const INVOICE_AFTER = `import { roundMoney } from './money';
import type { Discount, Invoice, LineItem } from './types';

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

function lineTotal(item: LineItem): number {
  return item.quantity * item.unitPrice;
}

function discountAmount(subtotal: number, discount?: Discount): number {
  if (!discount) {
    return 0;
  }
  return discount.type === 'percent' ? subtotal * discount.value : Math.min(discount.value, subtotal);
}

export function calculateTotals(invoice: Invoice): InvoiceTotals {
  const subtotal = invoice.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const discount = discountAmount(subtotal, invoice.discount);
  const tax = (subtotal - discount) * invoice.taxRate;
  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    tax: roundMoney(tax),
    total: roundMoney(subtotal - discount + tax),
  };
}

export function isOverdue(invoice: Invoice, now = new Date()): boolean {
  if (invoice.paidAt) {
    return false;
  }
  return invoice.dueAt.getTime() < now.getTime();
}

export function formatInvoiceNumber(invoice: Invoice): string {
  return \`INV-\${String(invoice.number).padStart(6, '0')}\`;
}
`;

const TYPES_BEFORE = `export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  number: number;
  items: LineItem[];
  taxRate: number;
  dueAt: Date;
  paidAt?: Date;
}
`;

const TYPES_AFTER = `export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export type Discount = { type: 'percent'; value: number } | { type: 'fixed'; value: number };

export interface Invoice {
  number: number;
  items: LineItem[];
  taxRate: number;
  discount?: Discount;
  dueAt: Date;
  paidAt?: Date;
}
`;

const TEST_AFTER = `import { calculateTotals } from './invoice';

const invoice = {
  number: 42,
  items: [{ description: 'Seats', quantity: 10, unitPrice: 12 }],
  taxRate: 0.2,
  dueAt: new Date('2026-10-01'),
};

describe('calculateTotals', () => {
  it('applies a percent discount before tax', () => {
    expect(calculateTotals({ ...invoice, discount: { type: 'percent', value: 0.1 } })).toEqual({
      subtotal: 120,
      discount: 12,
      tax: 21.6,
      total: 129.6,
    });
  });

  it('caps a fixed discount at the subtotal', () => {
    expect(calculateTotals({ ...invoice, discount: { type: 'fixed', value: 500 } }).total).toBe(0);
  });
});
`;

const LEGACY = `// Totals used to be computed on the server.
export async function fetchTotals(invoiceId: string) {
  const response = await fetch(\`/api/invoices/\${invoiceId}/totals\`);
  if (!response.ok) {
    throw new Error('Could not load totals');
  }
  return response.json();
}
`;

const CONFIG_BEFORE = `{
  "name": "@acme/billing",
  "version": "2.3.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p .",
    "test": "jest"
  }
}
`;

const CONFIG_AFTER = `{
  "name": "@acme/billing",
  "version": "2.4.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p .",
    "test": "jest --coverage"
  }
}
`;

const README = `# Billing

Invoice totals, taxes and discounts.
`;

export const DIFF_FIXTURES: FileChange[] = [
  {
    path: 'packages/billing/src/invoice.ts',
    status: 'modified',
    language: 'ts',
    oldContent: INVOICE_BEFORE,
    newContent: INVOICE_AFTER,
  },
  {
    path: 'packages/billing/src/types.ts',
    status: 'modified',
    language: 'ts',
    oldContent: TYPES_BEFORE,
    newContent: TYPES_AFTER,
  },
  {
    path: 'packages/billing/src/invoice.test.ts',
    status: 'added',
    language: 'ts',
    newContent: TEST_AFTER,
  },
  {
    path: 'packages/billing/src/legacy/fetch-totals.ts',
    status: 'deleted',
    language: 'ts',
    oldContent: LEGACY,
  },
  {
    path: 'packages/billing/package.json',
    status: 'modified',
    language: 'json',
    oldContent: CONFIG_BEFORE,
    newContent: CONFIG_AFTER,
  },
  {
    path: 'docs/billing/README.md',
    previousPath: 'docs/billing.md',
    status: 'renamed',
    language: 'md',
    oldContent: README,
    newContent: README,
  },
  {
    path: 'apps/web/public/invoice-logo.png',
    status: 'added',
    binary: true,
  },
];

const SCRATCH = `# Discount edge cases

- 100% discount
- discount larger than subtotal
- negative tax rate (should be rejected)
`;

const LOCKFILE = Array.from(
  { length: 20000 },
  (_, index) => `"package-${index}@^1.${index % 40}.0":\n  version "1.${index % 40}.${index % 9}"\n`
).join('');

export const DIFF_EXTRA_FIXTURES: FileChange[] = [
  {
    path: 'notes/discount-edge-cases.md',
    status: 'added',
    untracked: true,
    newContent: SCRATCH,
  },
  {
    path: 'yarn.lock',
    status: 'modified',
    additions: 214,
    deletions: 187,
    oldContent: LOCKFILE,
    newContent: `${LOCKFILE}"decimal.js@^10.4.3":\n  version "10.4.3"\n`,
  },
];

export const DIFF_SOURCES: DiffSource[] = [
  { id: 'uncommitted', label: 'Uncommitted', changes: [...DIFF_FIXTURES, ...DIFF_EXTRA_FIXTURES] },
  { id: 'turn-3', label: 'Turn 3', changes: DIFF_FIXTURES.slice(0, 3) },
  { id: 'turn-2', label: 'Turn 2', changes: [DIFF_FIXTURES[4]] },
];
