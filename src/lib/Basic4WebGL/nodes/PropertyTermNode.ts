import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import ObjectType from '../builtInTypes/definitions/ObjectType';
import BuiltInType from '@CompilerLib/builtInTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a property chain read in expression context: obj.prop.subprop
 * data is the fully-formatted chain string (e.g. "onenter_mycar.carkey")
 * An optional dataType override can be supplied (e.g. for instance variable reads
 * where the underlying symbol has a concrete type like Number/Variant).
 */
class PropertyTermNode extends Tree {
  constructor(chain: string, loc?: SourceLocation, dataType?: BuiltInType) {
    super(nodeTypes.PropertyTerm, chain, []);
    this.dataType = dataType ?? new ObjectType(chain);
    this.loc = loc;
  }
}

export default PropertyTermNode;
