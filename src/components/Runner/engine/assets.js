const _sbAssets = (() => {
  const _cache = new Map();
  const _sliceCache = new Map();
  let _ready = false;

  // Decode a `data:` URL's payload to text. Handles the `;base64` form the app
  // emits (blobToDataUrl) and the plain percent-encoded form as a fallback.
  function _decodeDataUrlText(dataUrl) {
    const comma = dataUrl.indexOf(',');
    const header = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    if (header.includes(';base64')) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(payload);
  }

  return {
    async preload(manifest) {
      // `.json` / `.stm` are our own text formats. Routing them through
      // PIXI.Assets means PIXI has to pick a loader by sniffing the data: URL's
      // MIME — and if the asset blob was persisted without a `type` (older app
      // versions did this), the URL comes through as `application/octet-stream`,
      // no loader matches, and PIXI resolves `null`. The caller then does
      // `data.tileWidth` on null ("Cannot read properties of null"). Decode
      // these ourselves so loading a `.stm` never depends on MIME sniffing.
      const isText = (name) => /\.(json|stm)$/i.test(name);

      manifest.forEach(({ name, src }) => {
        if (!(isText(name) && typeof src === 'string' && src.startsWith('data:'))) {
          PIXI.Assets.add({ alias: name, src });
        }
      });
      const loads = manifest.map(async ({ name, src }) => {
        if (isText(name) && typeof src === 'string' && src.startsWith('data:')) {
          _cache.set(name, JSON.parse(_decodeDataUrlText(src)));
          return;
        }
        const asset = await PIXI.Assets.load(name);
        _cache.set(name, asset);
      });
      await Promise.all(loads);
      _ready = true;
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

    // Registers a new, named texture cropped from an already-loaded image
    // (or from another previously-defined region) into this same cache, so
    // sprite/tilemap/animatedsprite need no changes at all — they already
    // just call get(name) and use whatever texture comes back. `x`/`y` are
    // relative to `sourceName`'s own frame, not the underlying image, so
    // defining a region of a region composes intuitively rather than
    // silently re-basing to the original image's coordinate space.
    defineRegion(newName, sourceName, x, y, width, height) {
      const source = this.get(sourceName);
      if (_cache.has(newName)) {
        throw Error(`Asset "${newName}" already exists. Choose a different name for this region.`);
      }
      const frame = new PIXI.Rectangle(
        source.frame.x + Number(x),
        source.frame.y + Number(y),
        Number(width),
        Number(height)
      );
      _cache.set(newName, new PIXI.Texture({ source: source.source, frame }));
    },

    // Slices `name`'s texture into a uniform grid of cellW x cellH cell
    // textures, memoized by (name, cellW, cellH) so createTileMap/
    // createAnimatedSprite/createTileMapSet share one derived array instead
    // of each re-deriving an identical one — see roadmap issue #21. `name`
    // may be a real loaded file or a defineRegion result; either way the
    // grid is offset by the base texture's own frame origin (base.frame.x/y)
    // rather than assumed to start at (0,0) of the underlying pixel source —
    // otherwise slicing a defineRegion'd sub-image would silently slice from
    // the wrong part of the original file.
    getSlices(name, cellW, cellH) {
      cellW = Number(cellW);
      cellH = Number(cellH);
      const key = `${name}|${cellW}x${cellH}`;
      if (_sliceCache.has(key)) {
        return _sliceCache.get(key);
      }
      const base = this.get(name);
      const cols = Math.floor(base.width / cellW);
      const rows = Math.floor(base.height / cellH);
      const frames = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          frames.push(
            new PIXI.Texture({
              source: base.source,
              frame: new PIXI.Rectangle(
                base.frame.x + c * cellW,
                base.frame.y + r * cellH,
                cellW,
                cellH
              ),
            })
          );
        }
      }
      _sliceCache.set(key, frames);
      return frames;
    },
  };
})();
