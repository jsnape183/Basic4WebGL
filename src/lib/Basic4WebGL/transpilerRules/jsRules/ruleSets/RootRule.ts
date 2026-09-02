import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { formatRoot } from '../helpers/transpilerHelpers';

// Array / dict / typed-array class fields are initialised per-instance in the
// constructor rather than once on the prototype (roadmap #35 — a prototype
// initializer meant two live instances shared one array/dict object). The Dim /
// DictionaryDim / TypedArrayDim rules emit `this.x = ...` for a class-scope
// field; RootRule pulls those nodes out of the module-level statement partition
// (where `this` would be invalid) and injects them into the constructor.
const FIELD_INIT_TYPES = [
  nodeTypes.Dim,
  nodeTypes.DictionaryDim,
  nodeTypes.TypedArrayDim,
];

/**
 * Splice per-instance field initialisers into a generated `constructor(...) {..}`
 * string. For a derived class they must run after the super() call (you cannot
 * touch `this` before super() in JS); for a base class they go first.
 */
function injectFieldInits(
  ctorStr: string,
  fieldInits: string,
  hasParent: boolean
): string {
  const braceIdx = ctorStr.indexOf('{');
  if (braceIdx === -1) return ctorStr;

  if (hasParent) {
    const superIdx = ctorStr.indexOf('super(', braceIdx);
    if (superIdx !== -1) {
      let i = superIdx + 'super('.length;
      let depth = 1;
      for (; i < ctorStr.length && depth > 0; i += 1) {
        if (ctorStr[i] === '(') depth += 1;
        else if (ctorStr[i] === ')') depth -= 1;
      }
      if (ctorStr[i] === ';') i += 1;
      return ctorStr.slice(0, i) + fieldInits + ctorStr.slice(i);
    }
  }

  return ctorStr.slice(0, braceIdx + 1) + fieldInits + ctorStr.slice(braceIdx + 1);
}

@RegisterTranspilerRule(nodeTypes.Root)
class RootRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const constructorNode = node.children.find(
      (n) => n.type === nodeTypes.ConstructorDecl
    );

    const className = node.data as string;
    const classSymbol = table?.retrieveSymbol(className, symbolTypes.Class);
    const parentName = classSymbol?.parentClassName;
    const isClass = classSymbol !== undefined;

    const fieldInitNodes = isClass
      ? node.children.filter((n) => FIELD_INIT_TYPES.includes(n.type))
      : [];
    const fieldInits = fieldInitNodes
      .map((n) => getTranspilerRule(n.type).generate(n, table))
      .join('');

    let constructorContent = constructorNode
      ? getTranspilerRule(constructorNode.type).generate(constructorNode, table)
      : undefined;

    if (isClass && fieldInits) {
      if (constructorContent) {
        constructorContent = injectFieldInits(
          constructorContent,
          fieldInits,
          !!parentName
        );
      } else {
        const autoSuper = parentName ? 'super();' : '';
        constructorContent = `constructor() {${autoSuper}${fieldInits}}`;
      }
    }

    // Two-phase module initialisation. Function declarations are inert —
    // they only bind a property to a function — so they can safely run before
    // assets preload, which is what makes `oninit` possible. Everything else
    // at root level is an executable statement that may touch assets (a
    // module-level `dim hero = new sprite("hero.png")`, a scene registration,
    // a class-level `dim` prototype default) and is deferred until after
    // preloading. Generate in source order first, then partition, so no rule
    // sees a different traversal order than it did before.
    const generated = node.children
      .filter((n) => n.type !== nodeTypes.ConstructorDecl)
      // Class array/dict/typed-array field nodes are emitted into the
      // constructor above, not at module level.
      .filter((n) => !(isClass && FIELD_INIT_TYPES.includes(n.type)))
      .map((n) => {
        const code = `${getTranspilerRule(n.type).generate(n, table)}`;
        return {
          // Nodes that generate nothing (Empty nodes from blank lines) stay
          // where they are so the emitted separators are unchanged — only
          // real, executable statements move.
          isDeferred: n.type !== nodeTypes.FunctionDecl && code.trim() !== '',
          code,
        };
      });

    const declarations = generated.filter((g) => !g.isDeferred).map((g) => g.code);
    const statements = generated.filter((g) => g.isDeferred).map((g) => g.code);

    return formatRoot(node, declarations, statements, constructorContent, parentName, isClass);
  }
}

export default RootRule;
