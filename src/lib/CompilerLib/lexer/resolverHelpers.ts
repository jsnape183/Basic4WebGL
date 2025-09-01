type MatchResult = {
  match: boolean;
  position: number;
  text: string;
};

export const matchChar = (input: string, match: string): MatchResult =>
  ({
    match: input.substring(0, 1) === match,
    position: 1,
    text: input.substring(0, 1),
  } as MatchResult);

export const matchAll = (input: string, match: string): MatchResult => {
  let position = 0;
  while (input.substring(position, 1) === match) {
    position++;
  }
  return {
    match: position > 0,
    position,
    text: input.substring(0, position),
  } as MatchResult;
};

export const matchString = (input: string, match: string): MatchResult => {
  return {
    match:
      input.length >= match.length &&
      input.substring(0, match.length).toLowerCase() === match,
    position: match.length,
    text: input.substring(0, match.length),
  } as MatchResult;
};

export const matchPattern = (input: string, regex: RegExp): MatchResult => {
  const result = input.match(regex);
  return {
    match: result && result.length > 0 && result[0] !== "",
    position: result && result[0].length,
    text: result && result[0],
  } as MatchResult;
};
