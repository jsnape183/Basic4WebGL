import { readFileSync } from 'node:fs';

export const rawObject = (object: any) => JSON.parse(JSON.stringify(object));

export const loadSampleFile = (
  fileName: string,
  folder: string = undefined
) => {
  if (folder) {
    return readFileSync(`tests/sampleFiles/${folder}/${fileName}.bas`, 'utf-8');
  }
  return readFileSync(`tests/sampleFiles/${fileName}.bas`, 'utf-8');
};

export const cleanWhitespace = (input: string): string => {
  return input.replace(/\s+/g, '');
};
