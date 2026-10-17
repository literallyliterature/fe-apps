import { toInteger } from 'lodash';

export function getNextOrPrevIndex({
  currentIndex,
  length,
  nextOrPrev,
}: {
  currentIndex: number;
  length: number;
  nextOrPrev: 'next' | 'prev';
}): number {
  if (length === 0) return -1;

  const isNext = nextOrPrev === 'next';
  const lastIndex = length - 1;
  const intCurrentIndex = toInteger(currentIndex);

  const newIndex = intCurrentIndex + (isNext ? 1 : -1);

  if (newIndex < 0) return lastIndex;
  if (newIndex >= length) return 0;
  return newIndex;
}
