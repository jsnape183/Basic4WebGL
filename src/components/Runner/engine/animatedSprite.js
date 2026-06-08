const _sbAnimatedSprites = {
  createAnimatedSprite(imagePath, frameW, frameH) {
    const base = _sbAssets.get(imagePath);
    const cols = Math.floor(base.width / frameW);
    const rows = Math.floor(base.height / frameH);
    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push(
          new PIXI.Texture({
            source: base.source,
            frame: new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH),
          })
        );
      }
    }
    const pixi = new PIXI.AnimatedSprite(frames);
    pixi.anchor.set(0.5);
    app.stage.addChild(pixi);
    return { pixi, frames, animations: new Map(), currentAnim: null, playing: false };
  },

  addAnim(handle, name, startFrame, endFrame, fps, loop) {
    handle.animations.set(String(name), {
      startFrame: Number(startFrame),
      endFrame:   Number(endFrame),
      fps:        Number(fps),
      loop:       Boolean(loop),
    });
  },

  playAnim(handle, name) {
    const key = String(name);
    const def = handle.animations.get(key);
    if (!def) return;
    handle.pixi.textures = handle.frames.slice(def.startFrame, def.endFrame + 1);
    handle.pixi.animationSpeed = def.fps / 60;
    handle.pixi.loop = def.loop;
    handle.pixi.onComplete = null;
    handle.currentAnim = key;
    handle.playing = true;
    if (!def.loop) {
      handle.pixi.onComplete = () => { handle.playing = false; };
    }
    handle.pixi.gotoAndPlay(0);
  },

  isPlayingAnim(handle, name) {
    return (handle.currentAnim === String(name) && handle.playing) ? 1 : 0;
  },

  setAnimAngle(handle, angle) {
    handle.pixi.angle = Number(angle);
  },

  setAnimAlpha(handle, a) {
    handle.pixi.alpha = Number(a);
  },

  setAnimScale(handle, sx, sy) {
    handle.pixi.scale.set(Number(sx), Number(sy));
  },

  setAnimFlip(handle, h, v) {
    handle.pixi.scale.x = h ? -Math.abs(handle.pixi.scale.x) : Math.abs(handle.pixi.scale.x);
    handle.pixi.scale.y = v ? -Math.abs(handle.pixi.scale.y) : Math.abs(handle.pixi.scale.y);
  },

  setAnimVisible(handle, v) {
    handle.pixi.visible = Boolean(v);
  },

  getAnimWidth(handle) {
    return handle.pixi.width;
  },

  getAnimHeight(handle) {
    return handle.pixi.height;
  },
};
