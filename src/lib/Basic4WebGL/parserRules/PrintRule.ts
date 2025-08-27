import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getParserRule } from '../../parser/parserRuleFactory';
import PrintNode from '../nodes/PrintNode';
import { newLines } from '../parserConfig';

@RegisterParserRule('Print')
class PrintRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    matchAndMove(tokens.Print, tokenStream);
    const printNode = new PrintNode(
      null,
      getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined)
    );
    matchAndMove(newLines, tokenStream);
    return printNode;
  }
}

export default PrintRule;
