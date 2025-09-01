import TokenStream from '../lexer/tokens/tokenStream';
import Symbols from '../symbols';
import { Tree } from '../tree';
import { addParserRule } from './parserRuleFactory';

interface IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols | undefined,
    data: any | undefined
  ): Tree;
}

export function RegisterParserRule(name?: string) {
  return function <T extends { new (...args: any[]): IParserRule }>(ctor: T) {
    const instance = new ctor();
    addParserRule(name ?? ctor.name, instance);
  };
}

export default IParserRule;
