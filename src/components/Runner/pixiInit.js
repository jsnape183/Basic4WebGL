let app = new PIXI.Application();
app
  .init({
    background: '#1099bb',
    resizeTo: window, // optional: auto-resize
    width: 640,
    height: 360,
    // view: document.createElement('canvas'), // optional: provide your own
  })
  .then(() => {
    app.stage.interactive = true;

    document.body.appendChild(app.canvas);
    app.view.focus();
    app.ticker.add((ticker) => _SoftBasicGfx.getInstance()._update(ticker.deltaTime));
    _sb_globalOnEnter();
  });
