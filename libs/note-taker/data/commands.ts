import { checkIfStringsMatch, normaliseStringForComparison } from 'utils';

import type { Context, NoteTakerExportable, Page, Section } from './NoteTaker.types';

import { NoteTaker } from './NoteTaker';

export function convertToExportable(noteTaker: NoteTaker): NoteTakerExportable {
  return {
    allSections: noteTaker.allSections,
    focusedItemTitle: noteTaker.focusedItem?.title,
    selectedContextTitle: noteTaker.selectedContext?.title,
    selectedPageTitle: noteTaker.selectedPage?.title,
    selectedSectionTitle: noteTaker.selectedSection?.title,
  };
}

export function convertToExportableJSON(noteTaker: NoteTaker): string {
  return JSON.stringify(convertToExportable(noteTaker));
}

export function createNoteTakerFromJSON(noteTakerJson: string): NoteTaker {
  let parsed: NoteTakerExportable;
  try {
    parsed = JSON.parse(noteTakerJson) as NoteTakerExportable;
  } catch {
    parsed = {
      allSections: [],
      focusedItemTitle: undefined,
      selectedContextTitle: undefined,
      selectedPageTitle: undefined,
      selectedSectionTitle: undefined,
    };
  }

  const noteTaker = new NoteTaker(parsed.allSections);
  selectSection({ noteTaker, sectionTitle: parsed.selectedSectionTitle });
  selectPageInSelectedSection({ noteTaker, pageTitle: parsed.selectedPageTitle });
  selectContextInSelectedPage({ contextTitle: parsed.selectedContextTitle, noteTaker });
  focusItemInSelectedContext({ itemTitle: parsed.focusedItemTitle, noteTaker });

  return noteTaker;
}

export function createSection({ existingSections, sectionTitle }: {
  existingSections: Section[]
  sectionTitle: string
}): Section {
  const existingMatch = getMatchingSection({ existingSections, sectionTitle });
  return existingMatch ?? {
    pages: [],
    title: sectionTitle,
  };
}

export function focusItemInSelectedContext({ itemTitle, noteTaker }: {
  itemTitle: string | undefined
  noteTaker: NoteTaker
}): void {
  const context = noteTaker.selectedContext;
  const item = context
    ? getMatchingItemFromContext({ context, itemTitle })
    : undefined;
  noteTaker.focusedItem = item;
}

export function getMatchingContextFromPage({ contextTitle, page }: {
  contextTitle: string | undefined
  page: Page
}): Context | undefined {
  if (!contextTitle) return page.contexts[0];
  return page.contexts.find(p => checkIfStringsMatch(p.title, contextTitle));
}

export function getMatchingItemFromContext<C extends Context>({ context, itemTitle }: {
  context: C
  itemTitle: string | undefined
}): C['items'][number] | undefined {
  if (!itemTitle) return context.items[0];
  return context.items.find(i => checkIfStringsMatch(i.title, itemTitle));
}

export function getMatchingPageFromSection({ pageTitle, section }: {
  pageTitle: string | undefined
  section: Section
}): Page | undefined {
  if (!pageTitle) return section.pages[0];
  return section.pages.find(p => checkIfStringsMatch(p.title, pageTitle));
}

export function getMatchingSection({ existingSections, sectionTitle }: {
  existingSections: Section[]
  sectionTitle: string
}): Section | undefined {
  return existingSections.find(s => checkIfStringsMatch(s.title, sectionTitle));
}

export function mergeContexts<T extends Context>(first: Context, second: T): T {
  if (first.type !== second.type) return second;

  const uniqueKeyToItem: Record<string, T['items'][number]> = {};

  [...first.items, ...second.items].forEach((item) => {
    uniqueKeyToItem[normaliseStringForComparison(item.title)] = item;
  });

  return {
    ...second,
    items: Object.values(uniqueKeyToItem),
  };
}

export function mergeNoteTakers(existingNoteTaker: NoteTaker, importedNoteTakerJson: string): NoteTaker {
  const generatedNoteTaker = createNoteTakerFromJSON(importedNoteTakerJson);

  const uniqueKeyToSection: Record<string, Section> = {};

  existingNoteTaker.allSections.forEach(s => uniqueKeyToSection[normaliseStringForComparison(s.title)] = s);

  generatedNoteTaker.allSections.forEach((s) => {
    const key = normaliseStringForComparison(s.title);
    const sectionFromExisting = uniqueKeyToSection[key];
    uniqueKeyToSection[key] = sectionFromExisting ? mergeSections(sectionFromExisting, s) : s;
  });

  generatedNoteTaker.allSections = Object.values(uniqueKeyToSection);

  return generatedNoteTaker;
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

export function selectContextInSelectedPage({ contextTitle, noteTaker }: {
  contextTitle: string | undefined
  noteTaker: NoteTaker
}): void {
  const page = noteTaker.selectedPage;
  const context = page
    ? (getMatchingContextFromPage({ contextTitle, page }) ?? page.contexts[0])
    : undefined;
  noteTaker.selectedContext = context;
  focusItemInSelectedContext({ itemTitle: context?.focusedItemTitle, noteTaker });
}

export function selectPageInSelectedSection({ noteTaker, pageTitle }: {
  noteTaker: NoteTaker
  pageTitle: string | undefined
}): void {
  const section = noteTaker.selectedSection;
  const page = section
    ? (getMatchingPageFromSection({ pageTitle, section }) ?? section.pages[0])
    : undefined;
  noteTaker.selectedPage = page;
  selectContextInSelectedPage({ contextTitle: page?.activeContextTitle, noteTaker });
}

export function selectSection({ noteTaker, sectionTitle }: {
  noteTaker: NoteTaker
  sectionTitle: string | undefined
}): void {
  const section = sectionTitle
    ? getMatchingSection({ existingSections: noteTaker.allSections, sectionTitle })
    : undefined;
  noteTaker.selectedSection = section ?? noteTaker.allSections[0];
  selectPageInSelectedSection({ noteTaker, pageTitle: section?.activePageTitle });
}
