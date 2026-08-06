const _sbAnimatedSprites = {
  createAnimatedSprite(imagePath, frameW, frameH) {
    const frames = _sbAssets.getSlices(imagePath, frameW, frameH);
    const pixi = new PIXI.AnimatedSprite(frames);
    pixi.anchor.set(0.5);
    pixi._allFrames = frames;
    pixi._animations = new Map();
    pixi._sbCurrentAnim = null;
    pixi._sbPlaying = false;
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
    handle._sbCurrentAnim = key;
    handle._sbPlaying = true;
    if (!def.loop) {
      handle.onComplete = () => { handle._sbPlaying = false; };
    }
    handle.gotoAndPlay(0);
  },

  isPlayingAnim(handle, name) {
    return (handle._sbCurrentAnim === String(name) && handle._sbPlaying) ? 1 : 0;
  },

  stopAnim(handle) {
    handle.stop();
    handle._sbPlaying = false;
    handle._sbCurrentAnim = null;
  },

  setAnimSpriteSheet(handle, imagePath, frameW, frameH) {
    const frames = _sbAssets.getSlices(imagePath, frameW, frameH);
    handle._allFrames = frames;
    handle._animations = new Map();
    handle._sbCurrentAnim = null;
    handle._sbPlaying = false;
    handle.textures = frames;
    handle.stop();
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
