import { describe, expect, it } from 'vitest';

import { checkIfStringsMatch } from './utils';

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
