// Cypress e2e support file — loaded automatically before each spec.

// @monaco-editor/loader and PIXI v8 both use the same cancelation pattern
// ({type:"cancelation",msg:"operation is manually canceled"}) for benign async
// cleanup when components unmount before async init completes. When this arrives
// as a plain-object rejection, Cypress sets err.message to '[object Object]'
// rather than the JSON string, so we match on 'manually canceled' which appears
// in the serialised form regardless of how the error is wrapped.
Cypress.on('uncaught:exception', (err) => {
  const msg = err.message ?? '';
  if (msg.includes('cancelation') || msg.includes('manually canceled') || msg === '[object Object]') return false;
  return true;
});
