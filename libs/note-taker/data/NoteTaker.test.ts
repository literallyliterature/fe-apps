import { beforeEach, describe, expect, it } from "vitest";
import { NoteTaker } from "./NoteTaker";


const exampleContexts = [
  {
    title: 'Skyrim',
  },
  {
    title: 'Halo',
  },
  {
    title: 'FF7',
  },
];

describe('NoteTaker', () => {
  let availableContexts;
  let selectedContext;
  let inputText;

  beforeEach(() => {
    availableContexts = exampleContexts;
    selectedContext = null;
    inputText = '';
  });

  const getInstance = () => new NoteTaker(availableContexts, selectedContext);
  const getSubject = () => getInstance().getSearchItems(inputText);

  const expectSubjectEquals = v => expect(getSubject()).toEqual(v);

  describe('when no context is selected', () => {
    beforeEach(() => { selectedContext = null });

    describe('when no context exists', () => {
      beforeEach(() => { availableContexts = [] });

      it('only returns one item: "New context"', () => {
        expectSubjectEquals([{ cmd: 'context.new', title: 'New context' }]);
      });
    });

    describe('when some contexts already exist', () => {
      beforeEach(() => { availableContexts = exampleContexts; })

      it('when text is "new context", only returns one item: "New context"', () => {
        inputText = 'new context';
        expectSubjectEquals([{ cmd: 'context.new', title: 'New context' }])
      });

      it('when text is "context skyrim", only returns one item: "select context: Skyrim"', () => {
        inputText = 'context skyrim';
        expectSubjectEquals([{ cmd: 'context.select', context: expect.objectContaining({ title: 'Skyrim' }), title: 'Select context: Skyrim' }])
      });

      it('when text is "c skyrim", only returns one item: "select context: Skyrim"', () => {
        inputText = 'c skyrim';
        expectSubjectEquals([{ cmd: 'context.select', context: expect.objectContaining({ title: 'Skyrim' }), title: 'Select context: Skyrim' }])
      });

      it('when text is "skrim", only returns one item: "select context: Skyrim"', () => {
        inputText = 'context skrim';
        expectSubjectEquals([{ cmd: 'context.select', context: expect.objectContaining({ title: 'Skyrim' }), title: 'Select context: Skyrim' }])
      });

      it('when text is "", returns new context and select context items for each context', () => {
        expectSubjectEquals([
          { cmd: 'context.new' },
          { cmd: 'context.select', title: 'Select context: FF7' },
          { cmd: 'context.select', title: 'Select context: Halo' },
          { cmd: 'context.select', title: 'Select context: Skyrim' },
        ].map(obj => expect.objectContaining(obj)));
      });
    });
  });
});
