export type Context = {
  title: string;
};

export type Command = 'context.new' |
  'context.select';

export type SearchResult = { title: string; } & (
  { cmd: 'context.new' } |
  {
    cmd: 'context.select';
    context: Context;
  }
);
