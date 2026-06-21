<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { checkIfStringsMatch, constArrayIncludes } from 'utils';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Context, Page, Section, StorableNotes } from '../data/NoteTaker.types.ts';
import type { SearchItem } from '../data/search-results.ts';

import { changeFocusedItemInContext, convertToExportableJSON, deleteContextFromPage, deleteItemFromContext, deletePageFromSection, deleteSectionFromStorableNotes, moveItemInContext, removeDoneItemsFromContext, selectContextInPage, selectPageInSection, selectSectionInStorableNotes, toggleListItem } from '../data/commands.ts';
import { useNoteTakerStore } from '../data/note-taker.store.ts';
import EditAndDeleteButtons from './EditAndDeleteButtons.vue';

const noteTakerStore = useNoteTakerStore();
const { focusedItem, selectedContext, selectedPage, selectedSection, storableNotes } = storeToRefs(noteTakerStore);

const route = useRoute();
noteTakerStore.mergeNotesFromQuery(String(route.query.notes_json));

const grid = computed(() => {
  return {
    contexts: selectedPage.value?.contexts ?? [],
    focusedItem: focusedItem.value,
    pages: selectedSection.value?.pages ?? [],
    sections: storableNotes.value.allSections,
    selectedContext: selectedContext.value,
    selectedPage: selectedPage.value,
    selectedSection: selectedSection.value,
  };
});

const searchString = ref('');
const items = computed<SearchItem[]>(() => searchString.value
  ? noteTakerStore.getSearchItems(searchString.value)
  : []);

const selectedItem = ref<null | SearchItem>(null);

function deleteContext(contextTitle: string, page: Page) {
  if (!window.confirm(`Delete context: ${contextTitle}?`)) return;
  deleteContextFromPage(contextTitle, page);
}

function deleteContextItem(itemTitle: string, context: Context) {
  if (!window.confirm(`Delete item: ${itemTitle}?`)) return;
  deleteItemFromContext(itemTitle, context);
}

function deletePage(pageTitle: string, section: Section) {
  if (!window.confirm(`Delete page: ${pageTitle}?`)) return;
  deletePageFromSection(pageTitle, section);
}

function deleteSection(sectionTitle: string, storableNotes: StorableNotes) {
  if (!window.confirm(`Delete section ${sectionTitle}?`)) return;
  deleteSectionFromStorableNotes(sectionTitle, storableNotes);
}

function editTitle<T extends { title: string }>(item: T, otherItems: T[]) {
  const newTitle = window.prompt('New title', item.title) || '';
  const isValid = newTitle && otherItems.every(item => !checkIfStringsMatch(item.title, newTitle));
  if (isValid) item.title = newTitle;
}

function selectContext(context: Context) {
  if (selectedPage.value) selectContextInPage(selectedPage.value, context.title);
}

function selectPage(page: Page) {
  if (selectedSection.value) selectPageInSection(selectedSection.value, page.title);
}

function selectSection(section: Section) {
  selectSectionInStorableNotes(storableNotes.value, section.title);
}

watch(selectedItem, (v) => {
  if (!v?.action) return;
  else v.action();

  selectedItem.value = null;
  searchString.value = '';
});

function storeToLocalStorage() {
  setTimeout(() => {
    localStorage.setItem('notes_json', convertToExportableJSON(storableNotes.value));
  });
}

watch(grid, storeToLocalStorage, { deep: true });

const input = useTemplateRef('userInput');
onMounted(() => {
  document.addEventListener('keydown', (event) => {
    if (event.isComposing) return;

    if (searchString.value) return;

    if (event.target instanceof HTMLInputElement && event.target?.type === 'text') return;

    actionBasedOnSpecialEventKey(event);
  });
});

const specialKeys = [
  '/',
  'ArrowUp',
  'ArrowDown',
  ' ',
  'Enter',
] as const;

function actionBasedOnSpecialEventKey(evt: KeyboardEvent) {
  if (!constArrayIncludes(specialKeys, evt.key)) return;

  evt.preventDefault();
  evt.stopPropagation();

  if (evt.key === '/') {
    input.value?.focus();
  } else if (evt.key === 'ArrowUp') {
    if (evt.altKey) focusedItemActionIfSearchEmpty('move-up');
    else focusedItemActionIfSearchEmpty('change-up');
  } else if (evt.key === 'ArrowDown') {
    if (evt.altKey) focusedItemActionIfSearchEmpty('move-down');
    else focusedItemActionIfSearchEmpty('change-down');
  } else {
    focusedItemActionIfSearchEmpty('toggle');
  }
}

function doIfSearchEmpty(evt: KeyboardEvent) {
  if (searchString.value.trim() === '' && constArrayIncludes(specialKeys, evt.key)) {
    evt.preventDefault();
    evt.stopPropagation();
    actionBasedOnSpecialEventKey(evt);
    setTimeout(() => searchString.value = '');
  }
}

function focusedItemActionIfSearchEmpty(action: 'change-down' | 'change-up' | 'move-down' | 'move-up' | 'toggle') {
  const context = selectedContext.value;
  if (!context) return;

  if (action === 'change-up') return changeFocusedItemInContext(context, 'up');
  if (action === 'change-down') return changeFocusedItemInContext(context, 'down');

  const item = focusedItem.value;
  if (!item) return;

  if (action === 'move-up') return moveItemInContext(context, item.title, 'up');
  if (action === 'move-down') return moveItemInContext(context, item.title, 'down');
  if (action === 'toggle') return toggleListItem(context, item.title);
}
</script>

<template>
  <v-container class="fill-height" fluid style="max-width: 100%">
    <div class="page-grid">
      <div class="bottom-of-grid">
        <v-autocomplete
          ref="userInput"
          v-model="selectedItem"
          v-model:search="searchString"
          autocomplete="off"
          autofocus
          auto-select-first
          hide-details
          hide-no-data
          :items
          item-title="title"
          label="Input"
          no-filter
          return-object
          style="max-width: 600px"
          variant="outlined"
          @keydown="doIfSearchEmpty($event)"
        />
      </div>

      <v-container class="fill-height">
        <v-row justify="space-around" style="overflow-y: auto">
          <v-col style="min-width: 200px">
            <!-- Sections -->
            <div class="text-overline">
              Sections
            </div>

            <div
              v-for="(section, sectionIndex) in grid.sections"
              :key="sectionIndex"
              class="mb-1"
              :class="section === grid.selectedSection ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'"
            >
              <EditAndDeleteButtons
                @click="selectSection(section)"
                @edit="editTitle(section, grid.sections)"
                @delete="deleteSection(section.title, storableNotes)"
              >
                {{ section.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>

          <v-col
            v-if="grid.selectedSection"
            style="min-width: 200px"
          >
            <div class="text-overline">
              Pages
            </div>

            <div
              v-for="(page, pageIndex) in grid.pages"
              :key="pageIndex"
              class="mb-1"
              :class="page === grid.selectedPage ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'"
            >
              <EditAndDeleteButtons
                @click="selectPage(page)"
                @edit="editTitle(page, grid.selectedSection.pages)"
                @delete="deletePage(page.title, grid.selectedSection)"
              >
                {{ page.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>

          <v-col
            v-if="grid.selectedPage"
            style="min-width: 200px"
          >
            <div class="text-overline">
              Contexts
            </div>

            <div
              v-for="(context, contextIndex) in grid.contexts"
              :key="contextIndex"
              class="mb-1"
              :class="context === grid.selectedContext ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'"
            >
              <EditAndDeleteButtons
                @click="selectContext(context)"
                @edit="editTitle(context, grid.selectedPage.contexts)"
                @delete="deleteContextFromPage(context.title, grid.selectedPage)"
              >
                {{ context.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <div style="overflow-y: auto">
        <div
          v-if="grid.selectedPage"
          style="display: grid; grid: auto / 1fr 1fr; gap: 16px"
        >
          <div v-for="(context, contextIndex) in grid.contexts" :key="contextIndex" class="mb-8">
            <v-card
              class="pa-3"
              :color="context === grid.selectedContext ? 'pink-lighten-1' : ''"
              variant="outlined"
            >
              <div
                class="mb-2 font-weight-bold"
              >
                <EditAndDeleteButtons
                  :show-delete-items="context.type === 'todo' && context.items.some(t => t.done)"
                  @edit="editTitle(context, grid.selectedPage.contexts)"
                  @click="selectContext(context)"
                  @delete="deleteContext(context.title, grid.selectedPage)"
                  @delete-items="removeDoneItemsFromContext(context)"
                >
                  {{ context.title }}
                </EditAndDeleteButtons>
              </div>

              <div v-if="context.type === 'todo'">
                <EditAndDeleteButtons
                  v-for="(item, itemIndex) in context.items"
                  :key="itemIndex"
                  :default-opacity="item.done ? '0.5' : undefined"
                  no-click-listener
                  @edit="editTitle(item, context.items)"
                  @delete="deleteContextItem(item.title, context)"
                >
                  <v-checkbox
                    v-model="item.done"
                    class="my-n1"
                    :class="{ 'font-weight-bold': item === grid.focusedItem }"
                    density="comfortable"
                    hide-details
                    :label="item.title"
                  >
                    <template #label="{ label }">
                      <div class="my-2">
                        {{ label }}
                      </div>
                    </template>
                  </v-checkbox>
                </EditAndDeleteButtons>
              </div>

              <component
                :is="context.type === 'unordered-list' ? 'ul' : 'ol'" v-else
                style="list-style-position: inside;"
              >
                <EditAndDeleteButtons
                  v-for="(item, itemIndex) in context.items"
                  :key="itemIndex"
                  no-click-listener
                  @edit="editTitle(item, context.items)"
                  @delete="deleteContextItem(item.title, context)"
                >
                  <li>{{ item.title }}</li>
                </EditAndDeleteButtons>
              </component>
            </v-card>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<style>
.page-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid: 1fr auto / 1fr 2fr;
  gap: 32px;
  max-height: 90vh;
}

.bottom-of-grid {
  align-self: end;
  grid-column: 1 / 4;
  grid-row: 2;
  width: 100%;
  max-width: 600px;
  justify-self: center;
}
</style>
