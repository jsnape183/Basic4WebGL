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

    const children = node.children
      .filter((n) => n.type !== nodeTypes.ConstructorDecl)
      .map((n) => `${getTranspilerRule(n.type).generate(n, table)}`);

    const className = node.data as string;
    const classSymbol = table?.retrieveSymbol(className, symbolTypes.Class);
    const parentName = classSymbol?.parentClassName;

    return formatRoot(node, children, constructorContent, parentName);
  }
}

export default RootRule;
