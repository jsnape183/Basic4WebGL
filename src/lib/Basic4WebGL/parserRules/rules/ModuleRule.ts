import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
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
    const name = data?.name;
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    matchAndMove(tokens.Variable, tokenStream);
    const functionName = tokenStream.prev().text;
    const functionSymbol = symbolTable.get(functionName, symbolTypes.Function);

    const node = getParserRule('FunctionCall').parse(
      tokenStream,
      symbolTable,
      functionSymbol
    );
    symbolTable.clearScope();
    return node;
  }
}

export default ModuleRule;
