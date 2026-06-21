import fuzzy from 'fuzzy';
import _, { orderBy } from 'lodash';
import { checkIfStringsMatch, moveItemDown, moveItemUp, normaliseStringForComparison } from 'utils';
import { array, boolean, literal, object, string, union } from 'zod';

import type { Context, ListItem, Page, Section, StorableNotes } from './NoteTaker.types';

const noteTakerZodSchema = object({
  allSections: array(object({
    activePageTitle: string().optional(),
    pages: array(object({
      activeContextTitle: string().optional(),
      contexts: array(object({
        focusedItemTitle: string().optional(),
        items: array(object({
          done: boolean().optional(),
          title: string(),
        })),
        title: string(),
        type: union([literal('todo'), literal('ordered-list'), literal('unordered-list')]),
      })),
      title: string(),
    })),
    title: string(),
  })),
  selectedSectionTitle: string().optional(),
});

export function changeFocusedItemInContext(context: Context, upOrDown: 'down' | 'up'): void {
  const { focusedItemTitle } = context;
  const indexOfFocusedItem = focusedItemTitle
    ? context.items.findIndex(item => checkIfStringsMatch(item.title, focusedItemTitle))
    : -1;
  const lastItemIndex = context.items.length - 1;

  if (!focusedItemTitle || context.items.length <= 1 || indexOfFocusedItem === -1) {
    const index = upOrDown === 'up' ? lastItemIndex : 0;
    context.focusedItemTitle = context.items[index]?.title;
    return;
  }

  const newIndex: number = (() => {
    if (indexOfFocusedItem === 0 && upOrDown === 'up') return lastItemIndex;
    if (indexOfFocusedItem === lastItemIndex && upOrDown === 'down') return 0;
    return indexOfFocusedItem + (upOrDown === 'up' ? -1 : 1);
  })();

  context.focusedItemTitle = context.items[newIndex]?.title;
}

export function changeSelectedPageInSection(section: Section, upOrDown: 'down' | 'up'): void {
  if (section.pages.length <= 1) return;

  const { activePageTitle, pages } = section;
  const indexOfSelectedPage = activePageTitle
    ? pages.findIndex(page => checkIfStringsMatch(page.title, activePageTitle))
    : -1;
  const lastPageIndex = section.pages.length - 1;

  if (!activePageTitle || section.pages.length <= 1 || indexOfSelectedPage === -1) {
    const index = upOrDown === 'up' ? lastPageIndex : 0;
    section.activePageTitle = section.pages[index]?.title;
    return;
  }

  const newIndex: number = (() => {
    if (indexOfSelectedPage === 0 && upOrDown === 'up') return lastPageIndex;
    if (indexOfSelectedPage === lastPageIndex && upOrDown === 'down') return 0;
    return indexOfSelectedPage + (upOrDown === 'up' ? -1 : 1);
  })();

  section.activePageTitle = section.pages[newIndex]?.title;
}

export function convertToExportableJSON(storableNotes: StorableNotes): string {
  return JSON.stringify(storableNotes);
}

export function createStorableNotesFromJson(storableNotesJson: string): StorableNotes {
  let storableNotes: StorableNotes;

  try {
    storableNotes = noteTakerZodSchema.parse(JSON.parse(storableNotesJson));
  } catch {
    storableNotes = {
      allSections: [],
    };
  }

  return storableNotes;
}

export function deleteContextFromPage(contextTitle: string, page: Page): void {
  page.contexts = page.contexts.filter(c => !checkIfStringsMatch(c.title, contextTitle));
  selectContextInPage(page, page.activeContextTitle);
}

export function deleteItemFromContext(itemTitle: string, context: Context): void {
  context.items = context.items.filter(item => !checkIfStringsMatch(item.title, itemTitle));
  focusItemInContext(context, context.focusedItemTitle);
}

export function deletePageFromSection(pageTitle: string, section: Section): void {
  section.pages = section.pages.filter(c => !checkIfStringsMatch(c.title, pageTitle));
  selectPageInSection(section, section.activePageTitle);
}

export function deleteSectionFromStorableNotes(sectionTitle: string, storableNotes: StorableNotes): void {
  storableNotes.allSections = storableNotes.allSections.filter(s => !checkIfStringsMatch(s.title, sectionTitle));
  selectSectionInStorableNotes(storableNotes, storableNotes.selectedSectionTitle);
}

export function editTitle<T extends { title: string }>(item: T, otherItems: T[]) {
  const newTitle = window.prompt('New title', item.title) || '';
  const isValid = newTitle && otherItems.every(item => !checkIfStringsMatch(item.title, newTitle));
  if (isValid) item.title = newTitle;
}

export function findContextInPage(contextTitle: string, page: Page): Context | undefined {
  return page.contexts.find(c => checkIfStringsMatch(c.title, contextTitle));
}

export function findOrCreateItemInContext(itemTitle: string, context: Context): ListItem {
  const existingItem = context.items.find(item => checkIfStringsMatch(item.title, itemTitle));
  if (existingItem) return existingItem;

  const newItem: ListItem = { title: itemTitle };
  context.items.push(newItem);
  return newItem;
}

export function findOrCreatePageInSection(pageTitle: string, section: Section): Page {
  const existingMatch = section.pages.find(p => checkIfStringsMatch(p.title, pageTitle));
  if (existingMatch) return existingMatch;

  const newPage: Page = {
    contexts: [],
    title: pageTitle,
  };
  section.pages.push(newPage);
  return newPage;
}

export function findOrCreateSection(sectionTitle: string, sections: Section[]): Section {
  const existingMatch = sections.find(s => checkIfStringsMatch(s.title, sectionTitle));
  if (existingMatch) return existingMatch;

  const newSection = {
    pages: [],
    title: sectionTitle,
  };
  sections.push(newSection);
  return newSection;
}

export function focusItemInContext(context: Context, itemTitle?: string): ListItem | undefined {
  const matchedItem = itemTitle
    ? context.items.find(item => checkIfStringsMatch(item.title, itemTitle))
    : undefined;
  const item = matchedItem ?? context.items[0];
  context.focusedItemTitle = item?.title;
  return item;
}

export function getFuzzyMatches<T extends { title: string }>(items: T[], inputText: string) {
  const filterResults = fuzzy.filter(inputText.trim(), items, { extract: item => item.title.trim() });
  return orderBy(filterResults, ['score', 'string'], ['desc', 'asc']).map(obj => obj.original);
}

export function mergeContexts<C extends Context>(first: Context, second: C): C {
  if (first.type !== second.type) return second;

  const uniqueKeyToItem: Record<string, ListItem> = {};

  [...first.items, ...second.items].forEach((item) => {
    uniqueKeyToItem[normaliseStringForComparison(item.title)] = item;
  });

  return {
    ...second,
    items: Object.values(uniqueKeyToItem),
  };
}

export function mergePages(first: Page, second: Page): Page {
  const uniqueKeyToContext: Record<string, Context> = {};
  first.contexts.forEach(c => uniqueKeyToContext[normaliseStringForComparison(c.title)] = c);

  second.contexts.forEach((c) => {
    const key = normaliseStringForComparison(c.title);
    const matchingContextFromFirst = uniqueKeyToContext[key];
    uniqueKeyToContext[key] = matchingContextFromFirst ? mergeContexts(matchingContextFromFirst, c) : c;
  });

  return {
    ...second,
    contexts: Object.values(uniqueKeyToContext),
  };
}

export function mergeSections(first: Section, second: Section): Section {
  const uniqueKeyToPage: Record<string, Page> = {};
  first.pages.forEach(p => uniqueKeyToPage[normaliseStringForComparison(p.title)] = p);

  second.pages.forEach((p) => {
    const key = normaliseStringForComparison(p.title);
    const matchingPageFromFirst = uniqueKeyToPage[key];
    uniqueKeyToPage[key] = matchingPageFromFirst ? mergePages(matchingPageFromFirst, p) : p;
  });

  return {
    ...second,
    pages: Object.values(uniqueKeyToPage),
  };
}

export function mergeStorableNotes(existingNotes: StorableNotes, importedNotesJson: string): StorableNotes {
  const generatedNoteTaker = createStorableNotesFromJson(importedNotesJson);

  const uniqueKeyToSection: Record<string, Section> = {};

  existingNotes.allSections.forEach(s => uniqueKeyToSection[normaliseStringForComparison(s.title)] = s);

  generatedNoteTaker.allSections.forEach((s) => {
    const key = normaliseStringForComparison(s.title);
    const sectionFromExisting = uniqueKeyToSection[key];
    uniqueKeyToSection[key] = sectionFromExisting ? mergeSections(sectionFromExisting, s) : s;
  });

  generatedNoteTaker.allSections = Object.values(uniqueKeyToSection);

  return generatedNoteTaker;
}

export function moveItemInContext(context: Context, itemTitle: string, upOrDown: 'down' | 'up'): void {
  if (context.items.length <= 1) return;

  const [doneItems, unfinishedItems] = _.partition(context.items, item => context.type === 'todo' ? item.done : false);
  const moveFn = upOrDown === 'up' ? moveItemUp : moveItemDown;

  context.items = [
    ...moveFn(unfinishedItems, unfinishedItems.findIndex(item => checkIfStringsMatch(item.title, itemTitle))),
    ...moveFn(doneItems, doneItems.findIndex(item => checkIfStringsMatch(item.title, itemTitle))),
  ];
}

export function removeDoneItemsFromContext(context: Context): void {
  context.items = context.items.filter(item => !item.done);
}

export function removeDoneItemsFromPage(page: Page): void {
  page.contexts.forEach(removeDoneItemsFromContext);
}

export function selectContextInPage(page: Page, contextTitle?: string): Context | undefined {
  const matchedContext = contextTitle
    ? page.contexts.find(c => checkIfStringsMatch(c.title, contextTitle))
    : undefined;
  const context = matchedContext ?? page.contexts[0];
  page.activeContextTitle = context?.title;
  return context;
}

export function selectPageInSection(section: Section, pageTitle?: string): Page | undefined {
  const matchedPage = pageTitle
    ? section.pages.find(p => checkIfStringsMatch(p.title, pageTitle))
    : undefined;
  const page = matchedPage ?? section.pages[0];
  section.activePageTitle = page?.title;
  return page;
}

export function selectSectionInStorableNotes(storableNotes: StorableNotes, sectionTitle?: string): Section | undefined {
  const matchedSection = sectionTitle
    ? storableNotes.allSections.find(s => checkIfStringsMatch(s.title, sectionTitle))
    : undefined;
  const section = matchedSection ?? storableNotes.allSections[0];
  storableNotes.selectedSectionTitle = section?.title;
  return section;
}

export function sortItemsInContextAlphabetically(context: Context): void {
  context.items = _.sortBy(context.items, item => item.title);
  sortItemsInContextByCompletion(context);
}

export function sortItemsInContextByCompletion(context: Context): void {
  context.items = _.sortBy(context.items, item => !!item.done);
}

export function toggleListItem(context: Context, itemTitle: string): ListItem | undefined {
  if (context.type !== 'todo') return;

  const itemIndex = context.items.findIndex(item => checkIfStringsMatch(item.title, itemTitle));
  const item = context.items[itemIndex];

  if (!item) return undefined;

  item.done = !item.done;
  sortItemsInContextByCompletion(context);

  // if the item is now done, and the new item at the same index is NOT done, then make it the focused item
  const newItemAtIndex = context.items[itemIndex];
  if (item.done && newItemAtIndex && !newItemAtIndex.done) focusItemInContext(context, newItemAtIndex.title);

  return item;
}
