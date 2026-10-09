const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  testMatch: [
    '**/hooks/use-streamed-text.test.ts',
    '**/MessageList/MessageList.streaming-phase.test.tsx',
    '**/MessageList/MessageList.streaming.test.tsx',
    '**/MessageList/MessageList.jump.test.tsx',
    '**/MessageList/MessageList.hold.test.tsx',
  ],
};
