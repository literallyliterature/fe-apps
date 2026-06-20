import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import { getCommonSubjectTests } from './test-utils';
import { assertNotNil, checkIfStringsMatch, moveItemDown, moveItemUp, normaliseStringForComparison } from './utils';

describe('assertNotNil', () => {
  it('throws an error if value is undefined or null', () => {
    expect(() => assertNotNil(undefined)).toThrow();
    expect(() => assertNotNil(null)).toThrow();
  });

  it('does not throw error for non-nullish values', () => {
    [
      0,
      false,
      true,
      {},
      [],
    ].forEach(v => expect(() => assertNotNil(v)).not.toThrow());
  });

  it('enforces that the type of something no longer includes undefined | null', () => {
    let v: null | string | undefined = 'asdf';
    v = undefined;
    v = 'asdf';

    assertNotNil(v);
    expectTypeOf(v).toEqualTypeOf<string>();
  });
});

describe('checkIfStringsMatch', () => {
  it('returns true if strings match', () => {
    expect(checkIfStringsMatch('one', 'one')).toBe(true);
    expect(checkIfStringsMatch('one', 'two')).toBe(false);
  });

  it('does case-insensitive check', () => {
    expect(checkIfStringsMatch('One', 'ONE')).toBe(true);
  });

  it('trims strings before checking', () => {
    expect(checkIfStringsMatch('   one', ' one    ')).toBe(true);
    expect(checkIfStringsMatch('one', 'o ne')).toBe(false);
  });
});

describe('moveItemDown', () => {
  const items = [1, 2, 3];

  let indexToMove: number;
  beforeEach(() => indexToMove = 0);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => moveItemDown(items, indexToMove));

  it('does not modify the input array', () => {
    indexToMove = 1;
    expectSubjectToEqual([1, 3, 2]);
    expect(items).toEqual([1, 2, 3]);
  });

  describe('when given index is not valid', () => {
    it('returns original items as they are', () => {
      indexToMove = 10;
      expectSubjectToEqual([1, 2, 3]);
    });
  });

  describe('when given index is the last item of array', () => {
    it('moves the last item to the start', () => {
      indexToMove = 2;
      expectSubjectToEqual([3, 1, 2]);
    });
  });

  describe('when given index is not the last item of array', () => {
    it('swaps item with the next item', () => {
      indexToMove = 1;
      expectSubjectToEqual([1, 3, 2]);
    });
  });
});

describe('moveItemUp', () => {
  const items = [1, 2, 3];

  let indexToMove: number;
  beforeEach(() => indexToMove = 0);

  const { expectSubjectToEqual } = getCommonSubjectTests(() => moveItemUp(items, indexToMove));

  it('does not modify the input array', () => {
    indexToMove = 1;
    expectSubjectToEqual([2, 1, 3]);
    expect(items).toEqual([1, 2, 3]);
  });

  describe('when given index is not valid', () => {
    it('returns original items as they are', () => {
      indexToMove = 10;
      expectSubjectToEqual([1, 2, 3]);
    });
  });

  describe('when given index is the first item of the array', () => {
    it('moves the last item to the start', () => {
      indexToMove = 0;
      expectSubjectToEqual([2, 3, 1]);
    });
  });

  describe('when given index is not the last item of array', () => {
    it('swaps item with the next item', () => {
      indexToMove = 1;
      expectSubjectToEqual([2, 1, 3]);
    });
  });
});

describe('normaliseStringForComparison', () => {
  it('trims and lowercases input string', () => {
    expect(normaliseStringForComparison('    AsdF ')).toEqual('asdf');
  });
});
