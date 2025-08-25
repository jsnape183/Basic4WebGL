import ParserResults from "../parser/parserResults";
import Symbols, { SymbolScope } from "../symbols";
import { TranspilerConfig } from "./types";

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
          new SymbolScope(result.name, "")
        )}${config.transpilerRules[result.tree.type](result.tree, symbols)}`;
      })
      .join("\n");

    output += ";\n" + config.terminationRules(symbols);

    console.log(output);
    return output;
  }
}

export default Transpiler;
