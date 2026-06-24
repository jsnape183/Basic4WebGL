import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, prefixClass } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SuperMethodCall)
class SuperMethodCallRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const { parentName, methodName } = node.data as { parentName: string; methodName: string };
    const args = doChild(node, 0, table);
    const argStr = args ? `, ${args}` : '';
    return `${prefixClass(parentName)}.prototype.${methodName}.call(this${argStr});`;
  }
}

export default SuperMethodCallRule;
