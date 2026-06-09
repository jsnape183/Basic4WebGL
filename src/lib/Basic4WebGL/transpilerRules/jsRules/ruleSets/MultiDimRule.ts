import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.MultiDim)
class MultiDimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    return node.children
      .map((child) => getTranspilerRule(child.type).generate(child, table))
      .join('\n');
  }
}

export default MultiDimRule;
