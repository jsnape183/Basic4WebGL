const _sbAssets = (() => {
  const _cache = new Map();
  let _ready = false;

  return {
    async preload(manifest) {
      manifest.forEach(({ name, src }) =>
        PIXI.Assets.add({ alias: name, src })
      );
      const loads = manifest.map(async ({ name }) => {
        const asset = await PIXI.Assets.load(name);
        _cache.set(name, asset);
      });
      await Promise.all(loads);
      _ready = true;
    },

    async preloadFromLocalStorage(projectId) {
      const raw = window.localStorage.getItem('persist:softBASIC');
      if (!raw) { _ready = true; return; }
      let assetsById = {};
      try {
        const persisted = JSON.parse(raw);
        assetsById = JSON.parse(persisted.assets ?? '{}').byId ?? {};
      } catch (_) {
        _ready = true;
        return;
      }
      const assets = Object.values(assetsById).filter((a) => a.projectId === projectId);
      if (assets.length === 0) { _ready = true; return; }
      await this.preload(assets.map((a) => ({ name: a.fullName ?? a.name, src: a.content })));
    },

    isReady() {
      return _ready;
    },

    get(name) {
      // Only reachable from oninit(), which runs before preloading starts.
      // Everywhere else in the boot sequence _ready is already true, so the
      // generic "check the filename" message below would be actively
      // misleading here — the filename is usually fine, the timing isn't.
      if (!_ready) {
        throw Error(`Assets are not loaded yet — "${name}" cannot be used inside oninit(). Assets finish loading after oninit() runs, so create sprites in onenter() instead.`);
      }
      if (!_cache.has(name)) {
        throw Error(`Asset "${name}" not found. Make sure the filename is correct and included in your assets.`);
      }
      return _cache.get(name);
    },

    tryGet(name) {
      return _cache.get(name);
    },
  };
})();
