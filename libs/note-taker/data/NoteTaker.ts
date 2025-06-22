import fuzzy from 'fuzzy';

import { type Context, type Page, type Section, type SearchItem, type Todo } from "./NoteTaker.types";
import _ from 'lodash';

type code = SearchItem['code'];
const codeDescriptions: { [K in code]: string } = {
  ns: 'New section',
  s: 'Section: Select or new',
  np: 'New page',
  p: 'Page: Select or new',
  nc: 'New context',
  c: 'Context: Select or new',
  n: 'New item',
  d: 'Mark todo item as done',
  rc: 'Remove context',
  rp: 'Remove page',
  import: 'Import JSON',
  export: 'Export as JSON',
  sort: 'Sort items in context',
  help: 'See available codes',
};

const codes = Object.keys(codeDescriptions) as code[];

function parseInputText(inputText: string) {
  const regexOr = codes.join('|');
  const matchRegex = new RegExp(`^(${regexOr})\\b ?(.+)?`);
  const [ignore, code, additional] = inputText.match(matchRegex) || [];
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

  const removeAllDone: SearchItem = {
    cmd: 'page.remove-done',
    code: 'rp',
    exactMatch: true,
    page,
    title: 'Remove done from page'
  }

  if (code === 'rp' && !additional) return [removeAllDone];

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
  } if (code === 'sort') {
    const searchItem: SearchItem = {
      cmd: 'context.sort',
      code: 'sort',
      context: context,
      exactMatch: true,
      title: 'Sort items',
    };
    return [searchItem];
  }

  const removeAllDone: SearchItem = {
    cmd: 'context.remove-done',
    code: 'rc',
    exactMatch: true,
    context,
    title: 'Remove done from context'
  }

  if (code === 'rc' && !additional) return [removeAllDone];

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

function mergeWithCommonTitles(first, second) {
  return _.mergeWith(first, second, (firstItem, secondItem) => {
    if (!_.isArray(firstItem) || !_.isArray(secondItem)) return undefined; // default merge behaviour

    const byTitles = _.keyBy([...firstItem, ...secondItem], 'title');
    const orderedTitles = _.orderBy(Object.keys(byTitles));
    return orderedTitles.map(title => mergeWithCommonTitles(
      firstItem.find(obj => obj.title === title) || {},
      secondItem.find(obj => obj.title === title) || {},
    ));
  });
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


export class NoteTaker {
  allSections: Section[];
  selectedSection?: Section;
  selectedPage?: Page;
  selectedContext?: Context;

  constructor(allSections = []) {
    this.allSections = allSections;
    if (allSections.length) this.selectSection(allSections[0]);
  }

  static fromJSON(storedJSON) {
    if (!storedJSON) return new NoteTaker();

    try {
      const {
        allSections, selectedSectionTitle, selectedPageTitle, selectedContextTitle,
      } = JSON.parse(storedJSON);

      if (!allSections?.length) return new NoteTaker();

      const nt = new NoteTaker(allSections);
      if (!selectedSectionTitle) return nt;

      try {
        const section = nt.allSections.find(s => s.title === selectedSectionTitle);
        if (!section) return nt;
        nt.selectSection(section);

        const page = section.pages.find(p => p.title === selectedPageTitle);
        if (!page) return nt;
        nt.selectPage(page);

        const context = page.contexts.find(c => c.title === selectedContextTitle);
        if (!context) return nt;
        nt.selectContext(context);
        return nt;
      } catch (error) {
        console.error(error);
        return nt;
      }
    } catch (error) {
      console.error(error);
      return new NoteTaker();
    }
  }

  toJSON() {
    return JSON.stringify({
      allSections: this.allSections,
      selectedSectionTitle: this.selectedSection?.title,
      selectedPageTitle: this.selectedPage?.title,
      selectedContextTitle: this.selectedContext?.title,
    });
  }

  exportToClipboard() {
    copyToClipboard(this.toJSON());
  }

  async importFromClipboard() {
    const pastedContent = window.prompt('Please paste JSON') || '';
    try {
      const parsed = JSON.parse(pastedContent);
      const currentFromJSON = JSON.parse(this.toJSON());
      const merged = mergeWithCommonTitles(parsed, currentFromJSON);

      const nt = NoteTaker.fromJSON(JSON.stringify(merged));

      this.allSections = nt.allSections;
      if (nt.selectedSection) this.selectSection(nt.selectedSection);
      if (nt.selectedPage) this.selectPage(nt.selectedPage);
      if (nt.selectedContext) this.selectContext(nt.selectedContext);
    } catch {
      window.alert('Invalid JSON');
    }
  }

  getSearchItems(inputText: string): SearchItem[] {
    const { allSections, selectedSection, selectedPage, selectedContext } = this;

    let items: SearchItem[] = [];

    const exactMatchFound = () => items.some(item => item.exactMatch);
    const exactMatchItems = () => items.filter(item => item.exactMatch);

    const { code, additional } = parseInputText(inputText);
    if (code === 'ex' && !additional) {
      return [{ code: 'export', cmd: 'clipboard.export', title: 'Export to clipboard', exactMatch: true }];
    } else if (code === 'im' && !additional) {
      return [{ code: 'import', cmd: 'clipboard.import', title: 'Import from clipboard', exactMatch: true }];
    } else if (code === 'help' && !additional) {
      return [{ code: 'help', cmd: 'help', title: codeDescriptions.help, exactMatch: true }]
    }

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
    if (cmd === 'page.remove-done') return this.removeDoneFromPage(searchItem.page);
    if (cmd === 'context.new') return this.newContext(searchItem.contextTitle || '', searchItem.contextType || '', searchItem.page);
    if (cmd === 'context.select') return this.selectContext(searchItem.context);
    if (cmd === 'context.remove-done') return this.removeDoneFromContext(searchItem.context);
    if (cmd === 'context.sort') return this.sortItemsInContext(searchItem.context);
    if (cmd === 'todo.new') return this.newListItem(searchItem.inputTitle || '', searchItem.context);
    if (cmd === 'list-item.new') return this.newListItem(searchItem.inputTitle || '', searchItem.context);
    if (cmd === 'todo.done') return this.markAsDone(searchItem.todo);

    if (cmd === 'clipboard.import') return this.importFromClipboard();
    if (cmd === 'clipboard.export') return this.exportToClipboard();
    if (cmd === 'help') return this.showHelpAlert();
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

  removeContext(context: Context) {
    _.remove(this.selectedPage?.contexts || [], c => c === context);
    if (context === this.selectedContext) this.selectContext(this.selectedPage?.contexts[0]);
  }

  removeDoneFromContext(context: Context) {
    if (context.type !== 'todo') return;

    if (context.items.some(i => i.done)) {
      context.items = context.items.filter(i => !i.done);
    }
  }

  removeDoneFromPage(page: Page) {
    page.contexts.forEach((context) => this.removeDoneFromContext(context));
  }

  removePage(page: Page) {
    _.remove(this.selectedSection?.pages || [], p => p === page);
    if (page === this.selectedPage) this.selectPage(this.selectedSection?.pages[0]);
  }

  removeSection(section: Section) {
    _.remove(this.allSections, s => s === section);
    if (section === this.selectedSection) this.selectSection(this.allSections[0]);
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

  showHelpAlert() {
    const codeAndDescriptions = Object.entries(codeDescriptions);
    const asStrings = codeAndDescriptions.map(([code, description]) => `${code}\t${description}`);
    const joined = _.orderBy(asStrings).join('\n');
    window.alert(joined);
  }

  sortItemsInContext(context: Context) {
    if (!context.items?.length) return;
    context.items = _.orderBy(context.items, 'title');
  }
}
