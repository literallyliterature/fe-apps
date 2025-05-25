import fuzzy from 'fuzzy';

import { SearchResult } from "./NoteTaker.types";
import _ from 'lodash';
import { Context } from './Context';


const results: Record<string, SearchResult> = {
  leaveContext: { cmd: 'context.unselect', title: 'Leave context' },
  newContext: { cmd: 'context.new', title: 'New context' },
}


export class NoteTaker {
  availableContexts: Context[];
  selectedContext: Context | null;

  constructor(availableContexts = [], selectedContext = null) {
    this.availableContexts = availableContexts;
    this.selectedContext = selectedContext;
  }

  get isUnscoped() {
    return this.selectedContext === null;
  }

  get selectContextSearchItems(): SearchResult[] {
    return this.availableContexts.map(context => ({
      cmd: 'context.select',
      context,
      title: `Select context: ${context.title}`,
    }));
  }

  getSearchItems(inputText: string): SearchResult[] {
    if (!this.availableContexts?.length) return [results.newContext];
    if (!this.selectedContext) return this.getSearchItemsUnscoped(inputText);
    return this.getSearchItemsScoped(inputText);
  }

  getSearchItemsScoped(inputText: string): SearchResult[] {
    const allItems = [
      results.leaveContext,
      ...(this.selectedContext ? this.selectedContext.getSearchItems(inputText) : []),
    ]
    return [results.leaveContext];
  }

  getSearchItemsUnscoped(inputText: string): SearchResult[] {
    const allSearchItems = [
      results.newContext,
      ...this.selectContextSearchItems,
    ];
 
    const filterResults = fuzzy.filter(inputText, allSearchItems, { extract: item => item.title });

    return _.orderBy(filterResults, ['score', 'string'], ['desc', 'asc']).map(obj => obj.original);
  }
}
