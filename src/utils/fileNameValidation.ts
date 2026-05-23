/**
 * Validates a softBASIC filename stem (with or without .bas extension).
 *
 * Rules:
 *  - Must not be empty
 *  - Must start with a letter (a-z / A-Z)
 *  - Remaining characters must be letters or digits only (no underscores, hyphens, spaces, etc.)
 *
 * The .bas extension is stripped before validation so callers can pass either form.
 *
 * @returns null when the name is valid, or an error message string when invalid.
 */
export function validateFileName(name: string): string | null {
  const stem = stripBasExtension(name);

  if (stem.length === 0) {
    return 'File name must not be empty.';
  }

  if (!/^[A-Za-z]/.test(stem)) {
    return 'File name must start with a letter.';
  }

  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(stem)) {
    return 'File name may only contain letters and numbers.';
  }

  return null;
}

/**
 * Ensures the filename ends with .bas.
 * If the name already ends with .bas (case-insensitive) it is returned unchanged.
 * Otherwise ".bas" is appended.
 */
export function normaliseFileName(name: string): string {
  if (name.toLowerCase().endsWith('.bas')) {
    return name;
  }
  return `${name}.bas`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function stripBasExtension(name: string): string {
  if (name.toLowerCase().endsWith('.bas')) {
    return name.slice(0, -4);
  }
  return name;
}
