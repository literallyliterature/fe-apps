import { constArrayIncludes, constObjectKeys } from 'utils';

export const contextSpecificCodeTitles = {
  '-': 'New item',
  'd': 'Mark as done',
  'delitem': 'Delete item',
  'edititem': 'Edit item',
  'f': 'Focus item',
  'focus': 'Focus item',
  'n': 'New item',
  'rd': 'Remove done items from context',
  'rdc': 'Remove done items from context',
  'sort': 'Sort items in context',
  'undo': 'Undo item',
};

export const pageSpecificCodeTitles = {
  c: 'Select context',
  delcontext: 'Delete context',
  editcontext: 'Edit context',
  nc: 'New context - todo',
  ncol: 'New context - ol',
  nctodo: 'New context - todo',
  ncul: 'New context - ul',
  rdp: 'Remove done items from page',
};

export const sectionSpecificCodeTitles = {
  '?': 'Search within section',
  'delpage': 'Delete page',
  'editpage': 'Edit page',
  'np': 'New page',
  'p': 'Select page',
};

export const generalCodeTitles = {
  delsection: 'Delete section',
  editsection: 'Edit section',
  export: 'Export JSON to clipboard',
  help: 'See available codes',
  import: 'Import JSON',
  ns: 'New section',
  s: 'Select section',
};

export const codeTitles = {
  ...contextSpecificCodeTitles,
  ...pageSpecificCodeTitles,
  ...sectionSpecificCodeTitles,
  ...generalCodeTitles,
};

export type SearchInputCode = keyof typeof codeTitles;
export interface SearchItem {
  action: () => void
  title: string
}
export const allCodes = constObjectKeys(codeTitles);

export function extractCodeAndRestFromInputText(inputText: string): {
  code?: SearchInputCode
  rest: string
} {
  const elements = inputText.split(' ');
  const potentialCode = elements[0];

  if (constArrayIncludes(allCodes, potentialCode)) {
    return { code: potentialCode, rest: elements.slice(1).join(' ') };
  }

  return { rest: inputText };
}
