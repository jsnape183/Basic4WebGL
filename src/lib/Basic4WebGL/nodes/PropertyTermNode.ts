import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import ObjectType from '../builtInTypes/definitions/ObjectType';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a property chain read in expression context: obj.prop.subprop
 * data is the fully-formatted chain string (e.g. "onenter_mycar.carkey")
 */
class PropertyTermNode extends Tree {
  constructor(chain: string, loc?: SourceLocation) {
    super(nodeTypes.PropertyTerm, chain, []);
    this.dataType = new ObjectType(chain);
    this.loc = loc;
  }
}

export default PropertyTermNode;
