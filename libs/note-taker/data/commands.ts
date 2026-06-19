import type { NoteTaker } from './NoteTaker';
import type { Context, Page, Section } from './NoteTaker.types';

import { checkIfStringsMatch } from '../../utils';

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
  if (!context || context?.type !== 'todo') return;
  const item = getMatchingItemFromContext({ context, itemTitle });
  noteTaker.focusedItem = item;
}

export function getMatchingContextFromPage({ contextTitle, page }: {
  contextTitle: string | undefined
  page: Page
}): Context | undefined {
  if (!contextTitle) return page.contexts[0];
  else return page.contexts.find(p => checkIfStringsMatch(p.title, contextTitle));
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
  else return section.pages.find(p => checkIfStringsMatch(p.title, pageTitle));
}

export function getMatchingSection({ existingSections, sectionTitle }: {
  existingSections: Section[]
  sectionTitle: string
}): Section | undefined {
  return existingSections.find(s => checkIfStringsMatch(s.title, sectionTitle));
}

export function selectContextInSelectedPage({ contextTitle, noteTaker }: {
  contextTitle: string | undefined
  noteTaker: NoteTaker
}): void {
  const page = noteTaker.selectedPage;
  if (!page) return;
  const context = getMatchingContextFromPage({ contextTitle, page });
  noteTaker.selectedContext = context;
  if (context) focusItemInSelectedContext({ itemTitle: context.focusedItemTitle, noteTaker });
}

export function selectPageInSelectedSection({ noteTaker, pageTitle }: {
  noteTaker: NoteTaker
  pageTitle: string | undefined
}): void {
  const section = noteTaker.selectedSection;
  if (!section) return;
  const page = getMatchingPageFromSection({ pageTitle, section });
  noteTaker.selectedPage = page;
  if (page) selectContextInSelectedPage({ contextTitle: page.activeContextTitle, noteTaker });
}

export function selectSection({ noteTaker, sectionTitle }: {
  noteTaker: NoteTaker
  sectionTitle: string
}): void {
  const section = getMatchingSection({ existingSections: noteTaker.allSections, sectionTitle });
  noteTaker.selectedSection = section;
  if (section) selectPageInSelectedSection({ noteTaker, pageTitle: section.activePageTitle });
}
