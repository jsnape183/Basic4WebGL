import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayLiteralNode from '@Basic4WebGL/nodes/ArrayLiteralNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('ArrayLiteral')
class ArrayLiteralRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.OpenBrace, tokenStream);

    if (check(tokens.CloseBrace, tokenStream.current())) {
      matchAndMove(tokens.CloseBrace, tokenStream);
      return new ArrayLiteralNode(null, [], loc);
    }

    const elems = [
      getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined),
    ];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      elems.push(
        getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined)
      );
    }
    matchAndMove(tokens.CloseBrace, tokenStream);
    return new ArrayLiteralNode(null, elems, loc);
  }
}

export default ArrayLiteralRule;
