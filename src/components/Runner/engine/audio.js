const _sbAudio = (() => {
  const _cache = new Map();
  const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg']);

  function _isAudio(name) {
    const dot = name.lastIndexOf('.');
    return dot !== -1 && AUDIO_EXTS.has(name.slice(dot).toLowerCase());
  }

  return {
    async preloadAudioFromLocalStorage(projectId) {
      const raw = window.localStorage.getItem('persist:softBASIC');
      if (!raw) return;
      let assetsById = {};
      try {
        const persisted = JSON.parse(raw);
        assetsById = JSON.parse(persisted.assets ?? '{}').byId ?? {};
      } catch (_) { return; }

      const audioAssets = Object.values(assetsById).filter(
        (a) => a.projectId === projectId && _isAudio(a.name)
      );

      await Promise.all(audioAssets.map((a) => new Promise((resolve) => {
        const sound = PIXI.sound.Sound.from({
          url: a.content,
          preload: true,
          loaded: () => resolve(),
          error: () => resolve(),
        });
        _cache.set(a.fullName ?? a.name, sound);
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
