import { beforeEach, describe, expect, it } from 'vitest';

import type { Context, ListItem, Page, Section, StorableNotes } from './NoteTaker.types';

import { getCommonSubjectTests } from '../../utils';
import {
  changeFocusedItemInContext,
  convertToExportableJSON,
  createStorableNotesFromJson,
  findContextInPage,
  findOrCreateItemInContext,
  findOrCreatePageInSection,
  findOrCreateSection,
  focusItemInContext,
  mergeContexts,
  mergePages,
  mergeSections,
  mergeStorableNotes,
  moveItemInContext,
  removeDoneItemsFromContext,
  removeDoneItemsFromPage,
  selectContextInPage,
  selectPageInSection,
  selectSection,
  sortItemsInContextAlphabetically,
  sortItemsInContextByCompletion,
  toggleListItem,
} from './commands';

function getExampleStorableNotes(): StorableNotes {
  const listItems: ListItem[] = [
    { title: 'first item' },
    { title: 'second item' },
  ];
  const contexts: Context[] = [
    { items: listItems, title: 'first context', type: 'todo' },
    { focusedItemTitle: 'second item', items: listItems, title: 'second context', type: 'todo' },
  ];
  const pages: Page[] = [
    { contexts, title: 'first page' },
    { activeContextTitle: 'second context', contexts, title: 'second page' },
  ];
  const sections: Section[] = [
    { pages, title: 'first section' },
    { activePageTitle: 'second page', pages, title: 'second section' },
  ];

  const storableNotes: StorableNotes = { sections, selectedSectionTitle: 'second section' };

  return storableNotes;
}

describe('changeFocusedItemInContext', () => {
  let focusedItemTitle: string | undefined;
  beforeEach(() => focusedItemTitle = undefined);

  let upOrDown: 'down' | 'up';
  beforeEach(() => upOrDown = 'up');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const context: Context = {
      focusedItemTitle,
      items: [
        { title: 'one' },
        { title: 'two' },
        { title: 'three' },
      ],
      title: 'context',
      type: 'todo',
    };
    changeFocusedItemInContext(context, upOrDown);
    return context.focusedItemTitle;
  });

  describe('up', () => {
    beforeEach(() => upOrDown = 'up');

    describe('when no item is currently focused', () => {
      beforeEach(() => focusedItemTitle = undefined);
      it('focuses the last item', () => {
        expectSubjectToEqual('three');
      });
    });

    describe('when the first item is currently focused', () => {
      beforeEach(() => focusedItemTitle = 'one');
      it('focuses the last item', () => {
        expectSubjectToEqual('three');
      });
    });

    describe('when an item other than the first one is currently focused', () => {
      beforeEach(() => focusedItemTitle = 'three');
      it('focuses the previous item', () => {
        expectSubjectToEqual('two');
      });
    });
  });

  describe('down', () => {
    beforeEach(() => upOrDown = 'down');

    describe('when no item is currently focused', () => {
      beforeEach(() => focusedItemTitle = undefined);
      it('focuses the first item', () => {
        expectSubjectToEqual('one');
      });
    });

    describe('when the last item is currently focused', () => {
      beforeEach(() => focusedItemTitle = 'three');
      it('focuses the first item', () => {
        expectSubjectToEqual('one');
      });
    });

    describe('when an item other than the last one is currently focused', () => {
      beforeEach(() => focusedItemTitle = 'two');
      it('focuses the next item', () => {
        expectSubjectToEqual('three');
      });
    });
  });
});

describe('convertToExportableJSON', () => {
  it('returns string representation of given storableNotes', () => {
    expect(convertToExportableJSON(getExampleStorableNotes())).toEqual(expect.any(String));
  });
});

describe('createStorableNotesFromJson', () => {
  const exampleStorableNotes = getExampleStorableNotes();

  it('converts json reprentation of a note taker into an identical note taker', () => {
    const jsonStorableNotes = convertToExportableJSON(exampleStorableNotes);
    const fromJson = createStorableNotesFromJson(jsonStorableNotes);

    expect(fromJson).toStrictEqual(exampleStorableNotes);
  });

  it('returns empty note taker if input is invalid json', () => {
    expect(createStorableNotesFromJson('asdf-zxcv')).toEqual({ sections: [] });
  });

  it('returns empty note taker if input is valid JSON, but not of an exportable note taker', () => {
    expect(createStorableNotesFromJson('{}')).toEqual({ sections: [] });
  });
});

describe('findContextInPage', () => {
  let contextTitle: string;
  beforeEach(() => contextTitle = '');

  let contextTitlesInPage: string[];
  beforeEach(() => contextTitlesInPage = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const page: Page = {
      contexts: contextTitlesInPage.map(title => ({ items: [], title, type: 'todo' })),
      title: 'example page',
    };
    return findContextInPage(contextTitle, page);
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

describe('findOrCreateItemInContext', () => {
  let itemTitle: string;
  beforeEach(() => itemTitle = 'example item');

  let itemTitlesInContext: string[];
  beforeEach(() => itemTitlesInContext = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const context: Context = {
      items: itemTitlesInContext.map(title => ({ title })),
      title: 'example context',
      type: 'todo',
    };

    return findOrCreateItemInContext(itemTitle, context);
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

    it('adds new item to the end of the context items, and returns it', () => {
      const context: Context = { items: [], title: 'context', type: 'todo' };
      const item = findOrCreateItemInContext('new item', context);

      expect(item).toEqual({ title: 'new item' });
      expect(context.items).toEqual([item]);
    });
  });
});

describe('findOrCreatePageInSection', () => {
  let pageTitle: string;
  beforeEach(() => pageTitle = 'example page');

  let pageTitlesInSection: string[];
  beforeEach(() => pageTitlesInSection = []);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const section: Section = {
      pages: pageTitlesInSection.map(title => ({ contexts: [], title })),
      title: 'example section',
    };
    return findOrCreatePageInSection(pageTitle, section);
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

    it('adds new page to section, and returns it', () => {
      const section: Section = { pages: [], title: 'section' };
      const newPage = findOrCreatePageInSection('new page', section);

      expect(newPage).toEqual({ contexts: [], title: 'new page' });
      expect(section.pages).toEqual([newPage]);
    });
  });
});

describe('findOrCreateSection', () => {
  let sections: Section[];
  beforeEach(() => sections = []);

  let sectionTitle: string;
  beforeEach(() => sectionTitle = '');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => findOrCreateSection(sectionTitle, sections));

  it('returns a section object with empty pages if title does not match an existing section', () => {
    sectionTitle = 'asdf';
    expectSubjectToEqual({ pages: [], title: 'asdf' });
  });

  it('returns existing section object if one is found with a matching title (case insensitive)', () => {
    sections = [{ pages: [], title: 'existing' }];
    sectionTitle = 'EXISTING';

    expectSubjectToEqual({ pages: [], title: 'existing' });
  });
});

describe('focusItemInContext', () => {
  let itemTitle: string | undefined;
  beforeEach(() => itemTitle = undefined);

  let context: Context;
  beforeEach(() => {
    context = {
      items: [
        { done: false, title: 'first item' },
        { done: false, title: 'second item' },
      ],
      title: 'example context',
      type: 'todo',
    };
  });

  const { getSubject } = getCommonSubjectTests(() => focusItemInContext(context, itemTitle));

  it('sets focusedItemTitle to the first item title if itemTitle does not exist in any item in context', () => {
    itemTitle = 'non-existent';

    const focusedItem = getSubject();
    expect(focusedItem?.title).toEqual('first item');
    expect(context.focusedItemTitle).toEqual('first item');
  });

  it('returns undefined and sets focusedItemTitle to undefined if context has no items', () => {
    context.items = [];
    const focusedItem = getSubject();
    expect(focusedItem).toBe(undefined);
    expect(context.focusedItemTitle).toBe(undefined);
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

describe('mergeStorableNotess', () => {
  let existingStorableNotes: StorableNotes;
  beforeEach(() => existingStorableNotes = { sections: [] });

  let storableNotesToImport: StorableNotes;
  beforeEach(() => storableNotesToImport = { sections: [] });

  const { expectSubjectToEqual, getSubject } = getCommonSubjectTests(() => mergeStorableNotes(
    existingStorableNotes,
    convertToExportableJSON(storableNotesToImport),
  ));

  it('returns a StorableNotes object containing all sections from both existing and the imported note taker', () => {
    existingStorableNotes = getExampleStorableNotes();
    storableNotesToImport = { sections: [{
      pages: [],
      title: 'imported section',
    }] };

    const result = getSubject();
    expect(result.sections).toContainEqual(expect.objectContaining({ title: 'first section' }));
    expect(result.sections).toContainEqual(expect.objectContaining({ title: 'imported section' }));
  });

  it('uses selected and focused titles from the imported note taker', () => {
    existingStorableNotes = getExampleStorableNotes();
    storableNotesToImport = {
      sections: [{
        pages: [],
        title: 'imported section',
      }],
      selectedSectionTitle: 'imported section',
    };

    expectSubjectToEqual(expect.objectContaining({
      selectedSectionTitle: 'imported section',
    }));
  });

  it('matches existingStorableNotes if existingStorableNotes and the imported note taker are identical', () => {
    existingStorableNotes = getExampleStorableNotes();
    storableNotesToImport = getExampleStorableNotes();

    expectSubjectToEqual(getExampleStorableNotes());
  });

  it('preserves all existing sections, pages, contexts and items in the existing note taker, appending any entities from the imported note taker at the end', () => {
    existingStorableNotes = getExampleStorableNotes();
    storableNotesToImport = { sections: [{
      pages: [],
      title: 'imported section',
    }] };

    expectSubjectToEqual(expect.objectContaining({
      sections: [
        expect.objectContaining({ title: 'first section' }),
        expect.objectContaining({ title: 'second section' }),
        expect.objectContaining({ title: 'imported section' }),
      ],
    }));
  });
});

describe('moveItemInContext', () => {
  const getExampleItems = (): ListItem[] => ([
    { title: 'u1' },
    { title: 'u2' },
    { title: 'u3' },
    { done: true, title: 'd1' },
    { done: true, title: 'd2' },
    { done: true, title: 'd3' },
  ]);

  let itemTitle: string;
  beforeEach(() => itemTitle = '');

  let upOrDown: 'down' | 'up';
  beforeEach(() => upOrDown = 'up');

  // returns sorted item titles
  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const context: Context = {
      items: getExampleItems(),
      title: 'example context',
      type: 'todo',
    };

    moveItemInContext(context, itemTitle, upOrDown);

    return context.items.map(item => item.title);
  });

  describe('up', () => {
    beforeEach(() => upOrDown = 'up');

    describe('when item title does not exist', () => {
      beforeEach(() => itemTitle = 'non-existent');
      it('does not modify sequence of items', () => {
        expectSubjectToEqual(['u1', 'u2', 'u3', 'd1', 'd2', 'd3']);
      });
    });

    describe('when item title is first unfinished item', () => {
      beforeEach(() => itemTitle = 'u1');
      it('moves that item to the last unfinished item', () => {
        expectSubjectToEqual(['u2', 'u3', 'u1', 'd1', 'd2', 'd3']);
      });
    });

    describe('when item title is other (not first) unfinished item', () => {
      beforeEach(() => itemTitle = 'u2');
      it('moves item up by 1', () => {
        expectSubjectToEqual(['u2', 'u1', 'u3', 'd1', 'd2', 'd3']);
      });
    });

    describe('when item title is first done item', () => {
      beforeEach(() => itemTitle = 'd1');
      it('moves item to the end of the list', () => {
        expectSubjectToEqual(['u1', 'u2', 'u3', 'd2', 'd3', 'd1']);
      });
    });

    describe('when item title is other (not first) done item', () => {
      beforeEach(() => itemTitle = 'd3');
      it('moves item up by 1', () => {
        expectSubjectToEqual(['u1', 'u2', 'u3', 'd1', 'd3', 'd2']);
      });
    });
  });

  describe('down', () => {
    beforeEach(() => upOrDown = 'down');

    describe('when item title does not exist', () => {
      beforeEach(() => itemTitle = 'non-existent');
      it('does not modify sequence of items', () => {
        expectSubjectToEqual(['u1', 'u2', 'u3', 'd1', 'd2', 'd3']);
      });
    });

    describe('when item title is last unfinished item', () => {
      beforeEach(() => itemTitle = 'u3');
      it('moves it to the start of the list', () => {
        expectSubjectToEqual(['u3', 'u1', 'u2', 'd1', 'd2', 'd3']);
      });
    });

    describe('when item title is other (not last) unfinished item', () => {
      beforeEach(() => itemTitle = 'u1');
      it('moves it down by 1', () => {
        expectSubjectToEqual(['u2', 'u1', 'u3', 'd1', 'd2', 'd3']);
      });
    });

    describe('when item title is last done item', () => {
      beforeEach(() => itemTitle = 'd3');
      it('moves it to the start of the done items', () => {
        expectSubjectToEqual(['u1', 'u2', 'u3', 'd3', 'd1', 'd2']);
      });
    });

    describe('when item title is other (not last) done item', () => {
      beforeEach(() => itemTitle = 'd2');
      it('moves it down by 1', () => {
        expectSubjectToEqual(['u1', 'u2', 'u3', 'd1', 'd3', 'd2']);
      });
    });
  });
});

describe('removeDoneItemsFromContext', () => {
  it('removes all done items from context in place', () => {
    const context: Context = {
      items: [
        { done: false, title: 'first' },
        { done: true, title: 'second' },
        { title: 'third' },
      ],
      title: 'example context',
      type: 'todo',
    };

    removeDoneItemsFromContext(context);

    expect(context).toEqual(expect.objectContaining({
      items: [
        { done: false, title: 'first' },
        { title: 'third' },
      ],
    }));
  });
});

describe('removeDoneItemsFromPage', () => {
  it('removes all done items from each context in the page, in place', () => {
    const firstContext: Context = {
      items: [
        { done: false, title: '1.1' },
        { done: true, title: '1.2' },
        { title: '1.3' },
      ],
      title: 'first context',
      type: 'todo',
    };
    const secondContext: Context = {
      items: [
        { done: false, title: '2.1' },
        { done: true, title: '2.2' },
        { title: '2.3' },
      ],
      title: 'second context',
      type: 'todo',
    };

    const page: Page = {
      contexts: [firstContext, secondContext],
      title: 'example page',
    };

    removeDoneItemsFromPage(page);

    expect(page).toEqual(expect.objectContaining({
      contexts: [
        expect.objectContaining({
          items: [
            { done: false, title: '1.1' },
            { title: '1.3' },
          ],
        }),
        expect.objectContaining({
          items: [
            { done: false, title: '2.1' },
            { title: '2.3' },
          ],
        }),
      ],
    }));
  });
});

describe('selectContextInPage', () => {
  let contextTitle: string | undefined;
  beforeEach(() => contextTitle = undefined);

  let page: Page;
  beforeEach(() => page = { contexts: [], title: 'example page' });

  const { expectSubjectToEqual } = getCommonSubjectTests(() => selectContextInPage(page, contextTitle));

  describe('when page has no contexts', () => {
    beforeEach(() => page.contexts = []);
    it('returns undefined, and sets activeContextTitle to undefined', () => {
      expectSubjectToEqual(undefined);
      expect(page.activeContextTitle).toBe(undefined);
    });
  });

  describe('when page has contexts', () => {
    beforeEach(() => page.contexts = [
      { items: [], title: 'first context', type: 'todo' },
      { items: [], title: 'second context', type: 'todo' },
    ]);

    describe('when contextTitle is undefined', () => {
      beforeEach(() => contextTitle = undefined);
      it('returns the first context, and sets activeContextTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first context' }));
        expect(page.activeContextTitle).toBe('first context');
      });
    });

    describe('when contextTitle is a string which does not match', () => {
      beforeEach(() => contextTitle = 'context not found');
      it('returns the first context, and sets activeContextTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first context' }));
        expect(page.activeContextTitle).toBe('first context');
      });
    });

    describe('when contextTitle is a string which matches an existing context', () => {
      beforeEach(() => contextTitle = 'second context');
      it('returns the matching context, and sets activeContextTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'second context' }));
        expect(page.activeContextTitle).toBe('second context');
      });
    });
  });
});

describe('selectPageInSection', () => {
  let pageTitle: string | undefined;
  beforeEach(() => pageTitle = undefined);

  let section: Section;
  beforeEach(() => section = { pages: [], title: 'example section' });

  const { expectSubjectToEqual } = getCommonSubjectTests(() => selectPageInSection(section, pageTitle));

  describe('when section has no pages', () => {
    beforeEach(() => section.pages = []);
    it('returns undefined, and sets activePageTitle to undefined', () => {
      expectSubjectToEqual(undefined);
      expect(section.activePageTitle).toBe(undefined);
    });
  });

  describe('when section has pages', () => {
    beforeEach(() => section.pages = [
      { contexts: [], title: 'first page' },
      { contexts: [], title: 'second page' },
    ]);

    describe('when pageTitle is undefined', () => {
      beforeEach(() => pageTitle = undefined);
      it('returns the first page, and sets activePageTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first page' }));
        expect(section.activePageTitle).toBe('first page');
      });
    });

    describe('when pageTitle is a string which does not match', () => {
      beforeEach(() => pageTitle = 'page not found');
      it('returns the first page, and sets activePageTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first page' }));
        expect(section.activePageTitle).toBe('first page');
      });
    });

    describe('when pageTitle is a string which matches an existing page', () => {
      beforeEach(() => pageTitle = 'second page');
      it('returns the matching page, and sets activePageTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'second page' }));
        expect(section.activePageTitle).toBe('second page');
      });
    });
  });
});

describe('selectSection', () => {
  let sectionTitle: string | undefined;
  beforeEach(() => sectionTitle = undefined);

  let storableNotes: StorableNotes;
  beforeEach(() => storableNotes = { sections: [] });

  const { expectSubjectToEqual } = getCommonSubjectTests(() => selectSection(storableNotes, sectionTitle));

  describe('when storableNotes has no sections', () => {
    beforeEach(() => storableNotes.sections = []);
    it('returns undefined, and sets selectedSectionTitle to undefined', () => {
      expectSubjectToEqual(undefined);
      expect(storableNotes.selectedSectionTitle).toBe(undefined);
    });
  });

  describe('when storableNotes has sections', () => {
    beforeEach(() => storableNotes.sections = [
      { pages: [], title: 'first section' },
      { pages: [], title: 'second section' },
    ]);

    describe('when sectionTitle is undefined', () => {
      beforeEach(() => sectionTitle = undefined);
      it('returns the first section, and sets selectedSectionTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first section' }));
        expect(storableNotes.selectedSectionTitle).toBe('first section');
      });
    });

    describe('when sectionTitle is a string which does not match', () => {
      beforeEach(() => sectionTitle = 'section not found');
      it('returns the first section, and sets selectedSectionTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'first section' }));
        expect(storableNotes.selectedSectionTitle).toBe('first section');
      });
    });

    describe('when sectionTitle is a string which matches an existing section', () => {
      beforeEach(() => sectionTitle = 'second section');
      it('returns the matching section, and sets selectedSectionTitle to its title', () => {
        expectSubjectToEqual(expect.objectContaining({ title: 'second section' }));
        expect(storableNotes.selectedSectionTitle).toBe('second section');
      });
    });
  });
});

describe('sortItemsInContextAlphabetically', () => {
  it('alphabetically sorts items inside context', () => {
    const context: Context = {
      items: [
        { title: 'one' },
        { title: 'two' },
        { done: true, title: 'three' },
      ],
      title: 'example context',
      type: 'todo',
    };

    sortItemsInContextAlphabetically(context);

    expect(context.items).toEqual([
      { title: 'one' },
      { done: true, title: 'three' },
      { title: 'two' },
    ]);
  });
});

describe('sortItemsInContextByCompletion', () => {
  it('sorts items inside context to put all unfinished items first', () => {
    const context: Context = {
      items: [
        { done: false, title: 'one' },
        { done: true, title: 'two' },
        { title: 'three' },
        { done: true, title: 'four' },
      ],
      title: 'example context',
      type: 'todo',
    };

    sortItemsInContextByCompletion(context);

    expect(context.items).toEqual([
      { done: false, title: 'one' },
      { title: 'three' },
      { done: true, title: 'two' },
      { done: true, title: 'four' },
    ]);
  });
});

describe('toggleListItem', () => {
  let context: Context;
  beforeEach(() => context = { items: [], title: 'example context', type: 'todo' });

  let itemTitle: string;
  beforeEach(() => itemTitle = '');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => toggleListItem(context, itemTitle));

  it('returns undefined if item is not found', () => {
    itemTitle = 'asdf';
    context.items = [{ title: 'first item' }];
    expectSubjectToEqual(undefined);
  });

  it('returns the item with its state toggled if found, and updates it in place', () => {
    context.items = [{ title: 'first item' }];
    itemTitle = 'first item';

    expectSubjectToEqual({ done: true, title: 'first item' });
    expect(context.items[0].done).toBe(true);

    expectSubjectToEqual({ done: false, title: 'first item' });
    expect(context.items[0].done).toBe(false);
  });

  it('sorts items by completion after toggling list item', () => {
    context.items = [
      { title: 'first item' },
      { title: 'second item' },
    ];
    itemTitle = 'first item';

    expectSubjectToEqual({ done: true, title: 'first item' });

    expect(context.items).toEqual([
      { title: 'second item' },
      { done: true, title: 'first item' },
    ]);
  });
});
