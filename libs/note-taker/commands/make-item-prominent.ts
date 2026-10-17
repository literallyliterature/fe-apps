import type { Page } from '../data';

export function makeItemProminent(itemTitle: string, page: Page): void {
  const itemExists = page.contexts.some(
    context => context.items.some(item => item.title === itemTitle),
  );
  if (itemExists) page.prominentItemTitle = itemTitle;
}
