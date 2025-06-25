import { NoteTaker } from "./NoteTaker";
import { SearchItem } from "./NoteTaker.types";

enum CommandSituation {
  Default,
  Editing,
};

export class CommandParser {
  noteTaker: NoteTaker; 
  situation: CommandSituation;

  constructor(noteTaker: NoteTaker) {
    this.noteTaker = noteTaker;
    this.situation = CommandSituation.Default;
  }

  getSearchItems(inputText: string): SearchItem[] {
    const { noteTaker, situation } = this;
    if (situation === CommandSituation.Default) {
      if (!noteTaker.allSections.length) return getNewSection()
    }
    return [];
  }

  selectSearchItem(searchItem: SearchItem) {
    if (searchItem.code) {

    } else {
      const unreachable: never = searchItem;
    }
  }
}
