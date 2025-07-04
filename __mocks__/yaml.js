// Mock for yaml
module.exports = {
  parse: jest.fn(() => ({})),
  stringify: jest.fn(() => ''),
};
