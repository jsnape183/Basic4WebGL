// Cypress e2e support file — loaded automatically before each spec.

// PIXI v8 fires benign internal cancelation rejections from its asset-loader
// promise cache. The engine filters these, but as a safety net we also suppress
// them here so Cypress doesn't fail the test if one slips through.
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('"type":"cancelation"')) return false;
  return true;
});
