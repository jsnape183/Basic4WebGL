import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayLookupNode from '@Basic4WebGL/nodes/ArrayLookupNode';
import TermNode from '@Basic4WebGL/nodes/TermNode';
import VariableNode from '@Basic4WebGL/nodes/VariableNode';
import PropertyTermNode from '@Basic4WebGL/nodes/PropertyTermNode';
import { symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';

@RegisterParserRule('VariableFactor')
class VariableFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (symbolTable.check(name, symbolTypes.Module)) {
      return getParserRule('ModuleFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }

    if (symbolTable.check(name, symbolTypes.Object)) {
      const ownerSymbol = symbolTable.get(name, symbolTypes.Object);
      const ownerFormatted = formatSymbol(ownerSymbol);

      // If next token is '(' this is a method call on a bare object ref (unusual but valid)
      if (!check(tokens.Dot, tokenStream.current())) {
        return new TermNode(ownerSymbol, new VariableNode(name), loc);
      }

      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text.toLowerCase();

      // Method call: member followed by '('
      if (check(tokens.OpenParen, tokenStream.current())) {
        symbolTable.setScope(name);
        let node: Tree;
        try {
          node = getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
            name: memberName,
          });
        } finally {
          symbolTable.clearScope();
        }
        return node;
      }

      // Property chain read: build the full chain
      let chain = `${ownerFormatted}.${memberName}`;
      while (check(tokens.Dot, tokenStream.current())) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        chain += `.${tokenStream.prev().text.toLowerCase()}`;
      }
      return new PropertyTermNode(chain, loc);
    }
    if (symbolTable.check(name, symbolTypes.Function)) {
      return getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }
    if (!check(tokens.OpenParen, tokenStream.current())) {
      return new TermNode(symbolTable.get(name), new VariableNode(name), loc);
    }
    matchAndMove(tokens.OpenParen, tokenStream);
    const elems = getParserRule('ArrayList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);

    return new ArrayLookupNode(symbolTable.get(name, 'Array'), elems, loc);
  }
}

export default VariableFactorRule;
