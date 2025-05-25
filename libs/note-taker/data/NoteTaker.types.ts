import { Context } from "./Context";

export type SearchResult = { title: string; } & (
  {
    cmd: 'context.new';
  } | {
    cmd: 'context.select';
    context: Context;
  } | {
    cmd: 'context.unselect';
  }
);

export type Command = SearchResult['cmd'];
