import type { Page } from '../data';

export function removeProminentItem(page: Page): void {
  page.prominentItemTitle = undefined;
}
