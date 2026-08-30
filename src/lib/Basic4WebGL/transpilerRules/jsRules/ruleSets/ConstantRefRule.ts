import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';

/**
 * A resolved reference to a named constant compiles to a lookup on the
 * module's frozen holder: `_const_<module>.<name>` (see constantRules.ts for
 * the holder emission). The parser rules that build ConstantRef nodes
 * (Tasks 8-9) populate `node.data.module` / `node.data.name`.
 */
@RegisterTranspilerRule(nodeTypes.ConstantRef)
class ConstantRefRule implements IGeneratable {
  generate(node: Tree): string {
    return `_const_${node.data.module}.${node.data.name}`;
  }
}

export default ConstantRefRule;
