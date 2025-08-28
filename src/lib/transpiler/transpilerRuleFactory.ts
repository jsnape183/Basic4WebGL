import { IGeneratable } from './IGeneratable';

const transpilerRules: Record<string, IGeneratable> = {};

export const getTranspilerRule = (key: number): IGeneratable => {
  if (!transpilerRules[key]) {
    throw Error(`Cannot find transpiler rule with name ${key}`);
  }

  return transpilerRules[key];
};

export const addTranspilerRule = (key: number, rule: IGeneratable) => {
  if (transpilerRules[key]) {
    throw Error(`Duplicate transpiler rule ${key} found.`);
  }
  console.log(`Adding transpiler rule ${key}`);
  transpilerRules[key] = rule;
};
