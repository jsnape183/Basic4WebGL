const _sbTween = {
  _playing: new Map(), // handle -> { frames: [...sorted by time], loop, elapsed }

  tweenPlay(spriteObj, frames, loop) {
    if (!spriteObj || !spriteObj._handle || !frames || frames.length === 0) return;
    const sorted = [...frames].sort((a, b) => a.time - b.time);
    this._playing.set(spriteObj._handle, { frames: sorted, loop: !!loop, elapsed: 0 });
  },

  tweenStop(spriteObj) {
    if (spriteObj && spriteObj._handle) this._playing.delete(spriteObj._handle);
  },

  tweenIsPlaying(spriteObj) {
    return !!(spriteObj && spriteObj._handle && this._playing.has(spriteObj._handle));
  },

  _tweenUpdate(delta) {
    const dt = delta / 1000;
    for (const [handle, state] of this._playing) {
      state.elapsed += dt;
      const { frames, loop } = state;
      const last = frames[frames.length - 1];
      let t = state.elapsed;

      if (loop) {
        t = t % last.time;
      } else if (t >= last.time) {
        this._applyFrame(handle, last);
        this._playing.delete(handle);
        continue;
      }

      // If we're before the first keyframe, snap to its values
      if (t < frames[0].time) {
        this._applyFrame(handle, {
          angle: frames[0].angle,
          scaleX: frames[0].scalex,
          scaleY: frames[0].scaley,
          alpha: frames[0].alpha,
          x: frames[0].x,
          y: frames[0].y,
        });
        continue;
      }

      let i = 0;
      while (i < frames.length - 1 && frames[i + 1].time <= t) i++;
      const a = frames[i];
      const b = frames[Math.min(i + 1, frames.length - 1)];
      const span = b.time - a.time;
      const f = span > 0 ? (t - a.time) / span : 0;

      // Keyframe's softBASIC fields scaleX/scaleY compile to lowercase
      // scalex/scaley -- read those, not the camelCase names.
      this._applyFrame(handle, {
        angle: a.angle + (b.angle - a.angle) * f,
        scaleX: a.scalex + (b.scalex - a.scalex) * f,
        scaleY: a.scaley + (b.scaley - a.scaley) * f,
        alpha: a.alpha + (b.alpha - a.alpha) * f,
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
      });
    }
  },

  _applyFrame(handle, v) {
    handle.angle = v.angle;
    handle.scale.set(v.scaleX, v.scaleY);
    handle.alpha = v.alpha;
    handle.position.set(v.x, v.y);
  },
};
