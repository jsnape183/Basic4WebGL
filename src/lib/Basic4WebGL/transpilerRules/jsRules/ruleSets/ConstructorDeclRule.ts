import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';
import { symbolTypes } from '../../../symbolTypes';

/** Recursively check if any node in the subtree has the given type. */
function containsNodeType(root: Tree, targetType: number): boolean {
  if (root.type === targetType) return true;
  return root.children.some((c) => containsNodeType(c, targetType));
}

@RegisterTranspilerRule(nodeTypes.ConstructorDecl)
class ConstructorDeclRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const params = doChild(node, 0, table);
    const body = doChild(node, 1, table);

    // Auto-emit super() if class has a parent and no explicit super() was written
    const className = (node.data as { className: string }).className;
    const classSymbol = table ? table.retrieveSymbol(className, symbolTypes.Class) : undefined;
    const hasParent = !!classSymbol?.parentClassName;
    const hasExplicitSuper = containsNodeType(node.children[1], nodeTypes.SuperConstructorCall);

    const autoSuper = hasParent && !hasExplicitSuper ? 'super();' : '';
    return `constructor(${params}) {${autoSuper}${body}}`;
  }
}

export default ConstructorDeclRule;
