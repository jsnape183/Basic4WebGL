import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import Symbols from '@CompilerLib/symbols';
import nodeTypes from '../../../nodeTypes';
import { doChild, prefixClass } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.NewObject)
class NewObjectRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const className = node.data.classSymbol.name;
    const prefixed = prefixClass(className);
    if (node.children.length > 0) {
      const args = doChild(node, 0, table);
      return `new ${prefixed}(${args})`;
    }
    return `new ${prefixed}()`;
  }
}

export default NewObjectRule;
