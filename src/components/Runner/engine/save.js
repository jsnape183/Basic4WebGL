const _sbSave = (() => {
  const SAVE_PATH = 'save.json';

  // Dictionaries are Map-backed at runtime (see _createDict in bootstrapper.html)
  // — bare JSON.stringify/parse would silently turn one into "{}". This walks
  // arrays/Maps recursively so a dict-in-array-in-dict round-trips correctly.
  function encode(value) {
    if (value instanceof Map) {
      return { __sbType: 'dict', entries: Array.from(value.entries()).map(([k, v]) => [k, encode(v)]) };
    }
    if (Array.isArray(value)) return value.map(encode);
    return value;
  }

  function decode(value) {
    if (value && typeof value === 'object' && value.__sbType === 'dict') {
      return new Map(value.entries.map(([k, v]) => [k, decode(v)]));
    }
    if (Array.isArray(value)) return value.map(decode);
    return value;
  }

  function readBlob() {
    const raw = _sbFile.fileRead(SAVE_PATH);
    if (!raw) return new Map();
    try {
      return decode(JSON.parse(raw));
    } catch (_) {
      return new Map();
    }
  }

  function writeBlob(blob) {
    _sbFile.fileWrite(SAVE_PATH, JSON.stringify(encode(blob)));
  }

  return {
    saveSet(key, value) {
      const blob = readBlob();
      blob.set(key, value);
      writeBlob(blob);
    },
    saveGet(key) {
      return readBlob().get(key) ?? '';
    },
    saveExists(key) {
      return readBlob().has(key);
    },
    saveDelete(key) {
      const blob = readBlob();
      blob.delete(key);
      writeBlob(blob);
    },
    saveSetAll(dict) {
      writeBlob(dict instanceof Map ? dict : new Map());
    },
    saveGetAll() {
      return readBlob();
    },
  };
})();
