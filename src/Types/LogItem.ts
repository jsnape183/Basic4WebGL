export enum LogItemType {
  Notice,
  Warning,
  Error,
  Output,
}

export type LogItem = {
  text: string;
  type: LogItemType;
};
