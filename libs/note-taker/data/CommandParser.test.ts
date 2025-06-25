import { beforeEach, describe, expect, it } from "vitest";
import { CommandParser } from "./CommandParser";
import { NoteTaker } from "./NoteTaker";

describe('CommandParser', () => {
  let noteTaker: NoteTaker;
  let inputText: string;

  const getSubject = () => new CommandParser(noteTaker).getSearchItems(inputText);
  const expectEqual = v => expect(getSubject()).toEqual(v);
  const expectItemsWithCommands = (cmds: string[]) => expectEqual(cmds.map(cmd => expect.objectContaining({ cmd })));

  describe('when NoteTaker does not have any sections', () => {
    beforeEach(() => { noteTaker = new NoteTaker(); });

    it('only returns command for adding new section, as long as some "additional" text is given', () => {
      inputText = '';
      expectEqual([]);

      inputText = 'a new section';
      expectEqual([expect.objectContaining({
        cmd: 'section.new', sectionTitle: 'a new section',
      })])
    });
  });
});
