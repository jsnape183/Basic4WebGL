// AssetManager: preload async, then sync getters only
const _SoftAssetManager = (() => {
  const _cache = new Map(); // name -> loaded content (e.g., Texture)
  let _ready = false;

  return {
    // Call once at startup
    async preload(manifest /* array of { name, src } */) {
      manifest.forEach(({ name, src }) =>
        PIXI.Assets.add({ alias: name, src })
      );

      // Load all by alias and store resolved assets (never Promises)
      const loads = manifest.map(async ({ name }) => {
        const asset = await PIXI.Assets.load(name); // <- await here
        _cache.set(name, asset); // <- store the resolved value
      });
      await Promise.all(loads);
      _ready = true;
    },

    async preloadFromLocalStorage(projectId) {
      // Assets are stored by redux-persist under 'persist:softBASIC'.
      // Each slice is double-encoded: the top-level value is JSON, and
      // state.assets is itself a JSON string containing { byId: {...} }.
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
      await this.preload(assets.map((a) => ({ name: a.name, src: a.content })));
    },

    // Optional: check if preloading is finished
    isReady() {
      return _ready;
    },

    // Synchronous getter (throws if not found)
    get(name) {
      if (!_cache.has(name)) {
        throw Error(
          `Asset "${name}" not found. Make sure the filename is correct and included in your assets.`
        );
      }
      return _cache.get(name);
    },

    // Safe getter (returns undefined if missing)
    tryGet(name) {
      return _cache.get(name);
    },
  };
})();
