import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/parserRuleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import DivideNode from '../../nodes/DivideNode';
import tokens from '../../tokens';

@RegisterParserRule('Divide')
class DivideRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const factor = data?.factor;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getParserRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new DivideNode(null, [factor, secondary]);
  }
}

export default DivideRule;
