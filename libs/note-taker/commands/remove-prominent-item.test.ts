import {
  describe,
  expect,
  it,
} from 'vitest';

import type { Page } from '../data';

import { removeProminentItem } from './remove-prominent-item';

describe('removeProminentItem', () => {
  it('removes the prominent item title from the page', () => {
    const page: Page = {
      contexts: [],
      title: 'example page',
    };
    removeProminentItem(page);
    expect(page.prominentItemTitle).toBeUndefined();
  });

  it('does not throw an error if there is no prominent item title on the page', () => {
    const page: Page = {
      contexts: [],
      title: 'example page',
    };
    removeProminentItem(page);
    expect(page.prominentItemTitle).toBeUndefined();
  });
});
