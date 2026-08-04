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

@RegisterTranspilerRule(nodeTypes.Root)
class RootRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const constructorNode = node.children.find(
      (n) => n.type === nodeTypes.ConstructorDecl
    );

    const constructorContent = constructorNode
      ? getTranspilerRule(constructorNode.type).generate(constructorNode, table)
      : undefined;

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

    const className = node.data as string;
    const classSymbol = table?.retrieveSymbol(className, symbolTypes.Class);
    const parentName = classSymbol?.parentClassName;
    const isClass = classSymbol !== undefined;

    return formatRoot(node, declarations, statements, constructorContent, parentName, isClass);
  }
}

export default RootRule;
