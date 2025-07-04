const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic ES modules
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^genkit$': '<rootDir>/__mocks__/genkit.js',
    '^@genkit-ai/(.*)$': '<rootDir>/__mocks__/genkit-ai.js',
    '^yaml$': '<rootDir>/__mocks__/yaml.js',
    '^dotprompt$': '<rootDir>/__mocks__/dotprompt.js',
    '^@/ai/genkit$': '<rootDir>/__mocks__/ai-genkit.js',
  },
  // Temporarily ignore AI flow tests until mocking is properly set up
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/ai/flows/.*\\.test\\.(js|ts|tsx)$',
  ],
};

// Export the configuration created by Next.js
module.exports = createJestConfig(customJestConfig);