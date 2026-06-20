import { describe, expect, expectTypeOf, it } from 'vitest';

import { assertNotNil, checkIfStringsMatch, normaliseStringForComparison } from './utils';

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

describe('normaliseStringForComparison', () => {
  it('trims and lowercases input string', () => {
    expect(normaliseStringForComparison('    AsdF ')).toEqual('asdf');
  });
});
