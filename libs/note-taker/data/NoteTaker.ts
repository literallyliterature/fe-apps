import fuzzy from 'fuzzy';

import { type Context, type Page, type Section, type SearchItem, type Todo } from "./NoteTaker.types";
import _ from 'lodash';


function parseInputText(inputText: string) {
  const [ignore, code, additional] = inputText.match(/^(\w{1,2})\b ?(.+)?/) || [];
  return { code, additional };
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


// Search items

function getSectionSelectSearchResults(inputText: string, allSections: Section[]) {
  const { code, additional } = parseInputText(inputText);

  const exactNewItem: SearchItem = {
    cmd: 'section.new',
    code: 'ns',
    exactMatch: true,
    sectionTitle: additional,
    title: `New section: ${additional || ''}`,
  };

  if (code === 'ns' && additional) return [exactNewItem];

  const selectItems: SearchItem[] = allSections.map(section => ({
    cmd: 'section.select',
    code: 's',
    section,
    title: `Select section: ${section.title}`,
  }));

  if (code === 's' && additional) {
    const results = getFuzzyResults(inputText, selectItems);
    if (results.length) return results;
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
  ]
  return getFuzzyResults(inputText, searchItems);
}

function getPageSelectSearchResults(inputText: string, section: Section) {
  const { code, additional } = parseInputText(inputText);

  const exactNewItem: SearchItem = {
    cmd: 'page.new',
    code: 'np',
    exactMatch: true,
    pageTitle: additional,
    section,
    title: `New page: ${additional || ''}`,
  };

  if (code === 'np' && additional) return [exactNewItem];

  const selectItems: SearchItem[] = section.pages.map(page => ({
    cmd: 'page.select',
    code: 'p',
    page,
    title: `Select page: ${page.title}`,
  }));

  if (code === 'p' && additional) {
    const results = getFuzzyResults(inputText, selectItems);
    if (results.length) return results;
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

function getContextSelectSearchResults(inputText: string, page: Page) {
  const { code, additional } = parseInputText(inputText);
  
  const selectItems: SearchItem[] = page.contexts.map(context => ({
    cmd: 'context.select',
    code: 'c',
    context,
    title: `Select context: ${context.title}`,
  }));

  if (additional) {
    const [ignore, contextType, remaining] = additional.match(/^(todo|ol|ul) (.+)?/) || [];

    const exactNewItem: SearchItem = {
      cmd: 'context.new',
      code: 'nc',
      exactMatch: true,
      contextType: contextType as 'ul'|'ol'|'todo'|undefined,
      contextTitle: remaining || additional,
      page,
      title: `New context: ${additional || ''}`,
    };

    if (code === 'nc') return [exactNewItem];

    if (code === 'c') {
      const results = getFuzzyResults(inputText, selectItems);
      if (results.length) return results;
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

function getSearchResultsWithinContext(inputText: string, context: Context, someResultsFound: boolean) {
  const { code, additional } = parseInputText(inputText);

  const newItem: SearchItem = (() => {
    if (context.type === 'todo') return { cmd: 'todo.new', code: 'n', context, title: 'New todo' };
    return { cmd: 'list-item.new', code: 'n', context, title: 'New list item' };
  })();

  if (code === 'n') {
    newItem.exactMatch = true;
    newItem.inputTitle = additional;
    return [newItem];
  }

  const doneItems: SearchItem[] = context.type !== 'todo' ?
    [] :
    context.items.map(todo => ({
      cmd: 'todo.done',
      code: 'd',
      todo,
      title: `Mark as done: ${todo.title}`,
    }));

  if (code === 'd') {
    doneItems.forEach((item) => {
      item.exactMatch = true;
      return getFuzzyResults(inputText, doneItems);
    })
  }

  const searchItems = [
    newItem,
    ...doneItems,
  ];
  const fuzzyResults = getFuzzyResults(inputText, searchItems);

  if (someResultsFound || fuzzyResults.length) return fuzzyResults;

  newItem.inputTitle = inputText;
  return [newItem];
}


export class NoteTaker {
  allSections: Section[];
  selectedSection?: Section;
  selectedPage?: Page;
  selectedContext?: Context;

  constructor(allSections = []) {
    this.allSections = allSections;
    if (allSections.length) this.selectSection(allSections[0]);
  }

  getSearchItems(inputText: string): SearchItem[] {
    const { allSections, selectedSection, selectedPage, selectedContext } = this;

    let items: SearchItem[] = [];

    const exactMatchFound = () => items.some(item => item.exactMatch);
    const exactMatchItems = () => items.filter(item => item.exactMatch);

    items = getSectionSelectSearchResults(inputText, allSections);
    if (exactMatchFound()) return exactMatchItems();
    if (!selectedSection) return items;

    items.push(...getPageSelectSearchResults(inputText, selectedSection));
    if (exactMatchFound()) return exactMatchItems();
    if (!selectedPage) return items;

    items.push(...getContextSelectSearchResults(inputText, selectedPage));
    if (exactMatchFound()) return exactMatchItems();
    if (!selectedContext) return items;

    items.push(...getSearchResultsWithinContext(inputText, selectedContext, !!items.length));
    if (exactMatchFound()) return exactMatchItems();
    return items;
  }

  onSelect(searchItem: SearchItem) {
    const { cmd } = searchItem;

    if (cmd === 'section.new') return this.newSection(searchItem.sectionTitle);
    if (cmd === 'section.select') return this.selectSection(searchItem.section);
    if (cmd === 'page.new') return this.newPage(searchItem.pageTitle || '', searchItem.section);
    if (cmd === 'page.select') return this.selectPage(searchItem.page);
    if (cmd === 'context.new') return this.newContext(searchItem.contextTitle || '', searchItem.contextType || '', searchItem.page);
    if (cmd === 'context.select') return this.selectContext(searchItem.context);
    if (cmd === 'todo.new') return this.newListItem(searchItem.inputTitle || '', searchItem.context);
    if (cmd === 'list-item.new') return this.newListItem(searchItem.inputTitle || '', searchItem.context);
    if (cmd === 'todo.done') return this.markAsDone(searchItem.todo);
  }

  // command handlers

  markAsDone(todo: Todo) {
    todo.done = true;
  }

  newContext(inputTitle: string, inputContextType: string, page: Page) {
    const title = inputTitle || window.prompt('New context title', 'Default') || '';
    const existingTitles = page.contexts.map(c => c.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase())) return window.alert(`Context "${title}" already exists`);

    const contextType = inputContextType || window.prompt('New context type (todo | ol | ul | text)', 'todo') || '';

    let newContext: Context;
    if (contextType === 'todo') newContext = { type: 'todo', title, items: [] };
    else if (contextType === 'ol') newContext = { type: 'ordered-list', title, items: [] };
    else if (contextType === 'ul') newContext = { type: 'unordered-list', title, items: [] };
    else return window.alert('Unsupported context type');

    page.contexts.push(newContext);
    this.selectContext(newContext);
  }

  newListItem(inputTitle: string, context: Context) {
    const title = inputTitle || window.prompt('New item title', '') || '';
    const findMatchingItem = () => context.items.find(todo => todo.title.toLowerCase() === title.toLowerCase());

    if (context.type !== 'todo' && !findMatchingItem()) {
      return context.items.push({ title });
    } else {
      const matchingItem = findMatchingItem() as Todo | null;
      if (matchingItem) matchingItem.done = false;
      else context.items.push({ done: false, title });
    }
  }

  newPage(inputTitle: string, section: Section) {
    const title = inputTitle || window.prompt('New page title', 'Default') || '';
    const existingTitles = section.pages.map(p => p.title.toLowerCase())

    if (existingTitles.includes(title.toLowerCase())) return window.alert(`Page "${title}" already exists`);

    const newPage = { contexts: [], title }
    section.pages.push(newPage);
    this.selectPage(newPage);
  }

  newSection(inputTitle: string | undefined) {
    const title = inputTitle || window.prompt('New section title', 'Default') || '';
    const existingTitles = this.allSections.map(s => s.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase())) return window.alert(`Section "${title}" already exists`);

    const newSection = { pages: [], title };
    this.allSections.push(newSection);
    this.selectSection(newSection);
  }

  selectContext(context?: Context) {
    this.selectedContext = context;
  }

  selectPage(page?: Page) {
    this.selectedPage = page;
    this.selectContext(page?.contexts?.[0]);
  }

  selectSection(section: Section) {
    this.selectedSection = section;
    this.selectPage(section.pages[0] || null);
  }
}
