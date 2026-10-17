import { getCommonSubjectTests } from 'utils';
import {
  beforeEach,
  describe,
  it,
} from 'vitest';

import type { Page } from '../data';

import { changeSelectedContextInPage } from './change-selected-context-in-page';

describe('changeSelectedContextInPage', () => {
  let activeContextTitle: string | undefined;
  beforeEach(() => activeContextTitle = undefined);

  let contextTitles: string[];
  beforeEach(() => contextTitles = []);

  let upOrDown: 'down' | 'up';
  beforeEach(() => upOrDown = 'down');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => {
    const page: Page = {
      activeContextTitle,
      contexts: contextTitles.map(title => ({ items: [], title, type: 'todo' })),
      title: 'example page',
    };
    changeSelectedContextInPage(page, upOrDown);
    return page.activeContextTitle;
  });

  it('sets activeContextTitle to undefined if there are no contexts', () => {
    contextTitles = [];
    expectSubjectToEqual(undefined);
  });

  it('sets activeContextTitle if not currently present', () => {
    contextTitles = ['context 1', 'context 2'];

    upOrDown = 'down';
    expectSubjectToEqual('context 1');

    upOrDown = 'up';
    expectSubjectToEqual('context 2');
  });

  it('handles case when active context title does not match any contexts', () => {
    contextTitles = ['context 1', 'context 2'];
    activeContextTitle = 'non-existent context';

    upOrDown = 'down';
    expectSubjectToEqual('context 1');

    upOrDown = 'up';
    expectSubjectToEqual('context 2');
  });

  it('moves to previous or next context', () => {
    contextTitles = ['one', 'two', 'three'];
    activeContextTitle = 'two';

    upOrDown = 'down';
    expectSubjectToEqual('three');

    upOrDown = 'up';
    expectSubjectToEqual('one');
  });

  it('handles wrapping around first and last context', () => {
    contextTitles = ['one', 'two', 'three'];

    activeContextTitle = 'one';
    upOrDown = 'up';
    expectSubjectToEqual('three');

    activeContextTitle = 'three';
    upOrDown = 'down';
    expectSubjectToEqual('one');
  });
});
