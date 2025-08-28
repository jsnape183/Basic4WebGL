import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Print)
class PrintRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const value = doChild(node, 0, table);
    return `console.log(${value});`;
  }
}

export default PrintRule;
