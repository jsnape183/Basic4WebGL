const _sbFile = (() => {
  const STORAGE_PREFIX = 'sb_files:';

  function readAll(projectId) {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + projectId);
    if (!raw) return Object.create(null);
    try {
      return Object.assign(Object.create(null), JSON.parse(raw));
    } catch (_) {
      return Object.create(null);
    }
  }

  function writeAll(projectId, files) {
    // Lets QuotaExceededError (or any other localStorage.setItem failure)
    // propagate — the caller's call("...") site is inside the game's own
    // try/catch-wrapped update loop, so it surfaces as a normal runtime error.
    window.localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(files));
  }

  return {
    fileWrite(path, content) {
      const files = readAll(_sbProjectId);
      files[path] = content;
      writeAll(_sbProjectId, files);
    },
    fileRead(path) {
      const files = readAll(_sbProjectId);
      return files[path] ?? '';
    },
    fileExists(path) {
      const files = readAll(_sbProjectId);
      return Object.prototype.hasOwnProperty.call(files, path);
    },
    fileDelete(path) {
      const files = readAll(_sbProjectId);
      delete files[path];
      writeAll(_sbProjectId, files);
    },
  };
})();
