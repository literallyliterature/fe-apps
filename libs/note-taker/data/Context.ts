import { SearchResult } from "./NoteTaker.types";

export class Context {
  title: string;

  constructor({ title }) {
    this.title = title;
  }

  getSearchItems(inputText: string): SearchResult[] {
    return [];
  }
}