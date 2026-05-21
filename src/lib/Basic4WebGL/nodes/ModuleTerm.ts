import { Tree } from '@CompilerLib/tree';
import ObjectType from '../builtInTypes/definitions/ObjectType';
import nodeTypes from '../nodeTypes';
import { Symbol } from '@CompilerLib/symbols';
import type { SourceLocation } from '@CompilerLib/compiler/types';

export class ModuleTerm extends Tree {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.ModuleTerm, data, children);
    const moduleSymbol = data as Symbol;
    this.dataType = new ObjectType(
      `${moduleSymbol.fullScope}.${moduleSymbol.name}`
    );
    this.loc = loc;
  }
}
