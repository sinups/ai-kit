import type {
  ChatMessage,
  DiffSource,
  SessionSummary,
} from "@sinups/ai-kit";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const ACTIVE_SESSION_ID = "checkout-e2e";

export function createPreviewSessions(now: Date): SessionSummary[] {
  const at = (offset: number) => new Date(now.getTime() - offset);
  return [
    {
      id: ACTIVE_SESSION_ID,
      title: "Fix flaky checkout e2e test",
      preview: "The submit click races the payment frame. Waiting for ready fixes it.",
      createdAt: at(9 * MINUTE),
      updatedAt: at(2 * MINUTE),
      messageCount: 6,
      model: "qwen-2.5-coder-32b",
      branch: "fix/checkout-e2e",
    },
    {
      id: "invoice-discounts",
      title: "Apply discounts before tax",
      preview: "Totals now subtract the discount first.",
      createdAt: at(3 * HOUR),
      updatedAt: at(2 * HOUR),
      messageCount: 18,
      model: "deepseek-coder-v2",
      branch: "feat/invoice-discounts",
      pinned: true,
    },
    {
      id: "token-refresh",
      title: "Retry token refresh with backoff",
      preview: "Three attempts with exponential backoff.",
      createdAt: at(5 * HOUR),
      updatedAt: at(4 * HOUR),
      messageCount: 11,
      model: "llama-3.3-70b",
      branch: "fix/auth-retry",
    },
    {
      id: "release-notes",
      title: "Draft release notes for 2.4",
      preview: "Grouped changelog with breaking changes first.",
      createdAt: at(DAY + 2 * HOUR),
      updatedAt: at(DAY + HOUR),
      messageCount: 24,
      model: "mistral-large",
    },
    {
      id: "mcp-search",
      title: "Connect the docs search MCP server",
      preview: "Server is connected with four tools.",
      createdAt: at(DAY + 6 * HOUR),
      updatedAt: at(DAY + 5 * HOUR),
      messageCount: 9,
      model: "gemma-3-27b",
    },
    {
      id: "a11y-audit",
      title: "Audit focus states in settings",
      preview: "Six controls were missing a visible focus ring.",
      createdAt: at(3 * DAY),
      updatedAt: at(3 * DAY),
      messageCount: 15,
      model: "phi-4",
    },
    {
      id: "csv-export",
      title: "Stream CSV export for large tables",
      preview: "Rows are written in chunks of 5000.",
      createdAt: at(6 * DAY),
      updatedAt: at(5 * DAY),
      messageCount: 21,
      model: "qwen-2.5-coder-32b",
    },
  ];
}

export const PREVIEW_MESSAGES: ChatMessage[] = [
  {
    id: "u1",
    role: "user",
    parts: [
      {
        type: "text",
        text: "The checkout e2e test fails about one run in ten on CI. Find the cause and fix it.",
      },
    ],
  },
  {
    id: "a1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I will look at the test and the payment frame it waits for.",
      },
      {
        type: "tool-Grep",
        toolCallId: "grep",
        state: "output-available",
        input: { pattern: "payment-frame", path: "src" },
        output: {
          numFiles: 2,
          filenames: ["src/checkout/PaymentFrame.tsx", "e2e/checkout.spec.ts"],
        },
      },
      {
        type: "tool-Read",
        toolCallId: "read",
        state: "output-available",
        input: { file_path: "e2e/checkout.spec.ts" },
        output: "test('pays with a saved card', async ({ page }) => { ... })",
      },
      {
        type: "tool-TodoWrite",
        toolCallId: "todo",
        state: "output-available",
        input: {
          todos: [
            { content: "Reproduce the flaky run", status: "completed", activeForm: "Reproducing" },
            { content: "Emit a ready event from the frame", status: "completed", activeForm: "Emitting ready" },
            { content: "Wait for ready in the test", status: "completed", activeForm: "Updating the test" },
            { content: "Run the suite 20 times", status: "completed", activeForm: "Running the suite" },
          ],
        },
        output: { success: true },
      },
      {
        type: "tool-Edit",
        toolCallId: "edit",
        state: "output-available",
        input: {
          file_path: "e2e/checkout.spec.ts",
          old_string: "await page.getByRole('button', { name: 'Pay' }).click();",
          new_string:
            "await page.locator('[data-payment-frame][data-ready]').waitFor();\nawait page.getByRole('button', { name: 'Pay' }).click();",
        },
        output: "File updated",
      },
      {
        type: "tool-Bash",
        toolCallId: "bash",
        state: "output-available",
        input: {
          command: "yarn playwright test e2e/checkout.spec.ts --repeat-each 20",
          description: "Run the checkout test 20 times",
        },
        output: "Running 20 tests using 4 workers\n\n  20 passed (41.2s)",
      },
      {
        type: "text",
        text: "The Pay click could land before the payment frame finished loading. The frame now marks itself with `data-ready`, and the test waits for it. **20 of 20 runs pass.**",
      },
      { type: "turn-summary", durationMs: 223_000, tokens: 38_400, tokenBudget: 128_000 },
    ],
  },
];

const FRAME_BEFORE = `import { useEffect, useRef, useState } from 'react';
import { loadPaymentSdk } from './payment-sdk';
import type { PaymentSdk } from './payment-sdk';
import { useCheckout } from './checkout-context';
import classes from './PaymentFrame.module.css';

interface PaymentFrameProps {
  amount: number;
  currency: string;
  onError: (message: string) => void;
}

export function PaymentFrame(props: PaymentFrameProps) {
  const { amount, currency, onError } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { setMethod } = useCheckout();
  const [sdk, setSdk] = useState<PaymentSdk>();

  useEffect(() => {
    let cancelled = false;
    loadPaymentSdk()
      .then((loaded) => {
        if (!cancelled) {
          setSdk(loaded);
        }
      })
      .catch(() => onError('Could not load'));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  useEffect(() => {
    if (!sdk || !ref.current) {
      return;
    }
    const options = { amount, currency };
    const form = sdk.mount(ref.current, options);
    form.on('change', setMethod);
    return () => form.unmount();
  }, [sdk, amount, currency, setMethod]);

  return (
    <div
      ref={ref}
      className={classes.root}
      data-payment-frame
    />
  );
}
`;

const FRAME_AFTER = `import { useEffect, useRef, useState } from 'react';
import { loadPaymentSdk } from './payment-sdk';
import type { PaymentSdk } from './payment-sdk';
import { useCheckout } from './checkout-context';
import classes from './PaymentFrame.module.css';

interface PaymentFrameProps {
  amount: number;
  currency: string;
  onError: (message: string) => void;
  onReady?: () => void;
}

export function PaymentFrame(props: PaymentFrameProps) {
  const { amount, currency, onError, onReady } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { setMethod } = useCheckout();
  const [sdk, setSdk] = useState<PaymentSdk>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPaymentSdk()
      .then((loaded) => {
        if (!cancelled) {
          setSdk(loaded);
        }
      })
      .catch(() => onError('Could not load'));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  useEffect(() => {
    if (!sdk || !ref.current) {
      return;
    }
    const options = { amount, currency };
    const form = sdk.mount(ref.current, options);
    form.on('change', setMethod);
    form.on('ready', () => {
      setReady(true);
      onReady?.();
    });
    return () => form.unmount();
  }, [sdk, amount, currency, setMethod, onReady]);

  return (
    <div
      ref={ref}
      className={classes.root}
      data-payment-frame
      data-ready={ready || undefined}
    />
  );
}
`;

const SPEC_BEFORE = `import { expect, test } from '@playwright/test';
import { seedCart } from './helpers/cart';

test.beforeEach(async ({ page }) => {
  await seedCart(page, [{ sku: 'TSHIRT-M', quantity: 2 }]);
  await page.goto('/checkout');
});

test('pays with a saved card', async ({ page }) => {
  await page.getByLabel('Saved card ending in 4242').check();
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByText('Order confirmed')).toBeVisible();
});
`;

const SPEC_AFTER = `import { expect, test } from '@playwright/test';
import { seedCart } from './helpers/cart';

test.beforeEach(async ({ page }) => {
  await seedCart(page, [{ sku: 'TSHIRT-M', quantity: 2 }]);
  await page.goto('/checkout');
});

test('pays with a saved card', async ({ page }) => {
  await page.getByLabel('Saved card ending in 4242').check();
  await page.locator('[data-payment-frame][data-ready]').waitFor();
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByText('Order confirmed')).toBeVisible();
});
`;

export const PREVIEW_DIFF_SOURCES: DiffSource[] = [
  {
    id: "turn-2",
    label: "Turn 2",
    changes: [
      {
        path: "src/checkout/PaymentFrame.tsx",
        status: "modified",
        oldContent: FRAME_BEFORE,
        newContent: FRAME_AFTER,
        additions: 9,
        deletions: 2,
        language: "tsx",
      },
      {
        path: "e2e/checkout.spec.ts",
        status: "modified",
        oldContent: SPEC_BEFORE,
        newContent: SPEC_AFTER,
        additions: 1,
        deletions: 0,
        language: "ts",
      },
    ],
  },
  {
    id: "uncommitted",
    label: "Uncommitted",
    changes: [
      {
        path: "e2e/checkout.spec.ts",
        status: "modified",
        oldContent: SPEC_BEFORE,
        newContent: SPEC_AFTER,
        additions: 1,
        deletions: 0,
        language: "ts",
      },
    ],
  },
];
