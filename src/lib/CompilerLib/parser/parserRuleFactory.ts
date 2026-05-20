import IParserRule from './ParserRule';

const parserRules: Record<string, IParserRule> = {};

export const getParserRule = (key: string): IParserRule => {
  if (!parserRules[key]) {
    throw Error(`Cannot find rule with name ${key}`);
  }

  return parserRules[key];
};

export const hasParserRule = (key: string): boolean => {
  return key in parserRules;
};

export const addParserRule = (key: string, rule: IParserRule) => {
  if (parserRules[key]) {
    throw Error(`Duplicate parse rule ${key} found.`);
  }
  parserRules[key] = rule;
};
