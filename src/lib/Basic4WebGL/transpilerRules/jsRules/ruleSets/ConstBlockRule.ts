import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

/**
 * ConstBlockNode is inert at this stage (Task 5): the parser has already
 * registered the ConstantSymbols into the module scope, so the block itself
 * emits nothing. Task 7 replaces this body with the real frozen-holder
 * emission (`const _const_<module> = Object.freeze({ ... })`).
 */
@RegisterTranspilerRule(nodeTypes.ConstBlock)
class ConstBlockRule implements IGeneratable {
  generate(_node: Tree, _table: Symbols): string {
    return '';
  }
}

export default ConstBlockRule;
