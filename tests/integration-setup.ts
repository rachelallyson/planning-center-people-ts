// Integration test setup file
// This file runs before integration tests
// Unlike the regular setup.ts, this does NOT mock fetch since we need real HTTP requests

// Note: We do NOT mock fetch for integration tests
// global.fetch remains the native fetch implementation

// Clean up after all tests
afterAll(() => {
  // Any necessary cleanup
});

