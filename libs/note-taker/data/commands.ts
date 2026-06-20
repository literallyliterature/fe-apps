import { checkIfStringsMatch, normaliseStringForComparison } from 'utils';
import { array, boolean, literal, object, string, union } from 'zod';

import type { Context, ListItem, Page, Section, StorableNotes } from './NoteTaker.types';

const noteTakerZodSchema = object({
  sections: array(object({
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

export function convertToExportableJSON(noteTaker: StorableNotes): string {
  return JSON.stringify(noteTaker);
}

export function createStorableNotesFromJson(noteTakerJson: string): StorableNotes {
  let storableNotes: StorableNotes;

  try {
    storableNotes = noteTakerZodSchema.parse(JSON.parse(noteTakerJson));
  } catch {
    storableNotes = {
      sections: [],
    };
  }

  return storableNotes;
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

  existingNotes.sections.forEach(s => uniqueKeyToSection[normaliseStringForComparison(s.title)] = s);

  generatedNoteTaker.sections.forEach((s) => {
    const key = normaliseStringForComparison(s.title);
    const sectionFromExisting = uniqueKeyToSection[key];
    uniqueKeyToSection[key] = sectionFromExisting ? mergeSections(sectionFromExisting, s) : s;
  });

  generatedNoteTaker.sections = Object.values(uniqueKeyToSection);

  return generatedNoteTaker;
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

export function selectSection(storableNotes: StorableNotes, sectionTitle?: string): Section | undefined {
  const matchedSection = sectionTitle
    ? storableNotes.sections.find(s => checkIfStringsMatch(s.title, sectionTitle))
    : undefined;
  const section = matchedSection ?? storableNotes.sections[0];
  storableNotes.selectedSectionTitle = section?.title;
  return section;
}
