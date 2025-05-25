import fuzzy from 'fuzzy';

import { Context, SearchResult } from "./NoteTaker.types";
import _ from 'lodash';


const newContextCmd: SearchResult = { cmd: 'context.new', title: 'New context' };


export class NoteTaker {
  availableContexts: Context[];
  selectedContext = null;

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
    if (!this.availableContexts?.length) return [newContextCmd];

    const allSearchItems = [
      newContextCmd,
      ...this.selectContextSearchItems,
    ];
 
    const filterResults = fuzzy.filter(inputText, allSearchItems, { extract: item => item.title });

    return _.orderBy(filterResults, ['score', 'string'], ['desc', 'asc']).map(obj => obj.original);
  }
}
