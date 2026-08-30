import '@testing-library/jest-dom';
// This registers DOM matchers (toBeInTheDocument, toHaveTextContent, etc.)
// for all test files. Per-test jsdom environment is enabled via
// the `// @vitest-environment jsdom` comment at the top of each UI test file.

// Provides a spec-compliant in-memory `indexedDB` global for both the `node`
// and `jsdom` Vitest environments, so anything that touches `localforage`
// (the persist adapter, the asset blob store) works in unit tests without a
// real browser. Harmless for tests that never use it.
import 'fake-indexeddb/auto';
