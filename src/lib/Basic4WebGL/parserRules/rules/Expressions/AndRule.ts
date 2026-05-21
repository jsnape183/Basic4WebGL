import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import AndNode from '@Basic4WebGL/nodes/AndNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('And')
class AndRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const loc = tokenStream.current().loc();
    const term = data?.term;
    matchAndMove(tokens.And, tokenStream);
    return new AndNode(null, [
      term,
      getParserRule('BoolTerm').parse(tokenStream, symbolTable, undefined),
    ], loc);
  }
}

export default AndRule;
