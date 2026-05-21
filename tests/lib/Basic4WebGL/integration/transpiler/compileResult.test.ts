import { describe, test, expect, beforeEach } from 'vitest';
import compiler from '@Basic4WebGL/index';
import type { CompilerProject } from '@CompilerLib/compiler/types';

const project: CompilerProject = { lib: [], files: [] };
beforeEach(() => { project.files = []; });

describe('compiler.transpile() returns CompileResult', () => {
  test('successful compile has code and empty diagnostics', () => {
    project.files.push({ name: 'Main.bas', source: 'print 1' });
    const result = compiler.transpile(project);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toBeDefined();
    expect(result.code).toContain('_print(1)');
  });

  test('code is undefined on failure', () => {
    project.files.push({ name: 'Main.bas', source: 'dim' });
    const result = compiler.transpile(project);
    expect(result.code).toBeUndefined();
  });

  test('failure produces exactly one error diagnostic', () => {
    project.files.push({ name: 'Main.bas', source: 'dim' });
    const result = compiler.transpile(project);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].severity).toBe('error');
  });

  test('diagnostic carries loc with filename on failure', () => {
    project.files.push({ name: 'Main.bas', source: 'dim' });
    const result = compiler.transpile(project);
    expect(result.diagnostics[0].loc).toBeDefined();
    expect(result.diagnostics[0].loc?.filename).toBe('Main.bas');
  });

  test('diagnostic loc line is greater than zero', () => {
    project.files.push({ name: 'Main.bas', source: 'print 1\ndim' });
    const result = compiler.transpile(project);
    expect(result.diagnostics[0].loc?.line).toBeGreaterThan(0);
  });

  test('sourceMap is undefined (Tier C not yet implemented)', () => {
    project.files.push({ name: 'Main.bas', source: 'print 1' });
    const result = compiler.transpile(project);
    expect(result.sourceMap).toBeUndefined();
  });
});
