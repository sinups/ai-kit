import { configure, fn } from '@storybook/test';

export const flowWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let flowRun = 0;

/** Storybook runs several stories in parallel, so async queries get more time than the 1s default */
export function prepareFlow() {
  flowRun += 1;
  configure({ asyncUtilTimeout: 5000 });
}

/**
 * Spy that rejects on its first call within the current play function and resolves after a short
 * delay afterwards. The first call is tracked per `prepareFlow()` run rather than by `mock.calls`,
 * because the test runner reuses the page and spy history is not reliably reset between stories.
 */
export function failFirstCall(message: string, delay = 200) {
  let failedInRun = -1;
  return fn(async (..._args: unknown[]) => {
    await flowWait(delay);
    if (failedInRun !== flowRun) {
      failedInRun = flowRun;
      throw new globalThis.Error(message);
    }
  });
}
