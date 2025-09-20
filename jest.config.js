module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};