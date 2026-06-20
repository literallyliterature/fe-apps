import { beforeEach, describe, expect, it } from 'vitest';

import type { Context, Page, Section, Todo } from './NoteTaker.types';

import { getCommonSubjectTests } from '../../utils';
import { convertToExportable, convertToExportableJSON, createNoteTakerFromJSON, createSection, focusItemInSelectedContext, getMatchingContextFromPage, getMatchingItemFromContext, getMatchingPageFromSection, getMatchingSection, mergeContexts, mergeNoteTakers, mergePages, mergeSections, selectContextInSelectedPage, selectPageInSelectedSection, selectSection } from './commands';
import { NoteTaker } from './NoteTaker';

function getExampleNoteTaker(): NoteTaker {
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

  selectSection({ noteTaker, sectionTitle: 'second section' });

  return noteTaker;
}

describe('convertToExportable', () => {
  it('returns exportable object representation of given noteTaker', () => {
    expect(convertToExportable(getExampleNoteTaker())).toEqual(expect.any(Object));
  });
});

describe('convertToExportableJSON', () => {
  it('returns string representation of given noteTaker', () => {
    expect(convertToExportableJSON(getExampleNoteTaker())).toEqual(expect.any(String));
  });
});

describe('createNoteTakerFromJSON', () => {
  const exampleNoteTaker = getExampleNoteTaker();

  it('converts json reprentation of a note taker into an identical note taker', () => {
    const jsonNoteTaker = convertToExportableJSON(exampleNoteTaker);
    const fromJson = createNoteTakerFromJSON(jsonNoteTaker);

    expect(fromJson).toStrictEqual(exampleNoteTaker);

    expect(fromJson.focusedItem).toEqual(expect.objectContaining({ title: 'second item' }));
  });

  it('returns empty note taker if input is invalid json', () => {
    expect(createNoteTakerFromJSON('asdf-zxcv')).toEqual(new NoteTaker());
  });

  it('returns empty note taker if input is valid JSON, but not of an exportable note taker', () => {
    expect(createNoteTakerFromJSON('{}')).toEqual(new NoteTaker());
  });
});

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

describe('mergeContexts', () => {
  let firstContext: Context;
  beforeEach(() => firstContext = {
    items: [],
    title: 'First context',
    type: 'todo',
  });

  let secondContext: Context;
  beforeEach(() => secondContext = {
    items: [],
    title: 'Second context',
    type: 'todo',
  });

  const { expectSubjectToEqual } = getCommonSubjectTests(() => mergeContexts(firstContext, secondContext));

  describe('if the types do not match', () => {
    it('returns second context', () => {
      secondContext = {
        items: [{ title: 'Item one' }],
        title: 'Second context',
        type: 'ordered-list',
      };

      expectSubjectToEqual(secondContext);
    });
  });

  describe('if the types match', () => {
    it('returns the title and focusedItemTitle from the second context', () => {
      secondContext.focusedItemTitle = 'Item one';

      expectSubjectToEqual({
        focusedItemTitle: 'Item one',
        items: [],
        title: 'Second context',
        type: 'todo',
      });
    });

    describe('if the first and second context only have items with unique titles', () => {
      it('returns context with all items from first, then all items from second', () => {
        firstContext.items = [{ done: false, title: '1.1' }, { done: false, title: '1.2' }];
        secondContext.items = [{ done: false, title: '2.1' }, { done: false, title: '2.2' }];

        expectSubjectToEqual(expect.objectContaining({
          items: [
            { done: false, title: '1.1' },
            { done: false, title: '1.2' },
            { done: false, title: '2.1' },
            { done: false, title: '2.2' },
          ],
        }));
      });

      it('if item titles match (after normalisation), filters out the matching item from the first context', () => {
        firstContext.items = [{ done: false, title: '    item 1' }, { done: false, title: '1.2' }];
        secondContext.items = [{ done: true, title: 'item 1' }, { done: false, title: '2.2' }];

        expectSubjectToEqual(expect.objectContaining({
          items: [
            { done: true, title: 'item 1' },
            { done: false, title: '1.2' },
            { done: false, title: '2.2' },
          ],
        }));
      });
    });
  });
});

describe('mergeNoteTakers', () => {
  let existingNoteTaker: NoteTaker;
  beforeEach(() => existingNoteTaker = new NoteTaker());

  let noteTakerToImport: NoteTaker;
  beforeEach(() => noteTakerToImport = new NoteTaker());

  const { expectSubjectToEqual, getSubject } = getCommonSubjectTests(() => mergeNoteTakers(
    existingNoteTaker,
    convertToExportableJSON(noteTakerToImport),
  ));

  it('returns a new NoteTaker containing all sections from both existing and the imported note taker', () => {
    existingNoteTaker = getExampleNoteTaker();
    noteTakerToImport = new NoteTaker([{
      pages: [],
      title: 'imported section',
    }]);

    const result = getSubject();
    expect(result).toEqual(expect.any(NoteTaker));
    expect(result.allSections).toContainEqual(expect.objectContaining({ title: 'first section' }));
    expect(result.allSections).toContainEqual(expect.objectContaining({ title: 'imported section' }));
  });

  it('uses selected and focused titles from the imported note taker', () => {
    existingNoteTaker = getExampleNoteTaker();
    noteTakerToImport = new NoteTaker([{
      pages: [],
      title: 'imported section',
    }]);

    expectSubjectToEqual(expect.objectContaining({
      selectedSection: expect.objectContaining({ title: 'imported section' }),
    }));
  });

  it('matches existingNoteTaker if existingNoteTaker and the imported note taker are identical', () => {
    existingNoteTaker = getExampleNoteTaker();
    noteTakerToImport = getExampleNoteTaker();

    expectSubjectToEqual(getExampleNoteTaker());
  });

  it('preserves all existing sections, pages, contexts and items in the existing note taker, appending any entities from the imported note taker at the end', () => {
    existingNoteTaker = getExampleNoteTaker();
    noteTakerToImport = new NoteTaker([{
      pages: [],
      title: 'imported section',
    }]);

    expectSubjectToEqual(expect.objectContaining({
      allSections: [
        expect.objectContaining({ title: 'first section' }),
        expect.objectContaining({ title: 'second section' }),
        expect.objectContaining({ title: 'imported section' }),
      ],
    }));
  });
});

describe('mergePages', () => {
  it('returns combined page with attributes (except contexts) from second', () => {
    const first: Page = { activeContextTitle: 'first item', contexts: [], title: 'first page' };
    const second: Page = { activeContextTitle: 'second item', contexts: [], title: 'second page' };

    expect(mergePages(first, second)).toEqual(second);
  });

  it('returns contexts from first, then second, if no titles match', () => {
    const first: Page = { contexts: [
      { items: [], title: 'c1.1', type: 'todo' },
      { items: [], title: 'c1.2', type: 'todo' },
    ], title: 'first page' };
    const second: Page = { contexts: [
      { items: [], title: 'c2.1', type: 'todo' },
      { items: [], title: 'c2.2', type: 'todo' },
    ], title: 'second page' };

    expect(mergePages(first, second)).toEqual(expect.objectContaining({
      contexts: [
        { items: [], title: 'c1.1', type: 'todo' },
        { items: [], title: 'c1.2', type: 'todo' },
        { items: [], title: 'c2.1', type: 'todo' },
        { items: [], title: 'c2.2', type: 'todo' },
      ],
    }));
  });

  it('merges contexts with common name, and does not repeat them', () => {
    const first: Page = {
      contexts: [
        { items: [{ done: false, title: 'i1.1' }], title: 'common', type: 'todo' },
        { items: [], title: 'c1.2', type: 'todo' },
      ],
      title: 'first page',
    };
    const second: Page = {
      contexts: [
        { items: [{ done: false, title: 'i2.1' }], title: 'common', type: 'todo' },
        { items: [], title: 'c2.2', type: 'todo' },
      ],
      title: 'second page',
    };

    expect(mergePages(first, second)).toEqual(expect.objectContaining({
      contexts: [
        { items: [{ done: false, title: 'i1.1' }, { done: false, title: 'i2.1' }], title: 'common', type: 'todo' },
        { items: [], title: 'c1.2', type: 'todo' },
        { items: [], title: 'c2.2', type: 'todo' },
      ],
    }));
  });
});

describe('mergeSections', () => {
  it('returns combined page with attributes (except pages) from second', () => {
    const first: Section = { activePageTitle: 'first page', pages: [], title: 'first section' };
    const second: Section = { activePageTitle: 'second page', pages: [], title: 'second section' };

    expect(mergeSections(first, second)).toEqual(second);
  });

  it('returns pages from first, then second, if no titles match', () => {
    const first: Section = {
      pages: [
        { contexts: [], title: 'p1.1' },
        { contexts: [], title: 'p1.2' },
      ],
      title: 'first section',
    };
    const second: Section = {
      pages: [
        { contexts: [], title: 'p2.1' },
        { contexts: [], title: 'p2.2' },
      ],
      title: 'second section',
    };

    expect(mergeSections(first, second)).toEqual(expect.objectContaining({
      pages: [
        { contexts: [], title: 'p1.1' },
        { contexts: [], title: 'p1.2' },
        { contexts: [], title: 'p2.1' },
        { contexts: [], title: 'p2.2' },
      ],
    }));
  });

  it('merges pages with common name, and does not repeat them', () => {
    const first: Section = {
      pages: [
        { contexts: [{ items: [], title: 'c1', type: 'todo' }], title: 'common' },
        { contexts: [], title: 'p1.2' },
      ],
      title: 'first section',
    };
    const second: Section = {
      pages: [
        { contexts: [{ items: [], title: 'c2', type: 'ordered-list' }], title: 'common' },
        { contexts: [], title: 'p2.2' },
      ],
      title: 'second section',
    };

    expect(mergeSections(first, second)).toEqual(expect.objectContaining({
      pages: [
        {
          contexts: [
            { items: [], title: 'c1', type: 'todo' },
            { items: [], title: 'c2', type: 'ordered-list' },
          ],
          title: 'common',
        },
        { contexts: [], title: 'p1.2' },
        { contexts: [], title: 'p2.2' },
      ],
    }));
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
