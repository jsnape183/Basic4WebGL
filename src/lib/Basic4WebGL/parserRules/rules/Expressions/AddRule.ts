import { matchAndMove } from '../../../../compiler/rulesHelper';
import TokenStream from '../../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../../parser/ParserRule';
import { getParserRule } from '../../../../parser/parserRuleFactory';
import Symbols from '../../../../symbols';
import { Tree } from '../../../../tree';
import AddNode from '../../../nodes/AddNode';
import tokens from '../../../tokens';

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
