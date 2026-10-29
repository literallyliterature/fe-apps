import type { User } from 'firebase/auth';

import { isEqual } from 'lodash';
import { defineStore } from 'pinia';
import {
  assertIsUnreachable,
  checkIfStringsMatch,
  constArrayIncludes,
  constObjectKeys,
  EventBus,
  firebaseAuth,
  getNotesForUser,
} from 'utils';
import { computed, ref } from 'vue';

import type {
  Context,
  ListItem,
  Page,
  Section,
  StorableNotes,
} from './note-taker-schema-and-types';
import type { SearchItem } from './search-results';

import { changeFocusedItemInContext } from '../commands';
import { makeItemProminent } from '../commands/make-item-prominent';
import { removeProminentItem } from '../commands/remove-prominent-item';
import {
  convertToExportableJSON,
  createStorableNotesFromJson,
  deleteContextFromPage,
  deleteItemFromContext,
  deletePageFromSection,
  deleteSectionFromStorableNotes,
  editTitle,
  findContextInPage,
  findOrCreateItemInContext,
  findOrCreatePageInSection,
  findOrCreateSection,
  focusItemInContext,
  getFuzzyMatches,
  makeItemNotRegular,
  makeItemNotSnoozed,
  mergeStorableNotes,
  removeDoneItemsFromContext,
  removeDoneItemsFromPage,
  renderDatetimeNicely,
  selectContextInPage,
  selectPageInSection,
  selectSectionInStorableNotes,
  sortItemsInContextAlphabetically,
  toggleListItem,
  toggleWideContext,
} from './commands';
import {
  getMinutesWith2Digits,
  parseDatetimeFromText,
} from './parse-datetime-from-text';
import {
  contextSpecificCodeTitles,
  extractCodeAndRestFromInputText,
  generalCodeTitles,
  itemSpecificCodeTitles,
  pageSpecificCodeTitles,
  sectionSpecificCodeTitles,
} from './search-results';

const LOCAL_STORAGE_KEY = 'notes_json';

export const useNoteTakerStore = defineStore('note-taker', () => {
  const storableNotes = ref<StorableNotes>(loadInitialStorableNotes());

  const selectedSection = computed<Section | undefined>(() => {
    return selectSectionInStorableNotes(storableNotes.value, storableNotes.value.selectedSectionTitle);
  });

  const selectedPage = computed<Page | undefined>(() => {
    if (!selectedSection.value) return undefined;
    return selectPageInSection(selectedSection.value, selectedSection.value.activePageTitle);
  });

  const selectedContext = computed<Context | undefined>(() => {
    if (!selectedPage.value) return undefined;
    return selectContextInPage(selectedPage.value, selectedPage.value.activeContextTitle);
  });

  const focusedItem = computed<ListItem | undefined>(() => {
    if (!selectedContext.value) return undefined;
    return focusItemInContext(selectedContext.value, selectedContext.value.focusedItemTitle);
  });

  const prominentItem = computed<ListItem | undefined>(() => {
    if (!selectedPage.value) return undefined;
    const { contexts, prominentItemTitle } = selectedPage.value;
    if (!prominentItemTitle || !contexts.length) return undefined;
    for (const c of contexts) {
      for (const item of c.items) {
        if (checkIfStringsMatch(item.title, prominentItemTitle)) {
          if (!item.done && !item.snoozeTill) return item;
        }
      }
    }
    return undefined;
  });

  const loggedInUser = ref<null | User>(null);
  firebaseAuth.onAuthStateChanged(async (updatedUser) => {
    loggedInUser.value = updatedUser;

    if (updatedUser) {
      const storedDoc = await getNotesForUser();
      const storedNotes = storedDoc?.data();

      if (storedNotes && !isEqual(storedNotes, storableNotes.value)) {
        storableNotes.value = mergeStorableNotes(storableNotes.value, JSON.stringify(storedNotes));
      }
    }
  });

  const showSnoozedItems = ref(false);

  const notFocusedOnTab = ref(false);
  window.addEventListener('focus', () => notFocusedOnTab.value = false);
  window.addEventListener('blur', () => notFocusedOnTab.value = true);

  timedSnoozeChecks();

  function toggleSnoozedItems() {
    showSnoozedItems.value = !showSnoozedItems.value;
  }

  function timedSnoozeChecks() {
    storableNotes.value.allSections.forEach(({ pages }) => {
      pages.forEach(({ contexts }) => {
        contexts.forEach(({ items }) => {
          items.forEach((item) => {
            if (!item.snoozeTill) return;

            const currentTime = Date.now();
            if (currentTime > item.snoozeTill) item.snoozeTill = undefined;
          });
        });
      });
    });

    setTimeout(timedSnoozeChecks, 10000);
  }

  function mergeNotesFromQuery(notesJsonFromQuery: string | undefined) {
    if (!notesJsonFromQuery) return;
    storableNotes.value = mergeStorableNotes(storableNotes.value, notesJsonFromQuery ?? '');
  }

  function getMatchedItemSearchItem(inputText: string): SearchItem[] {
    const item = focusedItem.value;
    if (!item) return [];

    const { code, rest } = extractCodeAndRestFromInputText(inputText);

    const itemSpecificCodes = constObjectKeys(itemSpecificCodeTitles);
    if (!constArrayIncludes(itemSpecificCodes, code)) return [];

    if (code === 'active') {
      const page = selectedPage.value;
      return page
        ? [{
            action: () => makeItemProminent(item.title, page),
            title: `Mark as active: ${item.title}`,
          }]
        : [];
    } else if (code === 'snooze') {
      const datetime: null | number = parseDatetimeFromText(rest);
      if (!datetime) {
        return [{
          action: () => {},
          props: { disabled: true },
          title: `Snooze "${item.title}" - Enter valid date/time`,
        }];
      }

      const d = new Date(datetime);
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      let displayed: string = '';

      if (datetime < tomorrow.getTime()) displayed = `${d.getHours()}:${getMinutesWith2Digits(d.getMinutes())}`;
      else if (d.getHours() === 0) displayed = `${d.getDate()}/${d.getMonth() + 1}`;
      else displayed = `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${getMinutesWith2Digits(d.getMinutes())}`;

      return [{
        action: () => {
          item.snoozeTill = datetime;
          if (selectedContext.value && !showSnoozedItems.value) changeFocusedItemInContext(selectedContext.value, 'down', false);
        },
        title: `Snooze "${item.title}" - till ${displayed}`,
      }];
    } else if (code === 'regular') {
      const parsedDatetime = parseDatetimeFromText(rest);

      if (!parsedDatetime) {
        return [{
          action: () => {},
          props: { disabled: true },
          title: `Make "${item.title}" regular - Enter valid day/daily (and optionally time)`,
        }];
      }

      return [{
        action: () => {
          item.regular = rest;
        },
        title: `Make "${item.title}" regular - ${renderDatetimeNicely(parsedDatetime)}`,
      }];
    } else {
      assertIsUnreachable(code);
    }

    return [];
  }

  function getMatchedContextSearchItem(inputText: string): SearchItem[] {
    const context = selectedContext.value;
    if (!context) return [];

    const { code, rest } = extractCodeAndRestFromInputText(inputText);

    const contextSpecificCodes = constObjectKeys(contextSpecificCodeTitles);

    if (!constArrayIncludes(contextSpecificCodes, code)) return [];

    const trimmedRest = rest.trim();
    const baseTitle = contextSpecificCodeTitles[code];

    const matchingItems = getFuzzyMatches(context.items, trimmedRest);

    if (code === 'd') {
      return matchingItems.filter(item => !item.done).map(item => ({
        action: () => toggleListItem(context, item.title, showSnoozedItems.value),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'delitem') {
      return matchingItems.map(item => ({
        action: () => deleteItemFromContext(item.title, context),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'edititem') {
      return matchingItems.map(item => ({
        action: () => editTitle(item, context.items),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'focus' || code === 'f') {
      return matchingItems.map(item => ({
        action: () => focusItemInContext(context, item.title),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'undo') {
      return matchingItems.filter(item => item.done).map(item => ({
        action: () => toggleListItem(context, item.title, showSnoozedItems.value),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'unregular') {
      return matchingItems.filter(item => item.regular).map(item => ({
        action: () => makeItemNotRegular(item),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'unsnooze') {
      return matchingItems.filter(item => item.snoozeTill).map(item => ({
        action: () => makeItemNotSnoozed(item),
        title: `${baseTitle}: ${item.title}`,
      }));
    }

    const titleMappingsWithRest: Record<typeof code, string | undefined> = {
      '-': trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      'n': trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      'rd': trimmedRest ? undefined : baseTitle,
      'rdc': trimmedRest ? undefined : baseTitle,
      'sort': trimmedRest ? undefined : baseTitle,
      'wide': trimmedRest ? undefined : baseTitle,
    };

    const title = titleMappingsWithRest[code];

    if (!title) return [];

    const createNewItem = () => {
      const itemTitle = (trimmedRest || window.prompt('New item title', '') || '').trim();
      if (!itemTitle) return;
      findOrCreateItemInContext(itemTitle, context);
      focusItemInContext(context, itemTitle);
    };

    const actionMapping: Record<typeof code, () => void> = {
      '-': createNewItem,
      'n': createNewItem,
      'rd': () => removeDoneItemsFromContext(context),
      'rdc': () => removeDoneItemsFromContext(context),
      'sort': () => sortItemsInContextAlphabetically(context),
      'wide': () => toggleWideContext(context),
    };

    return [{ action: actionMapping[code], title }];
  }

  function getMatchedPageSearchItem(inputText: string): SearchItem[] {
    const page = selectedPage.value;
    if (!page) return [];

    const { code, rest } = extractCodeAndRestFromInputText(inputText);

    const pageSpecificCodes = constObjectKeys(pageSpecificCodeTitles);

    if (!constArrayIncludes(pageSpecificCodes, code)) return [];

    const trimmedRest = rest.trim();
    const baseTitle = pageSpecificCodeTitles[code];

    const matchingContexts = getFuzzyMatches(page.contexts, trimmedRest);

    if (code === 'c') {
      return matchingContexts.map(context => ({
        action: () => selectContextInPage(page, context.title),
        title: `${baseTitle}: ${context.title}`,
      }));
    } else if (code === 'delcontext') {
      return matchingContexts.map(context => ({
        action: () => deleteContextFromPage(context.title, page),
        title: `${baseTitle}: ${context.title}`,
      }));
    } else if (code === 'copy') {
      return [{
        action: () => page.prominentItemTitle
          ? copyToClipboard(page.prominentItemTitle)
          : undefined,
        title: baseTitle,
      }];
    } else if (code === 'editcontext') {
      return matchingContexts.map(context => ({
        action: () => editTitle(context, page.contexts),
        title: `${baseTitle}: ${context.title}`,
      }));
    } else if (code === 'unactive') {
      return [{
        action: () => removeProminentItem(page),
        title: baseTitle,
      }];
    }

    const titleMappingsWithRest: Record<typeof code, string | undefined> = {
      nc: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      ncol: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      nctodo: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      ncul: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      rdp: trimmedRest ? undefined : baseTitle,
    };

    const title = titleMappingsWithRest[code];

    if (!title) return [];

    const createNewContext = (contextType: Context['type']) => {
      const contextTitle = (trimmedRest || window.prompt('New context title', '') || '').trim();
      if (!contextTitle) return;
      const existingContext = findContextInPage(contextTitle, page);
      if (existingContext) return;

      page.contexts.push({ items: [], title: contextTitle, type: contextType });
      selectContextInPage(page, contextTitle);
    };

    const actionMapping: Record<typeof code, () => void> = {
      nc: () => createNewContext('todo'),
      ncol: () => createNewContext('ordered-list'),
      nctodo: () => createNewContext('todo'),
      ncul: () => createNewContext('unordered-list'),
      rdp: () => removeDoneItemsFromPage(page),
    };

    return [{ action: actionMapping[code], title }];
  }

  function getMatchedSectionSearchItem(inputText: string): SearchItem[] {
    const section = selectedSection.value;
    if (!section) return [];

    const { code, rest } = extractCodeAndRestFromInputText(inputText);

    const sectionSpecificCodes = constObjectKeys(sectionSpecificCodeTitles);

    if (!constArrayIncludes(sectionSpecificCodes, code)) return [];

    const trimmedRest = rest.trim();
    const baseTitle = sectionSpecificCodeTitles[code];

    const matchingPages = getFuzzyMatches(section.pages, trimmedRest);

    if (code === 'p') {
      return matchingPages.map(page => ({
        action: () => selectPageInSection(section, page.title),
        title: `${baseTitle}: ${page.title}`,
      }));
    } else if (code === 'delpage') {
      return matchingPages.map(page => ({
        action: () => deletePageFromSection(page.title, section),
        title: `${baseTitle}: ${page.title}`,
      }));
    } else if (code === 'editpage') {
      return matchingPages.map(page => ({
        action: () => editTitle(page, section.pages),
        title: `${baseTitle}: ${page.title}`,
      }));
    } else if (code === '?') {
      const allContextsWithPageTitles = section.pages.flatMap(page => page.contexts.map(context => ({
        context,
        page,
        title: `${page.title} - ${context.title}`,
      })));

      return getFuzzyMatches(allContextsWithPageTitles, trimmedRest).map(obj => ({
        action: () => {
          obj.page.activeContextTitle = obj.context.title;
          selectPageInSection(section, obj.page.title);
        },
        title: `Select context: ${obj.title}`,
      }));
    }

    const titleMappingsWithRest: Record<typeof code, string | undefined> = {
      np: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
    };

    const title = titleMappingsWithRest[code];

    if (!title) return [];

    const actionMapping: Record<typeof code, () => void> = {
      np: () => {
        const pageTitle = (trimmedRest || window.prompt('New page title', '') || '').trim();
        if (!pageTitle) return;
        findOrCreatePageInSection(pageTitle, section);
        selectPageInSection(section, pageTitle);
      },
    };

    return [{ action: actionMapping[code], title }];
  }

  function getMatchedGeneralSearchItem(inputText: string): SearchItem[] {
    const { code, rest } = extractCodeAndRestFromInputText(inputText);

    const generalCodes = constObjectKeys(generalCodeTitles);

    if (!constArrayIncludes(generalCodes, code)) return [];

    const trimmedRest = rest.trim();
    const baseTitle = generalCodeTitles[code];

    const matchingSections = getFuzzyMatches(storableNotes.value.allSections, trimmedRest);

    if (code === 's') {
      return matchingSections.map(section => ({
        action: () => selectSectionInStorableNotes(storableNotes.value, section.title),
        title: `${baseTitle}: ${section.title}`,
      }));
    } else if (code === 'delsection') {
      return matchingSections.map(section => ({
        action: () => deleteSectionFromStorableNotes(section.title, storableNotes.value),
        title: `${baseTitle}: ${section.title}`,
      }));
    } else if (code === 'editsection') {
      return matchingSections.map(section => ({
        action: () => editTitle(section, storableNotes.value.allSections),
        title: `${baseTitle}: ${section.title}`,
      }));
    }

    const titleMappingsWithRest: Record<typeof code, string | undefined> = {
      auth: trimmedRest ? undefined : baseTitle,
      export: trimmedRest ? undefined : baseTitle,
      help: trimmedRest ? undefined : baseTitle,
      import: trimmedRest ? undefined : baseTitle,
      ns: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      snoozed: trimmedRest ? undefined : baseTitle,
    };

    const title = titleMappingsWithRest[code];

    if (!title) return [];

    const actionMapping: Record<typeof code, () => void> = {
      auth: () => EventBus.emit('show-auth'),
      export: () => copyToClipboard(convertToExportableJSON(storableNotes.value)),
      help: showHelpAlert,
      import: () => {
        const pastedContent = window.prompt('Please paste JSON') || '';
        storableNotes.value = mergeStorableNotes(storableNotes.value, pastedContent);
      },
      ns: () => {
        const sectionTitle = (trimmedRest || window.prompt('New section title', '') || '').trim();
        if (!sectionTitle) return;
        findOrCreateSection(sectionTitle, storableNotes.value.allSections);
        selectSectionInStorableNotes(storableNotes.value, sectionTitle);
      },
      snoozed: () => toggleSnoozedItems(),
    };

    return [{ action: actionMapping[code], title }];
  }

  function getNonCodeSearchResultsBasedOnSelection(inputText: string): SearchItem[] {
    const trimmed = inputText.trim();
    if (!trimmed) return [];

    const matchedSearchResults = [
      ...getMatchedPageSearchItem(`c ${inputText}`),
      ...getMatchedSectionSearchItem(`p ${inputText}`),
      ...getMatchedGeneralSearchItem(`s ${inputText}`),
    ];

    if (selectedContext.value) {
      const context = selectedContext.value;
      const exactlyMatches = context.items.find(item => checkIfStringsMatch(item.title, trimmed));

      const newItemResults = exactlyMatches ? [] : getMatchedContextSearchItem(`n ${inputText}`);

      if (context.type === 'todo') {
        return [
          ...getMatchedContextSearchItem(`d ${inputText}`),
          ...getMatchedContextSearchItem(`undo ${inputText}`),
          ...matchedSearchResults,
          ...newItemResults,
        ];
      } else {
        return [
          ...matchedSearchResults,
          ...newItemResults,
        ];
      }
    } else if (selectedPage.value) {
      return [
        ...matchedSearchResults,
        ...getMatchedPageSearchItem(`nc ${inputText}`),
      ];
    } else if (selectedSection.value) {
      return [
        ...matchedSearchResults,
        ...getMatchedSectionSearchItem(`np ${inputText}`),
      ];
    }

    return [];
  }

  function getSearchItems(inputText: string): SearchItem[] {
    const matchedSearchItems = [
      ...getMatchedItemSearchItem(inputText),
      ...getMatchedContextSearchItem(inputText),
      ...getMatchedPageSearchItem(inputText),
      ...getMatchedSectionSearchItem(inputText),
      ...getMatchedGeneralSearchItem(inputText),
    ];

    if (matchedSearchItems.length) return matchedSearchItems;

    return getNonCodeSearchResultsBasedOnSelection(inputText);
  }

  return {
    copyToClipboard,
    focusedItem,
    getSearchItems,
    mergeNotesFromQuery,
    notFocusedOnTab,
    prominentItem,
    selectedContext,
    selectedPage,
    selectedSection,
    showSnoozedItems,
    storableNotes,
  };
});

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
}

function loadInitialStorableNotes(): StorableNotes {
  const jsonFromLocalStorage = localStorage.getItem(LOCAL_STORAGE_KEY) ?? '';
  return createStorableNotesFromJson(jsonFromLocalStorage);
}

function showHelpAlert() {
  const getAsStrings = (titlesObj: Record<string, string>) => Object.entries(titlesObj)
    .map(([code, description]) => `${code}\t${description}`)
    .join('\n');

  const joined = [
    'Context-specific:',
    getAsStrings(contextSpecificCodeTitles),
    '',

    'Page-specific:',
    getAsStrings(pageSpecificCodeTitles),
    '',

    'Section-specific:',
    getAsStrings(sectionSpecificCodeTitles),
    '',

    'General:',
    getAsStrings(generalCodeTitles),
  ].join('\n');
  window.alert(joined);
}
