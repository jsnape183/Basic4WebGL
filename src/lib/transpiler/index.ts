import ParserResults from '../parser/parserResults';
import Symbols, { SymbolScope } from '../symbols';
import { getTranspilerRule } from './transpilerRuleFactory';
import { TranspilerConfig } from './types';

class Transpiler {
  transpile(
    parseResult: ParserResults,
    symbols: Symbols,
    config: TranspilerConfig
  ) {
    let output = ``;

    output += parseResult.results
      .map((result) => {
        return `${config.symbolRules(
          symbols,
          new SymbolScope(result.name, '')
        )}${getTranspilerRule(result.tree.type).generate(
          result.tree,
          symbols
        )}`;
      })
      .join('\n');

    output += ';\n' + config.terminationRules(symbols);

    return output;
  }
}

export default Transpiler;
