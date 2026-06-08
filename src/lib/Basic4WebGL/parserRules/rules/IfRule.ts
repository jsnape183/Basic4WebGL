import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { newLines } from '../../parserConfig';
import IfNode from '../../nodes/IfNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const branchEndTokens = [tokens.EndIf, tokens.Else, tokens.ElseIf];

@RegisterParserRule('If')
class IfRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.If, tokenStream);
    return this.parseIfBody(tokenStream, symbolTable, loc);
  }

  private parseIfBody(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    loc: SourceLocation
  ): Tree {
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);

    const block = getParserRule('Block').parse(tokenStream, symbolTable, {
      endTokens: branchEndTokens,
    });

    if (check(tokens.ElseIf, tokenStream.current())) {
      matchAndMove(tokens.ElseIf, tokenStream);
      const elseIfNode = this.parseIfBody(
        tokenStream,
        symbolTable,
        tokenStream.current().loc()
      );
      return new IfNode(null, [expr, block, elseIfNode], loc);
    }

    if (check(tokens.Else, tokenStream.current())) {
      matchAndMove(tokens.Else, tokenStream);
      matchAndMove(newLines, tokenStream);
      const elseBlock = getParserRule('Block').parse(tokenStream, symbolTable, {
        endTokens: tokens.EndIf,
      });
      matchAndMove(tokens.EndIf, tokenStream);
      matchAndMove(newLines, tokenStream);
      return new IfNode(null, [expr, block, elseBlock], loc);
    }

    matchAndMove(tokens.EndIf, tokenStream);
    matchAndMove(newLines, tokenStream);
    return new IfNode(null, [expr, block], loc);
  }
}

export default IfRule;
