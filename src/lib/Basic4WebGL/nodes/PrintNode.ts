import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Print, data, children);
    this.loc = loc;
  }
  validate(): void {
    // Unreachable as of writing: VariantType.canAccept() (see
    // builtInTypes/definitions/VariantType.ts) unconditionally returns true
    // regardless of the argument, so `print` can never actually fail this
    // check today. Kept as defensive validation rather than removed — if
    // Variant's acceptance rule is ever tightened, this is what would catch
    // a genuinely un-printable argument, and the surrounding shape (throw a
    // SemanticTypeError with the node's loc) is exactly what every other
    // validate() in this codebase does, so there is nothing to fix here,
    // just something to be honest about not being covered by a real,
    // reachable test (roadmap issue #3).
    if (
      getBuiltInType(builtInTypes.Variant).canAccept(
        this.children[0].dataType
      ) === false
    ) {
      throw new SemanticTypeError(
        [builtInTypes.String],
        this.children[0].dataType,
        this.loc
      );
    }
  }
}

export default PrintNode;
