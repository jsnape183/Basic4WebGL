const _sbAudio = (() => {
  const _cache = new Map();

  return {
    async preloadAudioManifest(manifest) {
      await Promise.all((manifest || []).map((a) => new Promise((resolve) => {
        const sound = PIXI.sound.Sound.from({
          url: a.src,
          preload: true,
          loaded: () => resolve(),
          error: () => resolve(),
        });
        _cache.set(a.name, sound);
      })));
    },

    createSound(name) {
      if (!_cache.has(name)) {
        throw new Error(
          `Audio "${name}" not found. Make sure the filename is correct and included in your assets.`
        );
      }
      return _cache.get(name);
    },

    soundPlay(handle) {
      handle.play();
    },

    soundPlayLoop(handle) {
      handle.stop();
      handle.play({ loop: true });
    },

    soundStop(handle) {
      handle.stop();
    },

    soundSetVolume(handle, volume) {
      handle.volume = Number(volume);
    },

    soundIsPlaying(handle) {
      return handle.isPlaying;
    },
  };
})();
