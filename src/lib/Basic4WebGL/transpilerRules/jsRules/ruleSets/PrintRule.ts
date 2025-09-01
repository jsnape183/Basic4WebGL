import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Print)
class PrintRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const value = doChild(node, 0, table);
    return `_print(${value})`;
  }
}

export default PrintRule;
