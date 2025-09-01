import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.And)
class AndRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `${doChild(node, 0, table)}&&${doChild(node, 1, table)}`;
  }
}

export default AndRule;
