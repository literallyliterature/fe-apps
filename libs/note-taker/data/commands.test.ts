import { beforeEach, describe, expect, it } from 'vitest';

import type { Context, Page, Section, Todo } from './NoteTaker.types';

import { getCommonSubjectTests } from '../../utils';
import { createSection, focusItemInSelectedContext, getMatchingContextFromPage, getMatchingItemFromContext, getMatchingPageFromSection, getMatchingSection, selectContextInSelectedPage, selectPageInSelectedSection, selectSection } from './commands';
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

describe('getMatchingPageFromSection', () => {
  let pageTitle: string;
  beforeEach(() => pageTitle = 'example page');

  let pageTitlesInSection: string[];
  beforeEach(() => pageTitlesInSection = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const section: Section = {
      pages: pageTitlesInSection.map(title => ({ contexts: [], title })),
      title: 'example section',
    };
    return getMatchingPageFromSection({ pageTitle, section });
  });

  describe('when given pageTitle matches a page in given section', () => {
    beforeEach(() => {
      pageTitle = 'example page';
      pageTitlesInSection = ['example page', 'other page'];
    });

    it('returns matching page', () => {
      expectSubjectToEqual(expect.objectContaining({ title: 'example page' }));

      // case-insensitive and trimmed
      pageTitle = '   EXAMPLE PagE ';
      expectSubjectToEqual(expect.objectContaining({ title: 'example page' }));
    });
  });

  describe('when given pageTitle does not match any pages in given section', () => {
    beforeEach(() => {
      pageTitle = 'asdf';
      pageTitlesInSection = ['example page'];
    });

    it('returns undefined', () => {
      expectSubjectToEqual(undefined);

      pageTitle = 'example page with other stuff';
      expectSubjectToEqual(undefined);

      pageTitle = 'extra stuff then example page';
      expectSubjectToEqual(undefined);

      pageTitlesInSection = [];
      expectSubjectToEqual(undefined);
    });
  });
});

describe('getMatchingSection', () => {
  let sectionTitle: string;
  beforeEach(() => sectionTitle = 'example section');

  let existingSectionTitles: string[];
  beforeEach(() => existingSectionTitles = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const existingSections: Section[] = existingSectionTitles.map(title => ({
      pages: [],
      title,
    }));

    return getMatchingSection({
      existingSections,
      sectionTitle,
    });
  });

  describe('when sectionTitle matches an existing section', () => {
    beforeEach(() => {
      sectionTitle = 'example section';
      existingSectionTitles = ['example section', 'other section'];
    });

    it('returns found section', () => {
      expectSubjectToEqual(expect.objectContaining({ title: 'example section' }));

      // case-insensitive and trimmed
      sectionTitle = '   EXAMPLE SectION  ';
      expectSubjectToEqual(expect.objectContaining({ title: 'example section' }));
    });
  });

  describe('when sectionTitle does not match an existing section', () => {
    beforeEach(() => {
      sectionTitle = 'non-existent section';
      existingSectionTitles = ['example section'];
    });

    it('returns undefined', () => {
      expectSubjectToEqual(undefined);
    });
  });
});

describe('selectContextInSelectedPage', () => {
  let contextTitle: string;
  beforeEach(() => contextTitle = 'context title to select');

  let existingSelectedContext: Context | undefined;
  beforeEach(() => existingSelectedContext = undefined);

  let existingSelectedPage: Page | undefined;
  beforeEach(() => existingSelectedPage = undefined);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const noteTaker = new NoteTaker([]);
    noteTaker.selectedPage = existingSelectedPage;
    noteTaker.selectedContext = existingSelectedContext;

    selectContextInSelectedPage({ contextTitle, noteTaker });
    return noteTaker.selectedContext;
  });

  describe('when there is no existing selectedPage', () => {
    beforeEach(() => existingSelectedPage = undefined);

    it('sets selectedContext to undefined, if one currently exists', () => {
      existingSelectedContext = undefined;
      expectSubjectToEqual(undefined);

      existingSelectedContext = { items: [], title: 'example context', type: 'todo' };
      expectSubjectToEqual(undefined);
    });
  });

  describe('when there is a selected page', () => {
    beforeEach(() => {
      existingSelectedPage = {
        contexts: [
          { items: [], title: 'first context', type: 'todo' },
          { items: [], title: 'second context', type: 'todo' },
          { items: [], title: 'third context', type: 'todo' },
        ],
        title: 'selected page',
      };
    });

    describe('when given contextTitle matches a context in the selectedPage', () => {
      beforeEach(() => contextTitle = 'second context');

      it('sets matching context as the selectedContext', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'second context' }));
      });
    });

    describe('when given contextTitle does not match any contexts in the selectedPage', () => {
      beforeEach(() => contextTitle = 'non-existent context title');

      it('sets the first context in the page as the selectedContext', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first context' }));

        existingSelectedContext = { items: [], title: 'other existing selected context', type: 'todo' };
        existingSelectedPage = { contexts: [], title: 'page title' };
        expectSubjectToEqual(undefined);
      });
    });
  });
});

describe('selectPageInSelectedSection', () => {
  let pageTitle: string;
  beforeEach(() => pageTitle = 'page title to select');

  let existingSelectedPage: Page | undefined;
  beforeEach(() => existingSelectedPage = undefined);

  let existingSelectedSection: Section | undefined;
  beforeEach(() => existingSelectedSection = undefined);

  let noteTaker: NoteTaker;

  const { expectSubjectToEqual, getSubject } = getCommonSubjectTests(() => {
    noteTaker = new NoteTaker([]);
    noteTaker.selectedSection = existingSelectedSection;
    noteTaker.selectedPage = existingSelectedPage;

    selectPageInSelectedSection({ noteTaker, pageTitle });
    return noteTaker.selectedPage;
  });

  describe('when there is no existing selectedSection', () => {
    beforeEach(() => existingSelectedSection = undefined);

    it('sets selectedPage to undefined, if one currently exists', () => {
      existingSelectedPage = undefined;
      expectSubjectToEqual(undefined);

      existingSelectedPage = { contexts: [], title: 'example page' };
      expectSubjectToEqual(undefined);
    });
  });

  describe('when there is a selected section', () => {
    beforeEach(() => {
      existingSelectedSection = {
        pages: [
          { contexts: [], title: 'first page' },
          { contexts: [], title: 'second page' },
          { contexts: [], title: 'third page' },
        ],
        title: 'selected page',
      };
    });

    describe('when given pageTitle matches a page in the selectedSection', () => {
      beforeEach(() => pageTitle = 'second page');

      it('sets matching page as the selectedPage', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'second page' }));
      });

      describe('selectedContext behaviour', () => {
        const firstContext: Context = { items: [], title: 'first context', type: 'todo' };
        const secondContext: Context = { items: [], title: 'second context', type: 'todo' };
        let examplePage: Page;

        beforeEach(() => {
          examplePage = { contexts: [firstContext, secondContext], title: 'example page' };
          existingSelectedSection = {
            pages: [examplePage],
            title: 'example section',
          };
          pageTitle = 'example page';
        });

        const { expectSubjectToEqual: expectSelectedContextToEqual } = getCommonSubjectTests(() => {
          getSubject();
          return noteTaker.selectedContext;
        });

        describe('when the matching page does not have any contexts', () => {
          beforeEach(() => examplePage.contexts = []);
          it('sets selectedContext to undefined', () => {
            expectSelectedContextToEqual(undefined);
          });
        });

        describe('when the matching page does not have any matching activeContextTitle, but has contexts', () => {
          beforeEach(() => examplePage.activeContextTitle = 'non-existent context title');
          it('sets selectedContext to the first context in the page', () => {
            expectSelectedContextToEqual(expect.objectContaining({ title: 'first context' }));
          });
        });

        describe('when the matching page has a matching activeContextTitle', () => {
          beforeEach(() => examplePage.activeContextTitle = 'second context');
          it('sets selectedContext to the matching context');
        });
      });
    });

    describe('when given pageTitle does not match any pages in the selectedSection', () => {
      beforeEach(() => pageTitle = 'non-existent page title');

      it('sets the first found page as the selectedPage', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first page' }));

        existingSelectedSection = { pages: [], title: 'existing selected section' };
        existingSelectedPage = { contexts: [], title: 'existing selected page' };
        expectSubjectToEqual(undefined);
      });
    });
  });
});

describe('selectSection', () => {
  it('cascades selected values and focusedItem to undefined, if one is not found', () => {
    const noteTaker = new NoteTaker([]);
    noteTaker.selectedSection = { pages: [], title: 'section title' };
    noteTaker.selectedPage = { contexts: [], title: 'page title' };
    noteTaker.selectedContext = { items: [], title: 'context title', type: 'todo' };
    noteTaker.focusedItem = { done: false, title: 'item title' };

    selectSection({ noteTaker, sectionTitle: 'non-existent section' });

    expect(noteTaker.selectedSection).toBeUndefined();
    expect(noteTaker.selectedPage).toBeUndefined();
    expect(noteTaker.selectedContext).toBeUndefined();
    expect(noteTaker.focusedItem).toBeUndefined();
  });

  it('sets selectedSection, selectedPage, selectedContext and focusedItem, if they are found, else undefined', () => {
    const todoItems: Todo[] = [
      { done: false, title: 'first item' },
      { done: false, title: 'second item' },
    ];
    const contexts: Context[] = [
      { items: todoItems, title: 'first context', type: 'todo' },
      { focusedItemTitle: 'second item', items: todoItems, title: 'second context', type: 'todo' },
    ];
    const pages: Page[] = [
      { contexts, title: 'first page' },
      { activeContextTitle: 'second context', contexts, title: 'second page' },
    ];
    const sections: Section[] = [
      { pages, title: 'first section' },
      { activePageTitle: 'second page', pages, title: 'second section' },
    ];

    const noteTaker = new NoteTaker(sections);

    // selects first of everything
    selectSection({ noteTaker, sectionTitle: 'non-existent section' });

    expect(noteTaker).toEqual(expect.objectContaining({
      focusedItem: expect.objectContaining({ title: 'first item' }),
      selectedContext: expect.objectContaining({ title: 'first context' }),
      selectedPage: expect.objectContaining({ title: 'first page' }),
      selectedSection: expect.objectContaining({ title: 'first section' }),
    }));

    // selects second of everything (because of the "active" tiitles)
    selectSection({ noteTaker, sectionTitle: 'second section' });

    expect(noteTaker).toEqual(expect.objectContaining({
      focusedItem: expect.objectContaining({ title: 'second item' }),
      selectedContext: expect.objectContaining({ title: 'second context' }),
      selectedPage: expect.objectContaining({ title: 'second page' }),
      selectedSection: expect.objectContaining({ title: 'second section' }),
    }));
  });
});
