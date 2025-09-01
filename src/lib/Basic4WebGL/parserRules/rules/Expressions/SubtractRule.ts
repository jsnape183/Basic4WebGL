import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import SubtractNode from '@Basic4WebGL/nodes/SubtractNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('Subtract')
class SubtractRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.Subtract, tokenStream);
    const secondary = getParserRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new SubtractNode(null, [term, secondary]);
  }
}

export default SubtractRule;
