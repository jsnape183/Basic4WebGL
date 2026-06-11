import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayLookupNode from '@Basic4WebGL/nodes/ArrayLookupNode';
import TypedElementAccessNode from '@Basic4WebGL/nodes/TypedElementAccessNode';
import DictionaryLookupNode from '@Basic4WebGL/nodes/DictionaryLookupNode';
import TermNode from '@Basic4WebGL/nodes/TermNode';
import VariableNode from '@Basic4WebGL/nodes/VariableNode';
import PropertyTermNode from '@Basic4WebGL/nodes/PropertyTermNode';
import PropertyMethodTermNode from '@Basic4WebGL/nodes/PropertyMethodTermNode';
import { symbolTypes, scopeTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';
import { CompilationError } from '@CompilerLib/errors';

function isInstancePropertyAccess(symbol: Symbol, symbolTable: Symbols): boolean {
  if (symbol.scope.type !== scopeTypes.Class) return false;
  const execScopeType = symbolTable.getScopeType();
  if (execScopeType !== scopeTypes.Function && execScopeType !== scopeTypes.Constructor) return false;
  return symbolTable.getFullScopeName().startsWith(symbol.scope.name + '.');
}

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

        // Chained method call: obj.prop.method(args) in expression context
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(
            tokenStream,
            symbolTable,
            undefined
          );
          return new PropertyMethodTermNode(chain, args, loc);
        }
      }
      return new PropertyTermNode(chain, loc);
    }
    if (symbolTable.check(name, symbolTypes.Function)) {
      return getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }
    // Dictionary lookup in expression context: dict["key"] or dict["key"].member
    if (check(tokens.OpenBracket, tokenStream.current())) {
      const dictSym = symbolTable.get(name, symbolTypes.Dictionary) as any;
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseBracket, tokenStream);

      if (dictSym.classSymbol && check(tokens.Dot, tokenStream.current())) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const memberName = tokenStream.prev().text;
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
          return new TypedElementAccessNode(
            { collectionSymbol: dictSym, memberName, kind: 'dict', isMethod: false },
            [keyExpr, args],
            loc
          );
        }
        return new TypedElementAccessNode(
          { collectionSymbol: dictSym, memberName, kind: 'dict', isMethod: false },
          [keyExpr],
          loc
        );
      }

      return new DictionaryLookupNode(dictSym, keyExpr, loc);
    }
    if (!check(tokens.OpenParen, tokenStream.current())) {
      let varSymbol: Symbol;
      if (symbolTable.check(name, symbolTypes.Array)) {
        varSymbol = symbolTable.get(name, symbolTypes.Array);
      } else if (symbolTable.check(name, symbolTypes.Dictionary)) {
        varSymbol = symbolTable.get(name, symbolTypes.Dictionary);
      } else {
        varSymbol = symbolTable.get(name);
      }
      if (isInstancePropertyAccess(varSymbol, symbolTable)) {
        throw new CompilationError(`'${name}' is a class property — use self.${name}`);
      }
      return new TermNode(varSymbol, new VariableNode(name), loc);
    }
    matchAndMove(tokens.OpenParen, tokenStream);
    const elems = getParserRule('ArrayList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);

    const arraySym = symbolTable.get(name, symbolTypes.Array) as any;

    if (arraySym.classSymbol && check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text;
      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        return new TypedElementAccessNode(
          { collectionSymbol: arraySym, memberName, kind: 'array', isMethod: false },
          [elems, args],
          loc
        );
      }
      return new TypedElementAccessNode(
        { collectionSymbol: arraySym, memberName, kind: 'array', isMethod: false },
        [elems],
        loc
      );
    }

    return new ArrayLookupNode(arraySym, elems, loc);
  }
}

export default VariableFactorRule;
