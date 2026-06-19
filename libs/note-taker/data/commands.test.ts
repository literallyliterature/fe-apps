import type { Section } from './NoteTaker.types';
import { beforeEach, describe, it } from 'vitest';
import { getCommonSubjectTests } from '../../utils';
import { createSection } from './commands';

describe('createSection', () => {
  let existingSections: Section[];
  beforeEach(() => existingSections = []);

  let sectionTitle: string;
  beforeEach(() => sectionTitle = '');

  const { expectSubjectToEqual } = getCommonSubjectTests(() => createSection({
    existingSections,
    sectionTitle,
  }));

  it('returns a section object with empty pages', () => {
    sectionTitle = 'asdf';
    expectSubjectToEqual({ pages: [], title: 'asdf' });
  });

  it('returns existing section object if one is found with a matching title (case insensitive)', () => {
    existingSections = [{ pages: [], title: 'existing' }];
    sectionTitle = 'EXISTING';

    expectSubjectToEqual({ pages: [], title: 'existing' });
  });
});
