import { Tree } from '../../tree';
import ObjectType from '../builtInTypes/definitions/ObjectType';
import nodeTypes from '../nodeTypes';
import { Symbol } from '../../symbols';

export class ModuleTerm extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.ModuleTerm, data, children);
    const moduleSymbol = data as Symbol;
    this.dataType = new ObjectType(
      `${moduleSymbol.fullScope}.${moduleSymbol.name}`
    );
  }
}
