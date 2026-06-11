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
    const className = node.data.classSymbol.name;
    if (node.children.length > 0) {
      const args = doChild(node, 0, table);
      return `new ${className}(${args})`;
    }
    return `new ${className}()`;
  }
}

export default NewObjectRule;
