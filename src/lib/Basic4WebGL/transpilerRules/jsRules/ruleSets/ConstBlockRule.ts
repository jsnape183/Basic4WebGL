import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

/**
 * ConstBlockNode is inert: the parser has already registered the
 * ConstantSymbols into the module scope, so the block emits nothing here.
 * The frozen holder (`const _const_<module> = Object.freeze({ ... })`) is
 * generated once per module by the symbol-table-driven `constantRules` pass
 * and hoisted ahead of all module bodies.
 */
@RegisterTranspilerRule(nodeTypes.ConstBlock)
class ConstBlockRule implements IGeneratable {
  generate(_node: Tree, _table: Symbols): string {
    return '';
  }
}

export default ConstBlockRule;
