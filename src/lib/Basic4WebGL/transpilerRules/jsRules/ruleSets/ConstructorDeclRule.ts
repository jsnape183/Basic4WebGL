import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ConstructorDecl)
class ConstructorDeclRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const params = doChild(node, 0, table);
    const body = doChild(node, 1, table);
    return `constructor(${params}) {${body}}`;
  }
}

export default ConstructorDeclRule;
