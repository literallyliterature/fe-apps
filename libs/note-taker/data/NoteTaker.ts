import fuzzy from 'fuzzy';

import { type Context, type Page, type Section, type SearchItem, type Todo } from "./NoteTaker.types";
import _ from 'lodash';


function getFuzzyResults (inputText: string, searchItems: SearchItem[]): SearchItem[] {
  const code = inputText.match(/^(\w{1,2})\b/)?.[0];

  let items = searchItems;

  if (code) {
    const filtered = searchItems.filter(s => s.code === code);
    if (filtered.length) items = filtered;
  }

  const filterResults = fuzzy.filter(inputText, items, { extract: item => item.title });

  return _.orderBy(filterResults, ['score', 'string'], ['desc', 'asc']).map(obj => obj.original);
}


// Search items


function getSectionSelectSearchResults(inputText: string, allSections: Section[]) {
  const newItem: SearchItem = {
    cmd: 'section.new',
    code: 'ns',
    title: 'New section',
  };
  const selectItems: SearchItem[] = allSections.map(section => ({
    cmd: 'section.select',
    code: 's',
    section,
    title: `Select section: ${section.title}`,
  }));

  const searchItems = [
    newItem,
    ...selectItems,
  ]
  return getFuzzyResults(inputText, searchItems);
}

function getPageSelectSearchResults(inputText: string, section: Section, allSections: Section[]) {
  const newItem: SearchItem = {
    cmd: 'page.new',
    code: 'np',
    section,
    title: 'New page',
  };
  const selectItems: SearchItem[] = section.pages.map(page => ({
    cmd: 'page.select',
    code: 'p',
    page,
    title: `Select page: ${page.title}`,
  }));

  const searchItems = [
    ...getSectionSelectSearchResults(inputText, allSections),
    newItem,
    ...selectItems,
  ];
  return getFuzzyResults(inputText, searchItems);
}

function getContextSelectSearchResults(inputText: string, page: Page, section: Section, allSections: Section[]) {
  const newItem: SearchItem = {
    cmd: 'context.new',
    code: 'nc',
    page,
    title: 'New context',
  };
  const selectItems: SearchItem[] = page.contexts.map(context => ({
    cmd: 'context.select',
    code: 'c',
    context,
    title: `Select context: ${context.title}`,
  }));

  const searchItems = [
    ...getPageSelectSearchResults(inputText, section, allSections),
    newItem,
    ...selectItems,
  ];
  return getFuzzyResults(inputText, searchItems);
}

function getSearchResultsWithinContext(inputText: string, context: Context, page: Page, section: Section, allSections: Section[]) {
  const newItem: SearchItem = (() => {
    if (context.type === 'todo') return { cmd: 'todo.new', code: 'n', context, title: 'New todo' };
    return { cmd: 'list-item.new', code: 'n', context, title: 'New list item' };
  })();
  const doneItems: SearchItem[] = context.type !== 'todo' ?
    [] :
    context.items.map(todo => ({
      cmd: 'todo.done',
      code: 'd',
      todo,
      title: `Mark as done: ${todo.title}`,
    }));

  const searchItems = [
    ...getContextSelectSearchResults(inputText, page, section, allSections),
    newItem,
    ...doneItems,
  ];
  return getFuzzyResults(inputText, searchItems);
}


export class NoteTaker {
  allSections: Section[];
  selectedSection?: Section;
  selectedPage?: Page;
  selectedContext?: Context;

  constructor(allSections = []) {
    this.allSections = allSections;
    if (allSections.length) this.selectedSection = allSections[0];
  }

  getSearchItems(inputText: string): SearchItem[] {
    const { allSections, selectedSection, selectedPage, selectedContext } = this;

    if (!selectedSection) return getSectionSelectSearchResults(inputText, allSections);
    if (!selectedPage) return getPageSelectSearchResults(inputText, selectedSection, allSections);
    if (!selectedContext) return getContextSelectSearchResults(inputText, selectedPage, selectedSection, allSections);
    return getSearchResultsWithinContext(inputText, selectedContext, selectedPage, selectedSection, allSections);
  }

  onSelect(searchItem: SearchItem) {
    const { cmd } = searchItem;

    if (cmd === 'section.new') return this.newSection();
    if (cmd === 'section.select') return this.selectSection(searchItem.section);
    if (cmd === 'page.new') return this.newPage(searchItem.section);
    if (cmd === 'page.select') return this.selectPage(searchItem.page);
    if (cmd === 'context.new') return this.newContext(searchItem.page);
    if (cmd === 'context.select') return this.selectContext(searchItem.context);
    if (cmd === 'todo.new') return this.newListItem(searchItem.context);
    if (cmd === 'list-item.new') return this.newListItem(searchItem.context);
    if (cmd === 'todo.done') return this.markAsDone(searchItem.todo);
  }

  // command handlers

  markAsDone(todo: Todo) {
    todo.done = true;
  }

  newContext(page: Page) {
    const title = window.prompt('New context title', 'Default') || '';
    const existingTitles = page.contexts.map(c => c.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase())) return window.alert(`Context "${title}" already exists`);

    const contextType = window.prompt('New context type (todo | ol | ul | text)', 'todo') || '';

    if (contextType === 'todo') return page.contexts.push({ type: 'todo', title, items: [] });
    if (contextType === 'ol') return page.contexts.push({ type: 'ordered-list', title, items: [] });
    if (contextType === 'ul') return page.contexts.push({ type: 'unordered-list', title, items: [] });

    return window.alert('Unsupported context type');
  }

  newListItem(context: Context) {
    const title = window.prompt('New item title', '') || '';
    const findMatchingItem = () => context.items.find(todo => todo.title.toLowerCase() === title.toLowerCase());

    if (context.type !== 'todo' && !findMatchingItem()) {
      return context.items.push({ title });
    } else {
      const matchingItem = findMatchingItem() as Todo | null;
      if (matchingItem) matchingItem.done = false;
      else context.items.push({ done: false, title });
    }
  }

  newPage(section: Section) {
    const title = window.prompt('New page title', 'Default') || '';
    const existingTitles = section.pages.map(p => p.title.toLowerCase())

    if (existingTitles.includes(title.toLowerCase())) return window.alert(`Page "${title}" already exists`);
    section.pages.push({ contexts: [], title });
  }

  newSection() {
    const title = window.prompt('New section title', 'Default') || '';
    const existingTitles = this.allSections.map(s => s.title.toLowerCase());

    if (existingTitles.includes(title.toLowerCase())) return window.alert(`Section "${title}" already exists`);
    this.allSections.push({ pages: [], title });
  }

  selectContext(context: Context) {
    this.selectedContext = context;
  }

  selectPage(page: Page) {
    this.selectedPage = page;
    if (page.contexts.length) this.selectContext(page.contexts[0]);
  }

  selectSection(section: Section) {
    this.selectedSection = section;
    if (section.pages.length) this.selectPage(section.pages[0]);
  }
}
