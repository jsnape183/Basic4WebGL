import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import WhileNode from '../nodes/WhileNode';
import { newLines } from '../parserConfig';

@RegisterRule('While')
class WhileRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.While, tokenStream);
    const expr = getRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    const block = getRule('Block').parse(tokenStream, symbolTable, {
      newLines: tokens.EndWhile,
    });
    matchAndMove(tokens.EndWhile, tokenStream);
    matchAndMove(newLines, tokenStream);

    return new WhileNode(null, [expr, block]);
  }
}

export default WhileRule;
