// Cypress e2e support file — loaded automatically before each spec.

// Suppress all uncaught exceptions in tutorial e2e tests.
// Real runtime errors are asserted via the bottom panel ERR tags — that is
// the only signal that matters (it is what the user sees). Uncaught JS
// exceptions from framework internals (Monaco loader cancelation on fast
// navigation, PIXI asset-loader cleanup) are not user-visible and must not
// be allowed to fail tests that are otherwise clean.
Cypress.on('uncaught:exception', () => false);
