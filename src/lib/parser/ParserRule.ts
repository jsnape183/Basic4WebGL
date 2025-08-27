import TokenStream from '../compiler/tokenStream';
import Symbols from '../symbols';
import { Tree } from '../tree';
import { addRule } from './ruleFactory';

interface IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols | undefined,
    data: any | undefined
  ): Tree;
}

export function RegisterRule(name?: string) {
  return function <T extends { new (...args: any[]): IParserRule }>(ctor: T) {
    const instance = new ctor();
    addRule(name ?? ctor.name, instance);
  };
}

export default IParserRule;
