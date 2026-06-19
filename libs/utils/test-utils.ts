import { expect } from 'vitest';

export function getCommonSubjectTests<T>(getSubject: () => T) {
  const expectSubject = () => expect(getSubject());
  const expectSubjectToEqual = (expectedOutput: T) => expectSubject().toEqual(expectedOutput);

  return {
    expectSubject,
    expectSubjectToEqual,
    getSubject,
  };
}
