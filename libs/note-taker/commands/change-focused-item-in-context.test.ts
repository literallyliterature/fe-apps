import { getCommonSubjectTests } from 'utils/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { Context, ListItem } from '../data';

import { changeFocusedItemInContext } from './change-focused-item-in-context';

describe('changeFocusedItemInContext', () => {
  const oneTwoThree: ListItem[] = [
    { title: 'one' },
    { title: 'two' },
    { done: true, title: 'three' },
  ];

  let focusedItemTitle: string | undefined;
  beforeEach(() => focusedItemTitle = 'two');

  let showingSnoozedItems: boolean;
  beforeEach(() => showingSnoozedItems = false);

  let upOrDown: 'down' | 'up';
  beforeEach(() => upOrDown = 'up');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const context: Context = {
      focusedItemTitle,
      items: oneTwoThree,
      title: 'example',
      type: 'todo',
    };
    changeFocusedItemInContext(context, upOrDown, showingSnoozedItems);
    return context.focusedItemTitle;
  });

  it('if no focused item currently exists, selects either the first or the last based on up or down', () => {
    focusedItemTitle = undefined;

    upOrDown = 'up';
    expectSubjectToEqual('three'); // last item

    upOrDown = 'down';
    expectSubjectToEqual('one');
  });

  it('changes focused item to the one before or after, based on up or down', () => {
    focusedItemTitle = 'two';

    upOrDown = 'up';
    expectSubjectToEqual('one');

    upOrDown = 'down';
    expectSubjectToEqual('three');
  });

  it('can change focused item to the other end of the list, based on up or down', () => {
    focusedItemTitle = 'one';

    upOrDown = 'up';
    expectSubjectToEqual('three'); // wrap to last item

    focusedItemTitle = 'three';
    upOrDown = 'down';
    expectSubjectToEqual('one'); // wrap to first item
  });

  it('skips snoozed items when moving up or down, if they are currently not visible', () => {
    const context: Context = {
      focusedItemTitle: 'one',
      items: [
        { title: 'one' },
        { snoozeTill: Date.now() + 10000, title: 'two' },
        { done: true, title: 'three' },
      ],
      title: 'example',
      type: 'todo',
    };

    changeFocusedItemInContext(context, 'down', false);
    expect(context.focusedItemTitle).toBe('three');

    changeFocusedItemInContext(context, 'up', true);
    expect(context.focusedItemTitle).toBe('two');
  });
});
