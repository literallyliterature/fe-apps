import {
  beforeEach,
  describe,
  it,
} from 'vitest';

import { getNextOrPrevIndex } from './get-next-or-prev-index';
import { getCommonSubjectTests } from './test-utils';

describe('getNextOrPrevIndex', () => {
  let currentIndex: number;
  beforeEach(() => currentIndex = 0);

  let length: number;
  beforeEach(() => length = 0);

  let nextOrPrev: 'next' | 'prev';
  beforeEach(() => nextOrPrev = 'next');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => getNextOrPrevIndex({
    currentIndex,
    length,
    nextOrPrev,
  }));

  it('returns -1 for empty length', () => {
    length = 0;
    expectSubjectToEqual(-1);
  });

  it('handles wrapping at start and end', () => {
    length = 3;

    currentIndex = 0;
    nextOrPrev = 'prev';
    expectSubjectToEqual(2);

    currentIndex = 2;
    nextOrPrev = 'next';
    expectSubjectToEqual(0);
  });

  it('returns previous or next index if it exists', () => {
    length = 3;
    currentIndex = 1;

    nextOrPrev = 'next';
    expectSubjectToEqual(2);

    nextOrPrev = 'prev';
    expectSubjectToEqual(0);
  });

  it('handles invalid values for currentIndex and returns a valid index', () => {
    currentIndex = NaN;
    length = 3;

    nextOrPrev = 'prev';
    expectSubjectToEqual(2);

    currentIndex = -123.23;
    nextOrPrev = 'next';
    expectSubjectToEqual(2);
  });
});
