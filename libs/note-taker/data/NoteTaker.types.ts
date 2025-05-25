export type ListItem = {
  items?: ListItem[];
  title: string;
};
export type Todo = {
  done: boolean;
  items?: Todo[];
  title: string;
}

export type Context = { title: string } & ({
  type: 'todo';
  items: Todo[];
} | {
  type: 'ordered-list' | 'unordered-list';
  items: ListItem[];
});

export type Page = {
  contexts: Context[];
  title: string;
};

export type Section = {
  pages: Page[];
  title: string;
};

export type SearchItem = { title: string; } & ({
  cmd: 'section.new'
  code: 'ns',
} | {
  cmd: 'section.select';
  code: 's',
  section: Section
} | {
  cmd: 'page.new',
  code: 'np',
  section: Section
} | {
  cmd: 'page.select';
  code: 'p',
  page: Page;
} | {
  cmd: 'context.new';
  code: 'nc',
  page: Page;
} | {
  cmd: 'context.select';
  code: 'c',
  context: Context;
} | {
  cmd: 'todo.new';
  code: 'n',
  context: Context;
} | {
  cmd: 'list-item.new';
  code: 'n',
  context: Context;
} | {
  cmd: 'todo.done';
  code: 'd',
  todo: Todo;
});

export type Command = SearchItem['cmd'];
