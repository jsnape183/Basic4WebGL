import { test, expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import nodeTypes from '@Basic4WebGL/nodeTypes';

const project: CompilerProject = {
  lib: [],
  files: [],
};

test('prints hello world', () => {
  project.files.push({ name: 'Main.bas', source: 'Print "Hello, World!"' });
  const result = compiler.parse(project);
  expect(result).toBeDefined();
  expect(result.symbolTable.getAll().length).toBe(0);
  expect(result.results.length).toBe(1);
  expect(result.results[0].tree).toBeDefined();
  expect(result.results[0].tree.type).toBe(nodeTypes.Root);
  expect(result.results[0].tree.children.length).toBe(1);
  expect(result.results[0].tree.children[0].type).toBe(nodeTypes.Print);
  expect(result.results[0].tree.children[0].children.length).toBe(1);
  expect(result.results[0].tree.children[0].children[0].type).toBe(
    nodeTypes.Term
  );

  expect(result.results[0].tree.children[0].children[0].children.length).toBe(
    1
  );
  expect(result.results[0].tree.children[0].children[0].children[0].type).toBe(
    nodeTypes.String
  );
  expect(result.results[0].tree.children[0].children[0].data).toBe(
    '"Hello, World!"'
  );
});
