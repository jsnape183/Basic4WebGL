export enum LogItemType {
  Notice,
  Warning,
  Error,
}

export type LogItem = {
  text: string;
  type: LogItemType;
};
