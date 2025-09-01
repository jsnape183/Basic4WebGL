import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import AddNode from '@Basic4WebGL/nodes/AddNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('Add')
class AddRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getParserRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new AddNode(null, [term, secondary]);
  }
}

export default AddRule;
