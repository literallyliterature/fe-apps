export type Command = SearchItem['cmd'];
export type Context = ({
  focusedItemTitle?: string
  items: ListItem[]
  type: 'ordered-list' | 'unordered-list'
} | {
  focusedItemTitle?: string
  items: Todo[]
  type: 'todo'
}) & { title: string };

export interface ListItem {
  items?: ListItem[]
  title: string
}

export interface Page {
  activeContextTitle?: string
  contexts: Context[]
  title: string
}

export type SearchItem = ({
  cmd: 'clipboard.export'
  code: 'export'
} | {
  cmd: 'clipboard.import'
  code: 'import'
} | {
  cmd: 'context.new'
  code: 'nc'
  contextTitle?: string
  contextType?: 'ol' | 'todo' | 'ul'
  page: Page
} | {
  cmd: 'context.remove-done'
  code: 'rc'
  context: Context
} | {
  cmd: 'context.select'
  code: 'c'
  context: Context
} | {
  cmd: 'context.sort'
  code: 'sort'
  context: Context
} | {
  cmd: 'help'
  code: 'help'
} | {
  cmd: 'list-item.new'
  code: '-' | 'n'
  context: Context
  inputTitle?: string
} | {
  cmd: 'page.new'
  code: 'np'
  pageTitle?: string
  section: Section
} | {
  cmd: 'page.remove-done'
  code: 'rp'
  page: Page
} | {
  cmd: 'page.select'
  code: 'p'
  page: Page
} | {
  cmd: 'section.new'
  code: 'ns'
  sectionTitle?: string
} | {
  cmd: 'section.select'
  code: 's'
  section: Section
} | {
  cmd: 'todo.done'
  code: 'd'
  todo: Todo
} | {
  cmd: 'todo.focus'
  code: 'focus'
  todo: Todo
} | {
  cmd: 'todo.new'
  code: 'n'
  context: Context
  inputTitle?: string
}) & { exactMatch?: boolean, title: string };

export interface Section {
  activePageTitle?: string
  pages: Page[]
  title: string
}

export interface StoredJSON {
  allSections: Section[]
  selectedContextTitle?: string
  selectedPageTitle?: string
  selectedSectionTitle?: string
}

export interface Todo {
  done: boolean
  items?: Todo[]
  title: string
}
