import type { Section } from './NoteTaker.types';

export function createSection({ existingSections, sectionTitle }: {
  existingSections: Section[]
  sectionTitle: string
}): Section {
  const existingMatch = existingSections.find(s => s.title.toLowerCase() === sectionTitle.toLowerCase());

  return existingMatch ?? {
    pages: [],
    title: sectionTitle,
  };
}
