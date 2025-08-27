import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import DivideNode from '../../nodes/DivideNode';
import tokens from '../../tokens';

@RegisterRule('Divide')
class DivideRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const factor = data?.factor;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new DivideNode(null, [factor, secondary]);
  }
}

export default DivideRule;
