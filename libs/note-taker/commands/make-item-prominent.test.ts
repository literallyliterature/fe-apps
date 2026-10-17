import {
  describe,
  expect,
  it,
} from 'vitest';

import type { Page } from '../data';

import { makeItemProminent } from './make-item-prominent';

describe('makeItemProminent', () => {
  it('sets given item title as the prominent item title on the page', () => {
    const page: Page = {
      contexts: [
        { items: [{
          title: 'example item',
        }], title: 'example context', type: 'todo' },
      ],
      title: 'example page',
    };
    makeItemProminent('example item', page);
    expect(page.prominentItemTitle).toBe('example item');
  });

  it('does not do anything if the given item title does not match any existing items', () => {
    const page: Page = { contexts: [], title: 'example page' };
    makeItemProminent('non-existent item', page);
    expect(page.prominentItemTitle).toBeUndefined();
  });
});
