import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import DivideNode from '@Basic4WebGL/nodes/DivideNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('Divide')
class DivideRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const loc = tokenStream.current().loc();
    const factor = data?.factor;
    matchAndMove(tokens.Divide, tokenStream);
    const secondary = getParserRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new DivideNode(null, [factor, secondary], loc);
  }
}

export default DivideRule;
