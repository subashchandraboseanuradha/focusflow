// Mock for genkit
const mockSchema = {
  describe: jest.fn(() => mockSchema),
};

module.exports = {
  z: {
    object: jest.fn(() => mockSchema),
    string: jest.fn(() => mockSchema),
    array: jest.fn(() => mockSchema),
    infer: jest.fn(() => ({})),
  },
  defineFlow: jest.fn(() => jest.fn()),
  generate: jest.fn(() => Promise.resolve({})),
  prompt: jest.fn(() => ({})),
  genkit: jest.fn(() => ({
    defineFlow: jest.fn(() => jest.fn()),
    generate: jest.fn(() => Promise.resolve({})),
  })),
};
