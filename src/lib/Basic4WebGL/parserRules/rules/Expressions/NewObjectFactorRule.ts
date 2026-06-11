import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, { RegisterParserRule } from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import NewObjectNode from '@Basic4WebGL/nodes/NewObjectNode';

@RegisterParserRule('NewObjectFactor')
class NewObjectFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.New, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const className = tokenStream.prev().text;
    const classSymbol = symbolTable.get(className, symbolTypes.Class);

    if (check(tokens.OpenParen, tokenStream.current())) {
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new NewObjectNode({ classSymbol, className }, [args], loc);
    }
    return new NewObjectNode({ classSymbol, className }, [], loc);
  }
}

export default NewObjectFactorRule;
