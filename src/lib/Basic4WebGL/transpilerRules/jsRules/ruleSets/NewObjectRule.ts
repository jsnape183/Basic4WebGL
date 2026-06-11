import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import Symbols from '@CompilerLib/symbols';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.NewObject)
class NewObjectRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    // Use the original case-preserved class name from source if available,
    // otherwise fall back to the symbol name (which is lowercased).
    const className = node.data.className ?? node.data.classSymbol.name;
    if (node.children.length > 0) {
      const args = doChild(node, 0, table);
      return `new ${className}(${args})`;
    }
    return `new ${className}()`;
  }
}

export default NewObjectRule;
