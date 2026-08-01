import { SourceLocation } from '../lib/CompilerLib/compiler/types';

export enum LogItemType {
  Notice,
  Warning,
  Error,
  Output,
}

export type LogItem = {
  text: string;
  type: LogItemType;
  loc?: SourceLocation;
};
