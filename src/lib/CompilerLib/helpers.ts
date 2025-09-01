export type KeyValueEnum = {
  value: any;
  name: string;
};

export const createEnum = (values: Array<string>): Record<string, number> => {
  let enumeration: Record<string, any> = {};
  values.forEach((v: string, i: number) => {
    enumeration[v] = i;
  });

  return enumeration;
};

export function createKeyValueEnum<T = KeyValueEnum>(
  values: Array<string>
): Record<string, T> {
  let enumeration: Record<string, T> = {};
  values.forEach((v: string, i: number) => {
    enumeration[v] = { value: i, name: v } as T;
  });
  return enumeration;
}
