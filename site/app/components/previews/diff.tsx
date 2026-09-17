"use client";

import React, { useState } from "react";
import { Button, Checkbox } from "@mantine/core";
import {
  DiffFileList,
  DiffFileView,
  DiffReview,
  DiffReviewModal,
  type DiffFileListView,
  type FileChange,
  type FileDecision,
} from "@sinups/ai-kit";
import { NarrowFrame, WideFrame, wait } from "./frames";

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
    path: "packages/billing/src/invoice.ts",
    status: "modified",
    language: "ts",
    oldContent: INVOICE_BEFORE,
    newContent: INVOICE_AFTER,
  },
  {
    path: "packages/billing/src/types.ts",
    status: "modified",
    language: "ts",
    oldContent: TYPES_BEFORE,
    newContent: TYPES_AFTER,
  },
  {
    path: "packages/billing/src/invoice.test.ts",
    status: "added",
    language: "ts",
    newContent: TEST_AFTER,
  },
  {
    path: "packages/billing/src/legacy/fetch-totals.ts",
    status: "deleted",
    language: "ts",
    oldContent: LEGACY,
  },
  {
    path: "packages/billing/package.json",
    status: "modified",
    language: "json",
    oldContent: CONFIG_BEFORE,
    newContent: CONFIG_AFTER,
  },
  {
    path: "docs/billing/README.md",
    previousPath: "docs/billing.md",
    status: "renamed",
    language: "md",
    oldContent: README,
    newContent: README,
  },
  {
    path: "apps/web/public/invoice-logo.png",
    status: "added",
    binary: true,
  },
];

function useDecisions() {
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  const decide = (decision: FileDecision) => async (change: FileChange) => {
    await wait(500);
    setDecisions((current) => ({ ...current, [change.path]: decision }));
  };
  const decideAll = (decision: FileDecision) => async () => {
    await wait(800);
    setDecisions(Object.fromEntries(DIFF_FIXTURES.map((change) => [change.path, decision])));
  };
  return {
    decisions,
    onAccept: decide("accepted"),
    onReject: decide("rejected"),
    onAcceptAll: decideAll("accepted"),
    onRejectAll: decideAll("rejected"),
  };
}

function DiffReviewPreview({ narrow = false }: { narrow?: boolean }) {
  const decisions = useDecisions();
  const review = <DiffReview changes={DIFF_FIXTURES} breakpoint={narrow ? undefined : 720} {...decisions} />;
  return narrow ? <NarrowFrame height={640}>{review}</NarrowFrame> : <WideFrame height={640}>{review}</WideFrame>;
}

function DiffReviewReadOnlyPreview() {
  return (
    <WideFrame height={640}>
      <DiffReview changes={DIFF_FIXTURES} defaultViewedPaths={[DIFF_FIXTURES[0].path]} defaultMode="split" breakpoint={720} />
    </WideFrame>
  );
}

function DiffReviewModalPreview() {
  const [opened, setOpened] = useState(false);
  const decisions = useDecisions();
  return (
    <div className="flex w-full justify-center">
      <Button onClick={() => setOpened(true)}>Review {DIFF_FIXTURES.length} changed files</Button>
      <DiffReviewModal opened={opened} onClose={() => setOpened(false)} changes={DIFF_FIXTURES} {...decisions} />
    </div>
  );
}

function DiffFileListPreview({ tree = false }: { tree?: boolean }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(DIFF_FIXTURES[0].path);
  const [view, setView] = useState<DiffFileListView>(tree ? "tree" : "list");
  return (
    <NarrowFrame className="p-3">
      <DiffFileList
        changes={DIFF_FIXTURES}
        selectedPath={selectedPath}
        onSelect={(change) => setSelectedPath(change.path)}
        viewedPaths={[DIFF_FIXTURES[1].path]}
        decisions={{ [DIFF_FIXTURES[4].path]: "accepted", [DIFF_FIXTURES[3].path]: "rejected" }}
        view={view}
        onViewChange={setView}
      />
    </NarrowFrame>
  );
}

function DiffFileViewPreview({ index = 0, narrow = false }: { index?: number; narrow?: boolean }) {
  const [viewed, setViewed] = useState(false);
  const view = (
    <div className="p-3">
      <DiffFileView
        change={DIFF_FIXTURES[index]}
        headerActions={
          <Checkbox size="xs" label="Viewed" checked={viewed} onChange={(event) => setViewed(event.currentTarget.checked)} />
        }
      />
    </div>
  );
  return narrow ? <NarrowFrame>{view}</NarrowFrame> : <WideFrame>{view}</WideFrame>;
}

function DiffFileViewStubsPreview() {
  return (
    <div className="flex w-full flex-col gap-4">
      <WideFrame className="p-3">
        <DiffFileView change={DIFF_FIXTURES[3]} />
      </WideFrame>
      <WideFrame className="p-3">
        <DiffFileView change={DIFF_FIXTURES[5]} />
      </WideFrame>
      <WideFrame className="p-3">
        <DiffFileView change={DIFF_FIXTURES[6]} />
      </WideFrame>
    </div>
  );
}

export function renderDiffPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "DiffReview":
    case "DiffReview/wide":
      return <DiffReviewPreview />;
    case "DiffReview/narrow":
      return <DiffReviewPreview narrow />;
    case "DiffReview/read-only":
      return <DiffReviewReadOnlyPreview />;
    case "DiffReview/modal":
      return <DiffReviewModalPreview />;
    case "DiffFileList":
    case "DiffFileList/list":
      return <DiffFileListPreview />;
    case "DiffFileList/tree":
      return <DiffFileListPreview tree />;
    case "DiffFileView":
    case "DiffFileView/wide":
      return <DiffFileViewPreview />;
    case "DiffFileView/narrow":
      return <DiffFileViewPreview index={1} narrow />;
    case "DiffFileView/stubs":
      return <DiffFileViewStubsPreview />;
    default:
      return undefined;
  }
}
