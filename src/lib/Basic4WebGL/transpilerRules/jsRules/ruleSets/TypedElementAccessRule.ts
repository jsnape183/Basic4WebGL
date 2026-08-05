import { IGeneratable, RegisterTranspilerRule } from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import Symbols from '@CompilerLib/symbols';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.TypedElementAccess)
class TypedElementAccessRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const { collectionSymbol, chain, memberName, kind, isStatement } = node.data;
    // `chain` is a pre-built JS receiver expression (e.g. "this.bullets"),
    // used by the self-field path (SelfFactorRule/SelfRule) where there is
    // no symbol whose formatSymbol() would produce "this.x". The ordinary
    // non-self path still derives its receiver from collectionSymbol.
    const name = chain ? node.data.name : collectionSymbol.name;
    const formatted = chain ?? formatSymbol(collectionSymbol);
    const idx = doChild(node, 0, table);

    let ref: string;
    let label: string;
    if (kind === 'array') {
      ref = `${formatted}[${idx}]`;
      label = `${name}(0)`;
    } else {
      ref = `_sbDictGet(${formatted},${idx})`;
      // Strip surrounding quotes from string literal keys: "Alice" → Alice
      const rawKey = idx.replace(/^"|"$/g, '');
      label = `${name}[${rawKey}]`;
    }

    const wrapped = `_sbRequireInit(${ref},"${label}")`;

    if (isStatement) {
      const args = node.children.length > 1 ? doChild(node, 1, table) : '';
      return `${wrapped}.${memberName}(${args});`;
    }
    // Expression context: no trailing semicolon
    if (node.children.length > 1) {
      const args = doChild(node, 1, table);
      return `${wrapped}.${memberName}(${args})`;
    }
    return `${wrapped}.${memberName}`;
  }
}

export default TypedElementAccessRule;
