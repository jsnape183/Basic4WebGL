import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import tokens from '../../tokens';
import { getParserRule } from '../../../parser/parserRuleFactory';
import WhileNode from '../../nodes/WhileNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('While')
class WhileRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.While, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    const block = getParserRule('Block').parse(tokenStream, symbolTable, {
      newLines: tokens.EndWhile,
    });
    matchAndMove(tokens.EndWhile, tokenStream);
    matchAndMove(newLines, tokenStream);

    return new WhileNode(null, [expr, block]);
  }
}

export default WhileRule;
