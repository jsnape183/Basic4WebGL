const _sbTween = {
  _playing: new Map(), // spriteObj -> { frames: [...sorted by time], loop, elapsed, channels }

  tweenPlay(spriteObj, frames, loop) {
    if (!spriteObj || !spriteObj._handle || !frames || frames.length === 0) return;
    const sorted = [...frames].sort((a, b) => a.time - b.time);
    // A channel (angle/scaleX/scaleY/alpha/position) is only ever written to
    // the handle if at least one keyframe in this sequence explicitly set it
    // (Keyframe's has* fields, flipped true by its setters) -- otherwise
    // that channel is left alone for the whole tween, under whatever else is
    // controlling it (setVelocity-driven movement, manual setAngle, etc).
    // Previously every channel was written every frame regardless, defaulting
    // untouched ones to Keyframe's neutral values (position 0,0 included) --
    // that unconditional write is exactly what forced every tween in this
    // codebase to either explicitly re-specify position on every keyframe or
    // have it silently frozen/snapped, the same bug hit and fixed by hand
    // three separate times this session (the player's own spin, the sword,
    // and twice for enemy/boss attack telegraphs).
    const channels = {
      angle: sorted.some((f) => f.hasangle),
      scaleX: sorted.some((f) => f.hasscalex),
      scaleY: sorted.some((f) => f.hasscaley),
      alpha: sorted.some((f) => f.hasalpha),
      position: sorted.some((f) => f.hasposition),
    };
    this._playing.set(spriteObj, { frames: sorted, loop: !!loop, elapsed: 0, channels });
  },

  tweenStop(spriteObj) {
    if (spriteObj && spriteObj._handle) this._playing.delete(spriteObj);
  },

  tweenIsPlaying(spriteObj) {
    return !!(spriteObj && spriteObj._handle && this._playing.has(spriteObj));
  },

  _tweenUpdate(delta) {
    const dt = delta / 1000;
    for (const [spriteObj, state] of this._playing) {
      if (!this._sbInstances.includes(spriteObj)) {
        this._playing.delete(spriteObj);
        continue;
      }
      const handle = spriteObj._handle;
      state.elapsed += dt;
      const { frames, loop, channels } = state;
      const last = frames[frames.length - 1];
      let t = state.elapsed;

      if (loop) {
        t = t % last.time;
      } else if (t >= last.time) {
        // last is a raw Keyframe instance (lowercase scalex/scaley) -- remap
        // to _applyFrame's camelCase shape, same as the interpolation branch
        // below does. Passing `last` straight through here previously left
        // v.scaleX/v.scaleY undefined, which PIXI's scale.set() silently
        // treated as 0, collapsing the sprite's scale to nothing the instant
        // any non-looping tween finished.
        this._applyFrame(channels, handle, {
          angle: last.angle,
          scaleX: last.scalex,
          scaleY: last.scaley,
          alpha: last.alpha,
          x: last.x,
          y: last.y,
        });
        this._playing.delete(spriteObj);
        continue;
      }

      let i = 0;
      while (i < frames.length - 1 && frames[i + 1].time <= t) i++;
      const a = frames[i];
      const b = frames[Math.min(i + 1, frames.length - 1)];
      const span = b.time - a.time;
      // Clamping to 0 handles t before frames[0].time too: with i at its
      // natural starting value (a = frames[0], b = frames[1]), a negative
      // raw ratio clamps to 0 and the lerp below evaluates to exactly a's
      // values -- i.e. snaps to the first keyframe.
      const f = span > 0 ? Math.max(0, (t - a.time) / span) : 0;

      // Keyframe's softBASIC fields scaleX/scaleY compile to lowercase
      // scalex/scaley -- read those, not the camelCase names.
      this._applyFrame(channels, handle, {
        angle: a.angle + (b.angle - a.angle) * f,
        scaleX: a.scalex + (b.scalex - a.scalex) * f,
        scaleY: a.scaley + (b.scaley - a.scaley) * f,
        alpha: a.alpha + (b.alpha - a.alpha) * f,
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
      });
    }
  },

  // Only writes a channel to the handle if `channels` says this tween
  // actually controls it -- see the comment in tweenPlay. Position (x/y) is
  // written together since Keyframe only exposes a combined setPosition,
  // never independent setX/setY.
  _applyFrame(channels, handle, v) {
    if (channels.angle) handle.angle = v.angle;
    if (channels.scaleX) handle.scale.x = v.scaleX;
    if (channels.scaleY) handle.scale.y = v.scaleY;
    if (channels.alpha) handle.alpha = v.alpha;
    if (channels.position) handle.position.set(v.x, v.y);
  },
};
