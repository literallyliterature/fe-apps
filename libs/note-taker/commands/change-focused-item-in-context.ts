import { checkIfStringsMatch } from 'utils';

import type { Context } from '../data';

export function changeFocusedItemInContext(
  context: Context,
  upOrDown: 'down' | 'up',
  showingSnoozedItems: boolean,
): void {
  const { focusedItemTitle, items } = context;
  const shownItems = showingSnoozedItems
    ? items
    : items.filter(item => !item.snoozeTill);

  const indexOfFocusedItem = focusedItemTitle
    ? shownItems.findIndex(item => checkIfStringsMatch(item.title, focusedItemTitle))
    : -1;
  const lastItemIndex = shownItems.length - 1;

  if (!focusedItemTitle || shownItems.length <= 1 || indexOfFocusedItem === -1) {
    const index = upOrDown === 'up' ? lastItemIndex : 0;
    context.focusedItemTitle = shownItems[index]?.title;
    return;
  }

  const newIndex: number = (() => {
    if (indexOfFocusedItem === 0 && upOrDown === 'up') return lastItemIndex;
    if (indexOfFocusedItem === lastItemIndex && upOrDown === 'down') return 0;
    return indexOfFocusedItem + (upOrDown === 'up' ? -1 : 1);
  })();

  context.focusedItemTitle = shownItems[newIndex]?.title;
}
