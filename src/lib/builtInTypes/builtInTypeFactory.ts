import BuiltInType from '.';

const builtInTypes: Record<string, BuiltInType> = {};

export const getBuiltInType = (key: string): BuiltInType => {
  if (!builtInTypes[key]) {
    throw Error(`Cannot find type with name ${key}`);
  }

  return builtInTypes[key];
};

export const addBuiltInType = (key: string, rule: BuiltInType) => {
  if (builtInTypes[key]) {
    throw Error(`Duplicate type definition ${key} found.`);
  }
  builtInTypes[key] = rule;
};
