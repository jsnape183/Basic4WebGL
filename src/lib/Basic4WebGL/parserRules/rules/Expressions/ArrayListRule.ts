import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayListNode from '@Basic4WebGL/nodes/ArrayListNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('ArrayList')
class ArrayListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    let expr = [
      getParserRule('Expression').parse(tokenStream, symbolTable, undefined),
    ];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      expr.push(
        getParserRule('Expression').parse(tokenStream, symbolTable, undefined)
      );
    }
    return new ArrayListNode(null, expr, loc);
  }
}

export default ArrayListRule;
