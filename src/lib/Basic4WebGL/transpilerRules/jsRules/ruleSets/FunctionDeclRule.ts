import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatFunctionDecl } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.FunctionDecl)
class FunctionDeclRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const params = doChild(node, 0, table);

    const body = `
        ${doChild(node, 1, table)};`;

    return formatFunctionDecl(node, params, body);
  }
}

export default FunctionDeclRule;
