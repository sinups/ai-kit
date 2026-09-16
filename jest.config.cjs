module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/package/src'],
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: ['./jsdom.mocks.cjs'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
};
