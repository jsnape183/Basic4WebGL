import Symbols from '@CompilerLib/symbols';
import { symbolTypes, ConstantSymbol } from '../symbolTypes';

const formatValue = (c: ConstantSymbol): string =>
  c.valueKind === 'string' ? JSON.stringify(c.value) : String(c.value);

/**
 * One frozen holder per module that declares constants:
 *   const _const_keyboard = Object.freeze({ space: 32, enter: 13 });
 * Driven from the symbol table (not the AST) so multiple `const … endconst`
 * blocks in one file collapse to a single holder and the output is inert —
 * safe to hoist ahead of every module body. Reference sites compile to
 * `_const_<module>.<name>` (see ConstantRefRule).
 */
export const constantRules = (table: Symbols): string => {
  const consts = table.getAllOfType(symbolTypes.Constant) as ConstantSymbol[];
  if (consts.length === 0) return '';

  const byModule = new Map<string, ConstantSymbol[]>();
  for (const c of consts) {
    const list = byModule.get(c.scope.name) ?? [];
    list.push(c);
    byModule.set(c.scope.name, list);
  }

  const lines: string[] = [];
  for (const [moduleName, list] of byModule) {
    const entries = list.map((c) => `${c.name}: ${formatValue(c)}`).join(', ');
    lines.push(`const _const_${moduleName} = Object.freeze({ ${entries} });`);
  }
  return lines.join('\n') + '\n';
};

export default constantRules;
