import { checkIfStringsMatch } from 'utils';

import type { Context } from '../data';

export function changeFocusedItemInContext(context: Context, upOrDown: 'down' | 'up'): void {
  const { focusedItemTitle } = context;
  const indexOfFocusedItem = focusedItemTitle
    ? context.items.findIndex(item => checkIfStringsMatch(item.title, focusedItemTitle))
    : -1;
  const lastItemIndex = context.items.length - 1;

  if (!focusedItemTitle || context.items.length <= 1 || indexOfFocusedItem === -1) {
    const index = upOrDown === 'up' ? lastItemIndex : 0;
    context.focusedItemTitle = context.items[index]?.title;
    return;
  }

  const newIndex: number = (() => {
    if (indexOfFocusedItem === 0 && upOrDown === 'up') return lastItemIndex;
    if (indexOfFocusedItem === lastItemIndex && upOrDown === 'down') return 0;
    return indexOfFocusedItem + (upOrDown === 'up' ? -1 : 1);
  })();

  context.focusedItemTitle = context.items[newIndex]?.title;
}
