import fuzzy from 'fuzzy';
import _ from 'lodash';

import type { Context, Page, SearchItem, Section, Todo } from './NoteTaker.types';

type code = SearchItem['code'];
const codeDescriptions: { [K in code]: string } = {
  '-': 'New item',
  'c': 'Context: Select or new',
  'd': 'Mark todo item as done',
  'export': 'Export as JSON',
  'focus': 'Focus on specific item',
  'help': 'See available codes',
  'import': 'Import JSON',
  'n': 'New item',
  'nc': 'New context',
  'np': 'New page',
  'ns': 'New section',
  'p': 'Page: Select or new',
  'rc': 'Remove context',
  'rp': 'Remove page',
  's': 'Section: Select or new',
  'sort': 'Sort items in context',
};

const codes = Object.keys(codeDescriptions) as code[];

export class NoteTaker {
  allSections: Section[];
  focusedItem?: Todo;
  selectedContext?: Context;
  selectedPage?: Page;
  selectedSection?: Section;

  constructor(allSections: Section[] = []) {
    this.allSections = allSections;
    if (allSections.length)
      this.selectSection(allSections[0]);
  }

  static fromJSON(storedJSON: null | string) {
    if (!storedJSON)
      return new NoteTaker();

    try {
      const {
        allSections,
        selectedContextTitle,
        selectedPageTitle,
        selectedSectionTitle,
      } = JSON.parse(storedJSON);

      if (!allSections?.length)
        return new NoteTaker();

      const nt = new NoteTaker(allSections);
      if (!selectedSectionTitle)
        return nt;

      try {
        const section = nt.allSections.find(s => s.title === selectedSectionTitle);
        if (!section)
          return nt;
        nt.selectSection(section);

        const page = section.pages.find(p => p.title === selectedPageTitle);
        if (!page)
          return nt;
        nt.selectPage(page);

        const context = page.contexts.find(c => c.title === selectedContextTitle);
        if (!context)
          return nt;
        nt.selectContext(context);
        return nt;
      }
      catch (error) {
        console.error(error);
        return nt;
      }
    }
    catch (error) {
      console.error(error);
      return new NoteTaker();
    }
  }

  changeFocusedItem(upOrDown: 'down' | 'up') {
    if (!this.focusedItem) return;
    if (!this.selectedContext) return;

    const { items, type } = this.selectedContext;

    if (type !== 'todo') return;

    const indexOfFocusedItem = items.findIndex(item => item === this.focusedItem);
    let newIndex = indexOfFocusedItem
      + (upOrDown === 'up' ? -1 : 1);

    if (newIndex === -1) newIndex = items.length - 1;
    else if (newIndex === items.length) newIndex = 0;

    this.focusedItem = items[newIndex];
  }

  exportToClipboard() {
    copyToClipboard(this.toJSON());
  }

  getSearchItems(inputText: string): SearchItem[] {
    if (inputText === '') return [];

    const { allSections, selectedContext, selectedPage, selectedSection } = this;

    let items: SearchItem[] = [];

    const exactMatchFound = () => items.some(item => item.exactMatch);
    const exactMatchItems = () => items.filter(item => item.exactMatch);

    const { additional, code } = parseInputText(inputText);

    if (code === 'export' && !additional) {
      return [{ cmd: 'clipboard.export', code: 'export', exactMatch: true, title: 'Export to clipboard' }];
    }
    else if (code === 'import' && !additional) {
      return [{ cmd: 'clipboard.import', code: 'import', exactMatch: true, title: 'Import from clipboard' }];
    }
    else if (code === 'help' && !additional) {
      return [{ cmd: 'help', code: 'help', exactMatch: true, title: codeDescriptions.help }];
    }

    items = getSectionSelectSearchResults(inputText, allSections);
    if (exactMatchFound())
      return exactMatchItems();
    if (!selectedSection)
      return items;

    items.push(...getPageSelectSearchResults(inputText, selectedSection));
    if (exactMatchFound())
      return exactMatchItems();
    if (!selectedPage)
      return items;

    items.push(...getContextSelectSearchResults(inputText, selectedPage));
    if (exactMatchFound())
      return exactMatchItems();
    if (!selectedContext)
      return items;

    items.push(...getSearchResultsWithinContext(inputText, selectedContext, !!items.length));
    if (exactMatchFound())
      return exactMatchItems();
    return items;
  }

  async importFromClipboard() {
    const pastedContent = window.prompt('Please paste JSON') || '';
    try {
      const parsed = JSON.parse(pastedContent);
      const currentFromJSON = JSON.parse(this.toJSON());
      const merged = mergeWithCommonTitles(parsed, currentFromJSON);

      const nt = NoteTaker.fromJSON(JSON.stringify(merged));

      this.allSections = nt.allSections;
      if (nt.selectedSection)
        this.selectSection(nt.selectedSection);
      if (nt.selectedPage)
        this.selectPage(nt.selectedPage);
      if (nt.selectedContext)
        this.selectContext(nt.selectedContext);
    }
    catch {
      window.alert('Invalid JSON');
    }
  }

  markAsDone(todo: Todo) {
    todo.done = true;
  }

  // command handlers

  moveFocusedItem(upOrDown: 'down' | 'up') {
    if (!this.focusedItem) return;
    if (!this.selectedContext) return;

    const { items, type } = this.selectedContext;

    if (type !== 'todo') return;

    const indexOfFocusedItem = items.findIndex(item => item === this.focusedItem);
    let newIndex = indexOfFocusedItem
      + (upOrDown === 'up' ? -1 : 1);

    if (newIndex === -1) newIndex = items.length - 1;
    else if (newIndex === items.length) newIndex = 0;

    const itemAtNewIndex = items[newIndex]!;
    this.selectedContext.items = items.map((_item, index) => {
      if (index === newIndex) return this.focusedItem!;
      else if (index === indexOfFocusedItem) return itemAtNewIndex;
      else return _item;
    });
  }

  newContext(inputTitle: string, inputContextType: string, page: Page) {
    const title = inputTitle || window.prompt('New context title', 'Default') || '';
    const existingTitles = page.contexts.map(c => c.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase()))
      return window.alert(`Context "${title}" already exists`);

    const contextType = inputContextType || window.prompt('New context type (todo | ol | ul | text)', 'todo') || '';

    let newContext: Context;
    if (contextType === 'todo')
      newContext = { items: [], title, type: 'todo' };
    else if (contextType === 'ol')
      newContext = { items: [], title, type: 'ordered-list' };
    else if (contextType === 'ul')
      newContext = { items: [], title, type: 'unordered-list' };
    else return window.alert('Unsupported context type');

    page.contexts.push(newContext);
    this.selectContext(newContext);
  }

  newListItem(inputTitle: string, context: Context) {
    const title = inputTitle || window.prompt('New item title', '') || '';
    const findMatchingItem = () => context.items.find(todo => todo.title.toLowerCase() === title.toLowerCase());

    if (context.type !== 'todo' && !findMatchingItem()) {
      return context.items.push({ title });
    }
    else {
      const matchingItem = findMatchingItem() as null | Todo;
      if (matchingItem)
        matchingItem.done = false;
      else context.items.push({ done: false, title });
    }
  }

  newPage(inputTitle: string, section: Section) {
    const title = inputTitle || window.prompt('New page title', 'Default') || '';
    const existingTitles = section.pages.map(p => p.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase()))
      return window.alert(`Page "${title}" already exists`);

    const newPage = { contexts: [], title };
    section.pages.push(newPage);
    this.selectPage(newPage);
  }

  newSection(inputTitle: string | undefined) {
    const title = inputTitle || window.prompt('New section title', 'Default') || '';
    const existingTitles = this.allSections.map(s => s.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase()))
      return window.alert(`Section "${title}" already exists`);

    const newSection = { pages: [], title };
    this.allSections.push(newSection);
    this.selectSection(newSection);
  }

  onSelect(searchItem: SearchItem) {
    const { cmd } = searchItem;

    if (cmd === 'section.new')
      return this.newSection(searchItem.sectionTitle);
    if (cmd === 'section.select')
      return this.selectSection(searchItem.section);
    if (cmd === 'page.new')
      return this.newPage(searchItem.pageTitle || '', searchItem.section);
    if (cmd === 'page.select')
      return this.selectPage(searchItem.page);
    if (cmd === 'page.remove-done')
      return this.removeDoneFromPage(searchItem.page);
    if (cmd === 'context.new')
      return this.newContext(searchItem.contextTitle || '', searchItem.contextType || '', searchItem.page);
    if (cmd === 'context.select')
      return this.selectContext(searchItem.context);
    if (cmd === 'context.remove-done')
      return this.removeDoneFromContext(searchItem.context);
    if (cmd === 'context.sort')
      return this.sortItemsInContext(searchItem.context);
    if (cmd === 'todo.new')
      return this.newListItem(searchItem.inputTitle || '', searchItem.context);
    if (cmd === 'list-item.new')
      return this.newListItem(searchItem.inputTitle || '', searchItem.context);
    if (cmd === 'todo.done')
      return this.markAsDone(searchItem.todo);
    if (cmd === 'todo.focus')
      return this.focusedItem = searchItem.todo;

    if (cmd === 'clipboard.import')
      return this.importFromClipboard();
    if (cmd === 'clipboard.export')
      return this.exportToClipboard();
    if (cmd === 'help')
      return this.showHelpAlert();
  }

  removeContext(context: Context) {
    _.remove(this.selectedPage?.contexts || [], c => c === context);
    if (context === this.selectedContext)
      this.selectContext(this.selectedPage?.contexts[0]);
  }

  removeDoneFromContext(context: Context) {
    if (context.type !== 'todo')
      return;

    if (context.items.some(i => i.done)) {
      context.items = context.items.filter(i => !i.done);
    }
  }

  removeDoneFromPage(page: Page) {
    page.contexts.forEach(context => this.removeDoneFromContext(context));
  }

  removePage(page: Page) {
    _.remove(this.selectedSection?.pages || [], p => p === page);
    if (page === this.selectedPage)
      this.selectPage(this.selectedSection?.pages[0]);
  }

  removeSection(section: Section) {
    _.remove(this.allSections, s => s === section);
    if (section === this.selectedSection)
      this.selectSection(this.allSections[0]);
  }

  selectContext(context?: Context) {
    this.selectedContext = context;
    if (this.selectedPage)
      this.selectedPage.activeContextTitle = context?.title;

    this.focusedItem = (context?.type === 'todo')
      ? context.items[0]
      : undefined;
  }

  selectPage(page?: Page) {
    this.selectedPage = page;
    if (this.selectedSection)
      this.selectedSection.activePageTitle = page?.title;

    const contextToAutoSelect = (() => {
      if (!page?.contexts.length)
        return undefined;
      if (page.activeContextTitle)
        return page.contexts.find(c => c.title === page.activeContextTitle);
      return page.contexts[0];
    })();
    this.selectContext(contextToAutoSelect);
  }

  selectSection(section: Section) {
    this.selectedSection = section;

    const pageToAutoSelect = (() => {
      if (!section.pages.length)
        return undefined;
      if (section.activePageTitle)
        return section.pages.find(p => p.title === section.activePageTitle);
      return section.pages[0];
    })();
    this.selectPage(pageToAutoSelect);
  }

  showHelpAlert() {
    const codeAndDescriptions = Object.entries(codeDescriptions);
    const asStrings = codeAndDescriptions.map(([code, description]) => `${code}\t${description}`);
    const joined = _.orderBy(asStrings).join('\n');
    window.alert(joined);
  }

  sortItemsInContext(context: Context) {
    if (!context.items?.length)
      return;
    context.items = _.orderBy(context.items, 'title');
  }

  toJSON() {
    return JSON.stringify({
      allSections: this.allSections,
      selectedContextTitle: this.selectedContext?.title,
      selectedPageTitle: this.selectedPage?.title,
      selectedSectionTitle: this.selectedSection?.title,
    });
  }
}

function copyToClipboard(text: string) {
  const inputElement = document.createElement('input');
  inputElement.id = 'for-clipboard';
  inputElement.value = text;
  inputElement.style.position = 'absolute';
  inputElement.style.visibility = 'hidden';
  document.body.appendChild(inputElement);

  inputElement.select();
  inputElement.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(inputElement.value);

  inputElement.remove();

  window.alert('Copied to clipboard');
}

// Search items

function getContextSelectSearchResults(inputText: string, page: Page) {
  const { additional, code } = parseInputText(inputText);

  const selectItems: SearchItem[] = page.contexts.map(context => ({
    cmd: 'context.select',
    code: 'c',
    context,
    title: `Select context: ${context.title}`,
  }));

  const removeAllDone: SearchItem = {
    cmd: 'page.remove-done',
    code: 'rp',
    exactMatch: true,
    page,
    title: 'Remove done from page',
  };

  if (code === 'rp' && !additional)
    return [removeAllDone];

  if (additional) {
    const [_ignore, contextType, remaining] = additional.match(/^(todo|ol|ul) (.+)?/) || [];

    const exactNewItem: SearchItem = {
      cmd: 'context.new',
      code: 'nc',
      contextTitle: remaining || additional,
      contextType: contextType as 'ol' | 'todo' | 'ul' | undefined,
      exactMatch: true,
      page,
      title: `New context: ${additional || ''}`,
    };

    if (code === 'nc')
      return [exactNewItem];

    if (code === 'c') {
      const results = getFuzzyResults(inputText, selectItems);
      if (results.length)
        return results;
      return [exactNewItem];
    }
  }

  const newItem: SearchItem = {
    cmd: 'context.new',
    code: 'nc',
    page,
    title: 'New context',
  };

  const searchItems = [
    newItem,
    ...selectItems,
  ];
  return getFuzzyResults(inputText, searchItems);
}

function getFuzzyResults(inputText: string, searchItems: SearchItem[]): SearchItem[] {
  const { code } = parseInputText(inputText);

  let items = searchItems;

  if (code) {
    const filtered = searchItems.filter(s => s.code === code);
    if (filtered.length) {
      items = filtered.map(obj => ({ ...obj, exactMatch: true }));
    }
  }

  const filterResults = fuzzy.filter(inputText.trim(), items, { extract: item => item.title.trim() });

  return _.orderBy(filterResults, ['score', 'string'], ['desc', 'asc']).map(obj => obj.original);
}

function getPageSelectSearchResults(inputText: string, section: Section) {
  const { additional, code } = parseInputText(inputText);

  const exactNewItem: SearchItem = {
    cmd: 'page.new',
    code: 'np',
    exactMatch: true,
    pageTitle: additional,
    section,
    title: `New page: ${additional || ''}`,
  };

  if (code === 'np' && additional)
    return [exactNewItem];

  const selectItems: SearchItem[] = section.pages.map(page => ({
    cmd: 'page.select',
    code: 'p',
    page,
    title: `Select page: ${page.title}`,
  }));

  if (code === 'p' && additional) {
    const results = getFuzzyResults(inputText, selectItems);
    if (results.length)
      return results;
    return [exactNewItem];
  }

  const newItem: SearchItem = {
    cmd: 'page.new',
    code: 'np',
    section,
    title: 'New page',
  };

  const searchItems = [
    newItem,
    ...selectItems,
  ];
  return getFuzzyResults(inputText, searchItems);
}

function getSearchResultsWithinContext(inputText: string, context: Context, someResultsFound: boolean) {
  const { additional, code } = parseInputText(inputText);

  const newItem: SearchItem = (() => {
    if (context.type === 'todo')
      return { cmd: 'todo.new', code: 'n', context, title: 'New todo' };
    return { cmd: 'list-item.new', code: 'n', context, title: 'New list item' };
  })();

  if (code === 'n' || code === '-') {
    newItem.code = code;
    newItem.exactMatch = true;
    newItem.inputTitle = additional;
    return [newItem];
  }
  else if (code === 'sort') {
    const searchItem: SearchItem = {
      cmd: 'context.sort',
      code: 'sort',
      context,
      exactMatch: true,
      title: 'Sort items',
    };
    return [searchItem];
  }

  const removeAllDone: SearchItem = {
    cmd: 'context.remove-done',
    code: 'rc',
    context,
    exactMatch: true,
    title: 'Remove done from context',
  };

  if (code === 'rc' && !additional)
    return [removeAllDone];

  const focusItems: SearchItem[] = (context.type !== 'todo' || code !== 'focus')
    ? []
    : context.items.map(todo => ({
        cmd: 'todo.focus',
        code: 'focus',
        title: `Focus: ${todo.title}`,
        todo,
      }));
  const doneItems: SearchItem[] = context.type !== 'todo'
    ? []
    : context.items.map(todo => ({
        cmd: 'todo.done',
        code: 'd',
        title: `Mark as done: ${todo.title}`,
        todo,
      }));

  if (code === 'd') {
    doneItems.forEach((item) => {
      item.exactMatch = true;
      return getFuzzyResults(inputText, doneItems);
    });
  }

  const searchItems = [
    newItem,
    ...focusItems,
    ...doneItems,
  ];
  const fuzzyResults = getFuzzyResults(inputText, searchItems);

  if (someResultsFound || fuzzyResults.length)
    return fuzzyResults;

  newItem.inputTitle = inputText;
  return [newItem];
}

function getSectionSelectSearchResults(inputText: string, allSections: Section[]) {
  const { additional, code } = parseInputText(inputText);

  const exactNewItem: SearchItem = {
    cmd: 'section.new',
    code: 'ns',
    exactMatch: true,
    sectionTitle: additional,
    title: `New section: ${additional || ''}`,
  };

  if (code === 'ns' && additional)
    return [exactNewItem];

  const selectItems: SearchItem[] = allSections.map(section => ({
    cmd: 'section.select',
    code: 's',
    section,
    title: `Select section: ${section.title}`,
  }));

  if (code === 's' && additional) {
    const results = getFuzzyResults(inputText, selectItems);
    if (results.length)
      return results;
    return [exactNewItem];
  }

  const newItem: SearchItem = {
    cmd: 'section.new',
    code: 'ns',
    title: 'New section',
  };

  const searchItems = [
    newItem,
    ...selectItems,
  ];
  return getFuzzyResults(inputText, searchItems);
}

function mergeWithCommonTitles(first: unknown, second: unknown) {
  return _.mergeWith(first, second, (firstItem, secondItem) => {
    if (!_.isArray(firstItem) || !_.isArray(secondItem))
      return undefined; // default merge behaviour

    const byTitles = _.keyBy([...firstItem, ...secondItem], 'title');
    const orderedTitles = _.orderBy(Object.keys(byTitles));
    return orderedTitles.map(title => mergeWithCommonTitles(
      firstItem.find(obj => obj.title === title) || {},
      secondItem.find(obj => obj.title === title) || {},
    ));
  });
}

function parseInputText(inputText: string) {
  const regexOr = codes.join('|');
  // eslint-disable-next-line regexp/prefer-character-class
  const matchRegex = new RegExp(`^(${regexOr}) ?(.+)?`);
  const [_ignore, code, additional] = inputText.match(matchRegex) || [];
  return { additional, code: code as code | undefined };
}
