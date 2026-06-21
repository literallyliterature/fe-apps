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

export interface Section {
  activePageTitle?: string
  pages: Page[]
  title: string
}

export interface StorableNotes {
  allSections: Section[]
  selectedSectionTitle?: string
}
