import { beforeEach, describe, expect, it } from 'vitest';

import type { Context, Page, Section } from './NoteTaker.types';

import { getCommonSubjectTests } from '../../utils';
import { createSection, focusItemInSelectedContext, getMatchingContextFromPage, getMatchingItemFromContext } from './commands';
import { NoteTaker } from './NoteTaker';

describe('createSection', () => {
  let existingSections: Section[];
  beforeEach(() => existingSections = []);

  let sectionTitle: string;
  beforeEach(() => sectionTitle = '');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => createSection({
    existingSections,
    sectionTitle,
  }));

  it('returns a section object with empty pages', () => {
    sectionTitle = 'asdf';
    expectSubjectToEqual({ pages: [], title: 'asdf' });
  });

  it('returns existing section object if one is found with a matching title (case insensitive)', () => {
    existingSections = [{ pages: [], title: 'existing' }];
    sectionTitle = 'EXISTING';

    expectSubjectToEqual({ pages: [], title: 'existing' });
  });
});

describe('focusItemInSelectedContext', () => {
  let itemTitle: string | undefined;
  beforeEach(() => itemTitle = 'item to select');

  let noteTaker: NoteTaker;
  beforeEach(() => noteTaker = new NoteTaker([]));

  const { getSubject } = getCommonSubjectTests(() => focusItemInSelectedContext({
    itemTitle,
    noteTaker,
  }));

  it('sets focusedItem in noteTaker, if itemTitle matches an item in selectedContext', () => {
    noteTaker.selectedContext = {
      items: [
        { done: false, title: 'item to select' },
        { done: false, title: 'other item' },
      ],
      title: 'selected context',
      type: 'todo',
    };
    expect(noteTaker.focusedItem).toBeUndefined();
    getSubject();
    expect(noteTaker.focusedItem).toEqual({ done: false, title: 'item to select' });
  });

  describe('when a focused item already exists', () => {
    beforeEach(() => {
      noteTaker.selectedContext = {
        items: [
          { done: false, title: 'item to select' },
          { done: false, title: 'other item' },
        ],
        title: 'selected context',
        type: 'todo',
      };
      expect(noteTaker.focusedItem).toBeUndefined();
      getSubject();
      expect(noteTaker.focusedItem).toEqual({ done: false, title: 'item to select' });
    });

    it('sets focusedItem to undefined if a selectedContext does not exist', () => {
      expect(noteTaker.focusedItem).not.toBeUndefined();
      noteTaker.selectedContext = undefined;
      getSubject();
      expect(noteTaker.focusedItem).toBeUndefined();
    });

    it('sets focusedItem to undefined if itemTitle does not exist in any item in context', () => {
      expect(noteTaker.focusedItem).not.toBeUndefined();
      itemTitle = 'non-existent';
      getSubject();
      expect(noteTaker.focusedItem).toBeUndefined();
    });

    it('does nothing if selectedContext is not of type todo', () => {
      expect(noteTaker.focusedItem).not.toBeUndefined();
      itemTitle = 'non-existent';
      getSubject();
      expect(noteTaker.focusedItem).toBeUndefined();
    });
  });
});

describe('getMatchingContextFromPage', () => {
  let contextTitle: string | undefined;
  beforeEach(() => contextTitle = undefined);

  let contextTitlesInPage: string[];
  beforeEach(() => contextTitlesInPage = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const page: Page = {
      contexts: contextTitlesInPage.map(title => ({ items: [], title, type: 'todo' })),
      title: 'example page',
    };
    return getMatchingContextFromPage({ contextTitle, page });
  });

  describe('when given contextTitle matches a context in the given page', () => {
    beforeEach(() => {
      contextTitle = 'example context';
      contextTitlesInPage = [
        'example context',
        'other context',
      ];
    });
    it('returns matching context', () => {
      expectSubjectToEqual(expect.objectContaining({ title: 'example context' }));

      // case-insensitive and trimmed
      contextTitle = '   EXAMPLE ConteXT  ';
      expectSubjectToEqual(expect.objectContaining({ title: 'example context' }));
    });
  });

  describe('when given contextTitle does not match a context in the given page', () => {
    beforeEach(() => {
      contextTitle = 'non-existent context';
      contextTitlesInPage = [
        'example context',
        'other context',
      ];
    });
    it('returns undefined', () => {
      expectSubjectToEqual(undefined);

      contextTitlesInPage = [];
      expectSubjectToEqual(undefined);
    });
  });
});

describe('getMatchingItemFromContext', () => {
  let itemTitle: string;
  beforeEach(() => itemTitle = 'example item');

  let itemTitlesInContext: string[];
  beforeEach(() => itemTitlesInContext = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const context: Context = {
      items: itemTitlesInContext.map(title => ({ done: false, title })),
      title: 'example context',
      type: 'todo',
    };

    return getMatchingItemFromContext({
      context,
      itemTitle,
    });
  });

  describe('when given itemTitle matches an item in context', () => {
    beforeEach(() => {
      itemTitle = 'example item';
      itemTitlesInContext = ['example item', 'other item'];
    });

    it('returns matching item', () => {
      expectSubjectToEqual(expect.objectContaining({ title: 'example item' }));

      // case-insensitive and trimmed
      itemTitle = '   EXAMPLE IteM  ';
      expectSubjectToEqual(expect.objectContaining({ title: 'example item' }));
    });
  });

  describe('when given itemTitle does not match any item in the context', () => {
    beforeEach(() => {
      itemTitle = 'non-existent item';
      itemTitlesInContext = ['example item'];
    });

    it('returns undefined', () => {
      expectSubjectToEqual(undefined);

      itemTitlesInContext = [];
      expectSubjectToEqual(undefined);
    });
  });
});
