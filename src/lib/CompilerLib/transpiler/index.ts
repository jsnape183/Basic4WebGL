import ParserResults from '../parser/ParserResults';
import Symbols, { SymbolScope } from '../symbols';
import { getTranspilerRule } from './transpilerRuleFactory';
import { TranspilerConfig } from './types';
import { SourceLocation } from '../compiler/types';

type OffsetMapping = {
  src: SourceLocation;
  genStart: number;
  genLength: number;
};

class Transpiler {
  transpile(
    parseResult: ParserResults,
    symbols: Symbols,
    config: TranspilerConfig
  ) {
    let output = ``;
    const mappings: OffsetMapping[] = [];

    output += parseResult.results
      .map((result) => {
        const symbolPart = config.symbolRules(
          symbols,
          new SymbolScope(result.name, '')
        );
        const genStart = output.length + symbolPart.length;
        const generated = getTranspilerRule(result.tree.type).generate(
          result.tree,
          symbols
        );
        if (result.tree.loc) {
          mappings.push({
            src: result.tree.loc,
            genStart,
            genLength: generated.length,
          });
        }
        return `${symbolPart}${generated}`;
      })
      .join('\n');

    output += ';\n' + config.terminationRules(symbols);

    // mappings is ready for Tier C: convert to V3 source map JSON
    // and populate CompileResult.sourceMap when Tier C is implemented.

    return output;
  }
}

export default Transpiler;
