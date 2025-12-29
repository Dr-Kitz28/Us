// Jest setup file
// Add global test utilities or mocks here

global.console = {
  ...console,
  error: jest.fn(), // Suppress console.error in tests
  warn: jest.fn(),  // Suppress console.warn in tests
};
