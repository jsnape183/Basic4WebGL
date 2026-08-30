import { check } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import BlockNode from '../../nodes/BlockNode';
import { TokenMatch } from '@CompilerLib/lexer/tokens/Token';

// Tracks how deeply the parser is currently nested inside a `Block` body
// (an if/while/for/do/function/class body). Rules that are only legal at the
// top level of a file — e.g. `const` — can consult `isInsideBlock()` to reject
// placement inside a block that does not push its own symbol-table scope
// (if/while/for/do). Single-threaded parsing makes a module-level counter safe;
// the try/finally guarantees it unwinds even on a thrown CompilationError.
let blockNestingDepth = 0;

export const isInsideBlock = (): boolean => blockNestingDepth > 0;

@RegisterParserRule('Block')
class BlockRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const loc = tokenStream.current().loc();
    const children = new Array<Tree>();
    const endTokens = data?.endTokens;
    blockNestingDepth++;
    try {
      while (!check(endTokens, tokenStream.current())) {
        const child = getParserRule(tokenStream.current().token.name).parse(
          tokenStream,
          symbolTable,
          undefined
        ) as Tree;
        if (!child) continue;
        children.push(child);
      }
    } finally {
      blockNestingDepth--;
    }
    return new BlockNode(null, children, loc);
  }
}

export default BlockRule;
