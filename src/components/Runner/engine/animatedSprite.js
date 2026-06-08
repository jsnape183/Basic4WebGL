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
    pixi._allFrames = frames;
    pixi._animations = new Map();
    pixi._currentAnim = null;
    pixi._playing = false;
    return pixi;
  },

  addAnim(handle, name, startFrame, endFrame, fps, loop) {
    handle._animations.set(String(name), {
      startFrame: Number(startFrame),
      endFrame:   Number(endFrame),
      fps:        Number(fps),
      loop:       Boolean(loop),
    });
  },

  playAnim(handle, name) {
    const key = String(name);
    const def = handle._animations.get(key);
    if (!def) return;
    handle.textures = handle._allFrames.slice(def.startFrame, def.endFrame + 1);
    handle.animationSpeed = def.fps / 60;
    handle.loop = def.loop;
    handle.onComplete = null;
    handle._currentAnim = key;
    handle._playing = true;
    if (!def.loop) {
      handle.onComplete = () => { handle._playing = false; };
    }
    handle.gotoAndPlay(0);
  },

  isPlayingAnim(handle, name) {
    return (handle._currentAnim === String(name) && handle._playing) ? 1 : 0;
  },

  setAnimAngle(handle, angle) {
    handle.angle = Number(angle);
  },

  setAnimAlpha(handle, a) {
    handle.alpha = Number(a);
  },

  setAnimScale(handle, sx, sy) {
    handle.scale.set(Number(sx), Number(sy));
  },

  setAnimFlip(handle, h, v) {
    handle.scale.x = h ? -Math.abs(handle.scale.x) : Math.abs(handle.scale.x);
    handle.scale.y = v ? -Math.abs(handle.scale.y) : Math.abs(handle.scale.y);
  },

  setAnimVisible(handle, v) {
    handle.visible = Boolean(v);
  },

  getAnimWidth(handle) {
    return handle.width;
  },

  getAnimHeight(handle) {
    return handle.height;
  },
};
