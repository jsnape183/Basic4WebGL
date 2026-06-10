import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SuperConstructorCall)
class SuperConstructorCallRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const args = doChild(node, 0, table);
    return `super(${args});`;
  }
}

export default SuperConstructorCallRule;
