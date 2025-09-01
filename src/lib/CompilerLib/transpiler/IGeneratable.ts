import Symbols from '../symbols';
import { Tree } from '../../tree';
import { addTranspilerRule } from './transpilerRuleFactory';

export interface IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string;
}

export function RegisterTranspilerRule(name: number) {
  return function <T extends { new (...args: any[]): IGeneratable }>(ctor: T) {
    const instance = new ctor();
    addTranspilerRule(name, instance);
  };
}
