import { describe, test, expect } from 'vitest';
import { validateFileName, normaliseFileName } from '../../../src/utils/fileNameValidation';

// ---------------------------------------------------------------------------
// validateFileName
// ---------------------------------------------------------------------------

describe('validateFileName', () => {
  describe('valid names', () => {
    test('accepts a plain letter name', () => {
      expect(validateFileName('Main')).toBeNull();
    });

    test('accepts a name with letters and numbers', () => {
      expect(validateFileName('Car2D')).toBeNull();
    });

    test('accepts a name that already has .bas extension', () => {
      expect(validateFileName('Main.bas')).toBeNull();
    });

    test('accepts a name with .BAS extension (case-insensitive)', () => {
      expect(validateFileName('Main.BAS')).toBeNull();
    });

    test('accepts a single letter', () => {
      expect(validateFileName('A')).toBeNull();
    });

    test('accepts a name that ends with a number', () => {
      expect(validateFileName('Level1')).toBeNull();
    });
  });

  describe('invalid names', () => {
    test('rejects empty string', () => {
      expect(validateFileName('')).not.toBeNull();
    });

    test('rejects name starting with a number', () => {
      expect(validateFileName('1Main')).not.toBeNull();
    });

    test('rejects name with underscore', () => {
      expect(validateFileName('my_file')).not.toBeNull();
    });

    test('rejects name with hyphen', () => {
      expect(validateFileName('my-file')).not.toBeNull();
    });

    test('rejects name with space', () => {
      expect(validateFileName('my file')).not.toBeNull();
    });

    test('rejects name with special characters', () => {
      expect(validateFileName('my@file')).not.toBeNull();
    });

    test('rejects name that is just .bas', () => {
      expect(validateFileName('.bas')).not.toBeNull();
    });
  });

  describe('error messages', () => {
    test('empty string gives "must not be empty" message', () => {
      expect(validateFileName('')).toMatch(/empty/i);
    });

    test('name starting with digit gives "must start with a letter" message', () => {
      expect(validateFileName('1abc')).toMatch(/letter/i);
    });

    test('name with invalid characters gives appropriate message', () => {
      expect(validateFileName('my_file')).toMatch(/letters and numbers/i);
    });
  });
});

// ---------------------------------------------------------------------------
// normaliseFileName
// ---------------------------------------------------------------------------

describe('normaliseFileName', () => {
  test('appends .bas when no extension present', () => {
    expect(normaliseFileName('Main')).toBe('Main.bas');
  });

  test('does not append .bas when .bas already present', () => {
    expect(normaliseFileName('Main.bas')).toBe('Main.bas');
  });

  test('does not append .bas when .BAS present (case-insensitive)', () => {
    expect(normaliseFileName('Main.BAS')).toBe('Main.BAS');
  });

  test('does not double-append .bas', () => {
    expect(normaliseFileName('Main.bas.bas')).toBe('Main.bas.bas');
  });

  test('appends .bas to a name with numbers', () => {
    expect(normaliseFileName('Car2D')).toBe('Car2D.bas');
  });
});
