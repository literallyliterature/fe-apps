export interface Context {
  focusedItemTitle?: string;
  items: ListItem[];
  title: string;
  type: 'ordered-list' | 'todo' | 'unordered-list';
  wide?: boolean;
}

export interface ListItem {
  done?: boolean;
  snoozeTill?: number;
  title: string;
}

export interface Page {
  activeContextTitle?: string;
  contexts: Context[];
  title: string;
}

export interface Section {
  activePageTitle?: string;
  pages: Page[];
  title: string;
}

export interface StorableNotes {
  allSections: Section[];
  selectedSectionTitle?: string;
}
