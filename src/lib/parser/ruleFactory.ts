import IParserRule from './ParserRule';

const parserRules: Record<string, IParserRule> = {};

export const getRule = (key: string): IParserRule => {
  if (!parserRules[key]) {
    throw Error(`Cannot find rule with name ${key}`);
  }

  return parserRules[key];
};

export const addRule = (key: string, rule: IParserRule) => {
  if (parserRules[key]) {
    throw Error(`Duplicate parse rule ${key} found.`);
  }
  parserRules[key] = rule;
};

export const getRules = () => {
  return parserRules;
};
