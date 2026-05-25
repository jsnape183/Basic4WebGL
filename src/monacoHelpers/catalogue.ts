// src/monacoHelpers/catalogue.ts
import { spriteDescriptor } from '../lib/Basic4WebGL/library/descriptors/sprite.descriptor';
import { textDescriptor } from '../lib/Basic4WebGL/library/descriptors/text.descriptor';
import { gfxDescriptor } from '../lib/Basic4WebGL/library/descriptors/gfx.descriptor';
import { drawingDescriptor } from '../lib/Basic4WebGL/library/descriptors/drawing.descriptor';
import { stageDescriptor } from '../lib/Basic4WebGL/library/descriptors/stage.descriptor';
import { penDescriptor } from '../lib/Basic4WebGL/library/descriptors/pen.descriptor';
import { assetmanagerDescriptor } from '../lib/Basic4WebGL/library/descriptors/assetmanager.descriptor';
import type { ClassDescriptor, ModuleDescriptor } from '../lib/Basic4WebGL/library/generator/types';
import { DESCRIPTIONS } from './descriptions';

export interface CatalogueMethod {
  name: string;
  params: string[];
  description: string;
  hasReturn: boolean;
}

export interface CatalogueEntry {
  kind: 'module' | 'class';
  methods: CatalogueMethod[];
  constructorEntry?: CatalogueMethod;
}

function d(module: string, method: string): string {
  return DESCRIPTIONS[module]?.[method] ?? '';
}

function fromModule(desc: ModuleDescriptor): CatalogueEntry {
  return {
    kind: 'module',
    methods: desc.functions.map(f => ({
      name: f.name,
      params: f.params,
      description: d(desc.name, f.name),
      hasReturn: !!f.returns,
    })),
  };
}

function fromClass(desc: ClassDescriptor): CatalogueEntry {
  return {
    kind: 'class',
    constructorEntry: desc.constructor
      ? {
          name: desc.name,
          params: desc.constructor.params,
          description: d(desc.name, 'constructor'),
          hasReturn: false,
        }
      : undefined,
    methods: desc.methods.map(m => ({
      name: m.name,
      params: m.params,
      description: d(desc.name, m.name),
      hasReturn: !!m.returns,
    })),
  };
}

// softCore modules — hand-written .bas files with no TypeScript descriptors
const SOFT_CORE: Record<string, CatalogueEntry> = {
  math: {
    kind: 'module',
    methods: [
      { name: 'abs', params: ['n'], description: d('math', 'abs'), hasReturn: true },
      { name: 'acos', params: ['n'], description: d('math', 'acos'), hasReturn: true },
      { name: 'acosh', params: ['n'], description: d('math', 'acosh'), hasReturn: true },
      { name: 'asin', params: ['n'], description: d('math', 'asin'), hasReturn: true },
      { name: 'asinh', params: ['n'], description: d('math', 'asinh'), hasReturn: true },
      { name: 'atan', params: ['n'], description: d('math', 'atan'), hasReturn: true },
      { name: 'atan2', params: ['n1', 'n2'], description: d('math', 'atan2'), hasReturn: true },
      { name: 'atanh', params: ['n'], description: d('math', 'atanh'), hasReturn: true },
      { name: 'cbrt', params: ['n'], description: d('math', 'cbrt'), hasReturn: true },
      { name: 'ceil', params: ['n'], description: d('math', 'ceil'), hasReturn: true },
      { name: 'cos', params: ['n'], description: d('math', 'cos'), hasReturn: true },
      { name: 'cosh', params: ['n'], description: d('math', 'cosh'), hasReturn: true },
      { name: 'euler', params: [], description: d('math', 'euler'), hasReturn: true },
      { name: 'exp', params: ['n'], description: d('math', 'exp'), hasReturn: true },
      { name: 'floor', params: ['n'], description: d('math', 'floor'), hasReturn: true },
      { name: 'log', params: ['n'], description: d('math', 'log'), hasReturn: true },
      { name: 'log2', params: ['n'], description: d('math', 'log2'), hasReturn: true },
      { name: 'log10', params: ['n'], description: d('math', 'log10'), hasReturn: true },
      { name: 'pi', params: [], description: d('math', 'pi'), hasReturn: true },
      { name: 'pow', params: ['x', 'y'], description: d('math', 'pow'), hasReturn: true },
      { name: 'random', params: ['max'], description: d('math', 'random'), hasReturn: true },
      { name: 'round', params: ['n'], description: d('math', 'round'), hasReturn: true },
      { name: 'sign', params: ['n'], description: d('math', 'sign'), hasReturn: true },
      { name: 'sin', params: ['n'], description: d('math', 'sin'), hasReturn: true },
      { name: 'sinh', params: ['n'], description: d('math', 'sinh'), hasReturn: true },
      { name: 'sqrt', params: ['n'], description: d('math', 'sqrt'), hasReturn: true },
      { name: 'tan', params: ['n'], description: d('math', 'tan'), hasReturn: true },
      { name: 'tanh', params: ['n'], description: d('math', 'tanh'), hasReturn: true },
      { name: 'trunc', params: ['n'], description: d('math', 'trunc'), hasReturn: true },
      { name: 'val', params: ['s'], description: d('math', 'val'), hasReturn: true },
    ],
  },
  string: {
    kind: 'module',
    methods: [
      { name: 'len', params: ['s'], description: d('string', 'len'), hasReturn: true },
      { name: 'lcase', params: ['s'], description: d('string', 'lcase'), hasReturn: true },
      { name: 'ucase', params: ['s'], description: d('string', 'ucase'), hasReturn: true },
      { name: 'str', params: ['n'], description: d('string', 'str'), hasReturn: true },
      { name: 'substr', params: ['s', 'start', 'end'], description: d('string', 'substr'), hasReturn: true },
      { name: 'split', params: ['s', 'c'], description: d('string', 'split'), hasReturn: true },
      { name: 'trim', params: ['s'], description: d('string', 'trim'), hasReturn: true },
      { name: 'padstart', params: ['s', 'n', 'p'], description: d('string', 'padstart'), hasReturn: true },
      { name: 'padend', params: ['s', 'n', 'p'], description: d('string', 'padend'), hasReturn: true },
    ],
  },
  array: {
    kind: 'module',
    methods: [
      { name: 'arrLength', params: ['a'], description: d('array', 'arrLength'), hasReturn: true },
      { name: 'join', params: ['a', 's'], description: d('array', 'join'), hasReturn: true },
    ],
  },
};

// softGfx modules — built from TypeScript descriptors
export const CATALOGUE: Record<string, CatalogueEntry> = {
  ...SOFT_CORE,
  sprite: fromClass(spriteDescriptor),
  text: fromClass(textDescriptor),
  gfx: fromModule(gfxDescriptor),
  drawing: fromModule(drawingDescriptor),
  stage: fromModule(stageDescriptor),
  pen: fromModule(penDescriptor),
  assetmanager: fromModule(assetmanagerDescriptor),
};

export function getModuleMethods(moduleName: string): CatalogueMethod[] {
  return CATALOGUE[moduleName.toLowerCase()]?.methods ?? [];
}

export function getModuleMethod(
  moduleName: string,
  methodName: string
): CatalogueMethod | undefined {
  return getModuleMethods(moduleName).find(
    m => m.name.toLowerCase() === methodName.toLowerCase()
  );
}

export function getConstructor(className: string): CatalogueMethod | undefined {
  return CATALOGUE[className.toLowerCase()]?.constructorEntry;
}

export function isKnownModule(name: string): boolean {
  return name.toLowerCase() in CATALOGUE;
}
