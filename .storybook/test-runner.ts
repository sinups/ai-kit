import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'playwright';
import { getStoryContext, waitForPageReady, type TestRunnerConfig } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

const VISUAL_MODE = process.env.VISUAL;
const VISUAL = VISUAL_MODE === '1' || VISUAL_MODE === 'update';
const VISUAL_FILTER = process.env.VISUAL_FILTER ? new RegExp(process.env.VISUAL_FILTER) : null;
const ROOT = process.cwd();
const SNAPSHOTS_DIR = path.join(ROOT, 'package/__visual__');
const DIFF_DIR = path.join(ROOT, 'storybook-visual-diff');
const RECEIVED_DIR = path.join(DIFF_DIR, 'received');
const THEMES = ['light', 'dark'] as const;
// Stories that show elapsed time or dates read `Date.now()`; a fixed date keeps both sides of the comparison equal, timers still run.
const FIXED_NOW = new Date('2026-01-15T10:00:00Z');

const FREEZE_CSS = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;

async function settle(page: Page) {
  await waitForPageReady(page);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

async function setTheme(page: Page, theme: (typeof THEMES)[number]) {
  await page.evaluate((value) => {
    const channel = (
      window as unknown as { __STORYBOOK_ADDONS_CHANNEL__?: { emit: (...args: unknown[]) => void } }
    ).__STORYBOOK_ADDONS_CHANNEL__;
    channel?.emit('updateGlobals', { globals: { theme: value } });
  }, theme);
  await page.waitForFunction(
    (value) => document.documentElement.getAttribute('data-mantine-color-scheme') === value,
    theme
  );
}

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },

  async preVisit(page) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.clock.setFixedTime(FIXED_NOW);
  },

  async postVisit(page, context) {
    if (!VISUAL || (VISUAL_FILTER && !VISUAL_FILTER.test(context.id))) {
      return;
    }
    const storyContext = await getStoryContext(page, context);
    const tags = storyContext.tags ?? [];
    if (tags.includes('skip-visual') || storyContext.parameters?.visual?.skip) {
      return;
    }

    const identifier = (theme: string) => `${context.id}--${theme}`;
    const hasBaseline = THEMES.every((theme) =>
      fs.existsSync(path.join(SNAPSHOTS_DIR, `${identifier(theme)}.png`))
    );
    if (!hasBaseline && VISUAL_MODE !== 'update') {
      process.stdout.write(
        `visual: ${context.id} has no baseline in the base Storybook, skipped\n`
      );
      return;
    }

    await page.addStyleTag({ content: FREEZE_CSS });
    for (const theme of THEMES) {
      await setTheme(page, theme);
      await settle(page);
      const image = await page.screenshot({ fullPage: false, animations: 'disabled' });
      expect(image).toMatchImageSnapshot({
        customSnapshotsDir: SNAPSHOTS_DIR,
        customSnapshotIdentifier: identifier(theme),
        customDiffDir: DIFF_DIR,
        storeReceivedOnFailure: true,
        customReceivedDir: RECEIVED_DIR,
        failureThreshold: Number(process.env.VISUAL_THRESHOLD_PX ?? 20),
        failureThresholdType: 'pixel',
        comparisonMethod: 'pixelmatch',
        customDiffConfig: { threshold: 0.1 },
      });
    }
  },
};

export default config;
