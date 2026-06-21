import { isEqual, isNil, sortBy } from 'lodash';

export function assertIsUnreachable(_unreachable: never) {
}

export function assertNotNil<T>(v: null | T | undefined): asserts v is T {
  if (isNil(v)) throw new Error(`Did not expect nil value: ${v}`);
}

export function checkIfStringsMatch(first: string, second: string) {
  return normaliseStringForComparison(first) === normaliseStringForComparison(second);
}

export function constArrayIncludes<const T>(items: T[], item: unknown): item is T {
  return items.some(i => isEqual(item, i));
}

export function constObjectKeys<const T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function moveItemDown<T>(items: T[], indexToMove: number): T[] {
  const arrWithSortIndex = items.map((item, itemIndex) => ({
    item,
    sortIndex: itemIndex === indexToMove
      ? (indexToMove === items.length - 1 ? -1 : indexToMove + 1.5)
      : itemIndex,
  }));
  const sorted = sortBy(arrWithSortIndex, 'sortIndex');
  return sorted.map(obj => obj.item);
}

export function moveItemUp<T>(items: T[], indexToMove: number): T[] {
  const arrWithSortIndex = items.map((item, itemIndex) => ({
    item,
    sortIndex: itemIndex === indexToMove
      ? (indexToMove === 0 ? Infinity : indexToMove - 1.5)
      : itemIndex,
  }));
  const sorted = sortBy(arrWithSortIndex, 'sortIndex');
  return sorted.map(obj => obj.item);
}

export function normaliseStringForComparison(s: string) {
  return s.toLowerCase().trim();
}
