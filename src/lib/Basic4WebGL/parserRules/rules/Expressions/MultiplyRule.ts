import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import MultiplyNode from '@Basic4WebGL/nodes/MultiplyNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('Multiply')
class MultiplyRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const factor = data?.factor;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getParserRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new MultiplyNode(null, [factor, secondary]);
  }
}

export default MultiplyRule;
