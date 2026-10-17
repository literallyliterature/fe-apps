import { checkIfStringsMatch, getNextOrPrevIndex } from 'utils';

import type { Page } from '../data';

export function changeSelectedContextInPage(page: Page, upOrDown: 'down' | 'up'): void {
  const { activeContextTitle, contexts } = page;
  const indexOfActiveContext = activeContextTitle
    ? contexts.findIndex(c => checkIfStringsMatch(c.title, activeContextTitle))
    : -1;

  const newActiveContextIndex = getNextOrPrevIndex({
    currentIndex: indexOfActiveContext,
    length: contexts.length,
    nextOrPrev: upOrDown === 'up' ? 'prev' : 'next',
  });

  page.activeContextTitle = contexts[newActiveContextIndex]?.title;
}
