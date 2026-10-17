import type { infer as ZInfer } from 'zod';

import {
  array,
  boolean,
  literal,
  number,
  object,
  string,
  union,
} from 'zod';

export const noteTakerZodSchema = object({
  allSections: array(object({
    activePageTitle: string().optional(),
    pages: array(object({
      activeContextTitle: string().optional(),
      contexts: array(object({
        focusedItemTitle: string().optional(),
        items: array(object({
          done: boolean().optional(),
          regular: string().optional().catch(undefined),
          snoozeTill: number().optional(),
          title: string(),
        })),
        title: string(),
        type: union([literal('todo'), literal('ordered-list'), literal('unordered-list')]),
        wide: boolean().optional(),
      })),
      title: string(),
    })),
    title: string(),
  })),
  selectedSectionTitle: string().optional(),
});

export type Context = Page['contexts'][number];
export type ListItem = Context['items'][number];
export type Page = Section['pages'][number];
export type Section = StorableNotes['allSections'][number];
export type StorableNotes = ZInfer<typeof noteTakerZodSchema>;
