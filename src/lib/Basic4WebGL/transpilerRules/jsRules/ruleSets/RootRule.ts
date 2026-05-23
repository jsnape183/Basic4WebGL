import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
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

    const children = node.children
      .filter((n) => n.type !== nodeTypes.ConstructorDecl)
      .map((n) => `${getTranspilerRule(n.type).generate(n, table)}`);

    return formatRoot(node, children, constructorContent);
  }
}

export default RootRule;
