// Mock for @/ai/genkit
module.exports = {
  ai: {
    defineFlow: jest.fn(() => jest.fn()),
    generate: jest.fn(() => Promise.resolve({})),
  },
};
