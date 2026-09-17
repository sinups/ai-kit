const { getJestConfig } = require('@storybook/test-runner');

const testRunnerConfig = getJestConfig();

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...testRunnerConfig,
  modulePathIgnorePatterns: ['<rootDir>/ref/', '<rootDir>/site/', '<rootDir>/storybook-static/'],
  testTimeout: 30000,
};
