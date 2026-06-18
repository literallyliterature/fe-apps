export interface ListItem {
  items?: ListItem[]
  title: string
}
export interface Todo {
  done: boolean
  items?: Todo[]
  title: string
}

export type Context = { title: string } & ({
  type: 'todo'
  items: Todo[]
} | {
  type: 'ordered-list' | 'unordered-list'
  items: ListItem[]
});

export interface Page {
  activeContextTitle?: string
  contexts: Context[]
  title: string
}

export interface Section {
  activePageTitle?: string
  pages: Page[]
  title: string
}

export type SearchItem = { title: string, exactMatch?: boolean } & ({
  cmd: 'section.new'
  code: 'ns'
  sectionTitle?: string
} | {
  cmd: 'section.select'
  code: 's'
  section: Section
} | {
  cmd: 'page.new'
  code: 'np'
  pageTitle?: string
  section: Section
} | {
  cmd: 'page.select'
  code: 'p'
  page: Page
} | {
  cmd: 'context.new'
  code: 'nc'
  contextTitle?: string
  contextType?: 'todo' | 'ol' | 'ul'
  page: Page
} | {
  cmd: 'context.select'
  code: 'c'
  context: Context
} | {
  cmd: 'todo.new'
  code: 'n'
  context: Context
  inputTitle?: string
} | {
  cmd: 'list-item.new'
  code: 'n' | '-'
  context: Context
  inputTitle?: string
} | {
  cmd: 'todo.focus'
  code: 'focus'
  todo: Todo
} | {
  cmd: 'todo.done'
  code: 'd'
  todo: Todo
} | {
  cmd: 'context.remove-done'
  code: 'rc'
  context: Context
} | {
  cmd: 'page.remove-done'
  code: 'rp'
  page: Page
} | {
  cmd: 'clipboard.import'
  code: 'import'
} | {
  cmd: 'clipboard.export'
  code: 'export'
} | {
  cmd: 'context.sort'
  code: 'sort'
  context: Context
} | {
  cmd: 'help'
  code: 'help'
});

export type Command = SearchItem['cmd'];

export interface StoredJSON {
  allSections: Section[]
  selectedSectionTitle?: string
  selectedPageTitle?: string
  selectedContextTitle?: string
}
