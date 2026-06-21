import { defineStore } from 'pinia';
import { checkIfStringsMatch, constArrayIncludes, constObjectKeys } from 'utils';
import { computed, ref } from 'vue';

import type { Context, ListItem, Page, Section, StorableNotes } from './NoteTaker.types';
import type { SearchItem } from './search-results';

import { convertToExportableJSON, createStorableNotesFromJson, findContextInPage, findOrCreateItemInContext, findOrCreatePageInSection, findOrCreateSection, focusItemInContext, getFuzzyMatches, mergeStorableNotes, removeDoneItemsFromContext, removeDoneItemsFromPage, selectContextInPage, selectPageInSection, selectSectionInStorableNotes, sortItemsInContextAlphabetically, toggleListItem } from './commands';
import { contextSpecificCodeTitles, extractCodeAndRestFromInputText, generalCodeTitles, pageSpecificCodeTitles, sectionSpecificCodeTitles } from './search-results';

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

  function mergeNotesFromQuery(notesJsonFromQuery: string | undefined) {
    if (!notesJsonFromQuery) return;
    storableNotes.value = mergeStorableNotes(storableNotes.value, notesJsonFromQuery ?? '');
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
        action: () => toggleListItem(context, item.title),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'focus' || code === 'f') {
      return matchingItems.map(item => ({
        action: () => focusItemInContext(context, item.title),
        title: `${baseTitle}: ${item.title}`,
      }));
    } else if (code === 'undo') {
      return matchingItems.filter(item => item.done).map(item => ({
        action: () => toggleListItem(context, item.title),
        title: `${baseTitle}: ${item.title}`,
      }));
    }

    const titleMappingsWithRest: Record<typeof code, string | undefined> = {
      '-': trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      'n': trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
      'rd': trimmedRest ? undefined : baseTitle,
      'rdc': trimmedRest ? undefined : baseTitle,
      'sort': trimmedRest ? undefined : baseTitle,
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
    }

    const titleMappingsWithRest: Record<typeof code, string | undefined> = {
      export: trimmedRest ? undefined : baseTitle,
      help: trimmedRest ? undefined : baseTitle,
      import: trimmedRest ? undefined : baseTitle,
      ns: trimmedRest ? `${baseTitle}: ${trimmedRest}` : baseTitle,
    }; ;

    const title = titleMappingsWithRest[code];

    if (!title) return [];

    const actionMapping: Record<typeof code, () => void> = {
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
    };

    return [{ action: actionMapping[code], title }];
  }

  function getNonCodeSearchResultsBasedOnSelection(inputText: string): SearchItem[] {
    const trimmed = inputText.trim();
    if (!trimmed) return [];

    if (selectedContext.value) {
      const context = selectedContext.value;
      const exactlyMatches = context.items.find(item => checkIfStringsMatch(item.title, trimmed));

      const newItemResults = exactlyMatches ? [] : getMatchedContextSearchItem(`n ${inputText}`);

      if (context.type === 'todo') {
        return [
          ...getMatchedContextSearchItem(`d ${inputText}`),
          ...getMatchedContextSearchItem(`undo ${inputText}`),
          ...newItemResults,
        ];
      } else {
        return newItemResults;
      }
    } else if (selectedPage.value) {
      return getMatchedPageSearchItem(`nc ${inputText}`);
    } else if (selectedSection.value) {
      return getMatchedSectionSearchItem(`np ${inputText}`);
    }

    return [];
  }

  function getSearchItems(inputText: string): SearchItem[] {
    const matchedSearchItems = [
      ...getMatchedContextSearchItem(inputText),
      ...getMatchedPageSearchItem(inputText),
      ...getMatchedSectionSearchItem(inputText),
      ...getMatchedGeneralSearchItem(inputText),
    ];

    if (matchedSearchItems.length) return matchedSearchItems;

    return getNonCodeSearchResultsBasedOnSelection(inputText);
  }

  return {
    focusedItem,
    getSearchItems,
    mergeNotesFromQuery,
    selectedContext,
    selectedPage,
    selectedSection,
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

  window.alert('Copied to clipboard');
}

function loadInitialStorableNotes(): StorableNotes {
  const jsonFromLocalStorage = localStorage.getItem(LOCAL_STORAGE_KEY) ?? '';
  return createStorableNotesFromJson(jsonFromLocalStorage);
}

function showHelpAlert() {
  const getAsStrings = (titlesObj: Record<string, string>) => Object.entries(titlesObj)
    .map(([code, description]) => `${code}\t${description}`);

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
