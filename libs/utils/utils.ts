import { isNil } from 'lodash';

export function assertNotNil<T>(v: null | T | undefined): asserts v is T {
  if (isNil(v)) throw new Error(`Did not expect nil value: ${v}`);
}

export function checkIfStringsMatch(first: string, second: string) {
  return normaliseStringForComparison(first) === normaliseStringForComparison(second);
}

export function normaliseStringForComparison(s: string) {
  return s.toLowerCase().trim();
}
