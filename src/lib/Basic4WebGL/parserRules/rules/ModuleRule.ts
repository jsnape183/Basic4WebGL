import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import { CompilationError } from '@CompilerLib/errors';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';

@RegisterParserRule('Module')
class ModuleRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const name = data as string;
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    let node: Tree;
    try {
      matchAndMove(tokens.Variable, tokenStream);
      const functionName = tokenStream.prev().text;

      let constSym: any;
      try {
        constSym = symbolTable.getInScope(functionName, symbolTypes.Constant, name);
      } catch {
        constSym = undefined;
      }
      if (constSym) {
        throw new CompilationError(
          check(tokens.Equals, tokenStream.current())
            ? `'${name}.${functionName}' is a constant and cannot be assigned.`
            : `'${name}.${functionName}' is a constant — it can't be used as a statement on its own.`
        );
      }

      const functionSymbol = symbolTable.getInScope(functionName, symbolTypes.Function, name);
      node = getParserRule('FunctionCall').parse(
        tokenStream,
        symbolTable,
        functionSymbol
      );
    } finally {
      symbolTable.clearScope();
    }
    return node;
  }
}

export default ModuleRule;
