export interface Context {
  focusedItemTitle?: string
  items: ListItem[]
  title: string
  type: 'ordered-list' | 'todo' | 'unordered-list'
}

export interface ListItem {
  done?: boolean
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
  cmd: 'list-item.done'
  code: 'd'
  todo: ListItem
} | {
  cmd: 'list-item.focus'
  code: 'focus'
  todo: ListItem
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
}) & { exactMatch?: boolean, title: string };

export interface Section {
  activePageTitle?: string
  pages: Page[]
  title: string
}

export interface StorableNotes {
  sections: Section[]
  selectedSectionTitle?: string
}
