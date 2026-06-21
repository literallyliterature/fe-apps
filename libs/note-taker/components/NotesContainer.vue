<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { constArrayIncludes } from 'utils';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Context, Page, Section, StorableNotes } from '../data/NoteTaker.types.ts';
import type { SearchItem } from '../data/search-results.ts';

import {
  changeFocusedItemInContext,
  changeSelectedPageInSection,
  convertToExportableJSON,
  deleteContextFromPage,
  deleteItemFromContext,
  deletePageFromSection,
  deleteSectionFromStorableNotes,
  editTitle,
  moveItemInContext,
  removeDoneItemsFromContext,
  selectContextInPage,
  selectPageInSection,
  selectSectionInStorableNotes,
  toggleListItem,
} from '../data/commands.ts';
import { useNoteTakerStore } from '../data/note-taker.store.ts';
import EditAndDeleteButtons from './EditAndDeleteButtons.vue';

const noteTakerStore = useNoteTakerStore();
const { focusedItem, selectedContext, selectedPage, selectedSection, storableNotes } = storeToRefs(noteTakerStore);

const route = useRoute();
noteTakerStore.mergeNotesFromQuery(route.query.notes_json ? String(route.query.notes_json) : undefined);

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

watch(() => selectedContext.value?.title, (newContextTitle) => {
  if (!newContextTitle) return;
  const el = document.getElementById(`context-card--${newContextTitle}`);
  el?.scrollIntoView();
}, { immediate: true });

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
  'ArrowLeft',
  'ArrowRight',
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
  } else if (evt.key === 'ArrowLeft') {
    if (evt.altKey && selectedSection.value) changeSelectedPageInSection(selectedSection.value, 'up');
  } else if (evt.key === 'ArrowRight') {
    if (evt.altKey && selectedSection.value) changeSelectedPageInSection(selectedSection.value, 'down');
  } else if (evt.key === ' ' || evt.key === 'Enter') {
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
      <div class="d-flex justify-space-between ga-8" style="width: 100%; align-self: start; margin-top: -16px">
        <div style="width: 150px">
          <div class="text-overline d-flex align-center ga-2">
            Section

            <v-icon
              class="mt-n1"
              icon="fa-solid fa-caret-down"
              size="small"
            />
          </div>

          <div v-if="selectedSection" class="font-weight-bold text-pink-lighten-1">
            {{ selectedSection.title }}
          </div>

          <v-menu activator="parent" :close-on-content-click="false">
            <v-card class="px-4 py-2">
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
            </v-card>
          </v-menu>
        </div>

        <div v-if="selectedSection">
          <v-tabs
            v-model="selectedSection.activePageTitle"
            align-tabs="center"
            color="pink-lighten-1"
            density="compact"
            @change="selectPageInSection(selectedSection, $event)"
          >
            <v-tab
              v-for="page in selectedSection.pages"
              :key="page.title"
              :value="page.title"
            >
              {{ page.title }}
            </v-tab>
          </v-tabs>
        </div>

        <div v-if="selectedSection" style="width: 150px">
          <div class="text-overline d-flex align-center ga-2">
            Page

            <v-icon
              class="mt-n1"
              icon="fa-solid fa-caret-down"
              size="small"
            />
          </div>

          <div v-if="selectedPage" class="font-weight-bold text-pink-lighten-1">
            {{ selectedPage.title }}
          </div>

          <v-menu activator="parent" :close-on-content-click="false">
            <v-card class="px-4 py-2">
              <div
                v-for="(page, pageIndex) in grid.pages"
                :key="pageIndex"
                class="mb-1"
                :class="page === grid.selectedPage ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'"
              >
                <EditAndDeleteButtons
                  @click="selectPage(page)"
                  @edit="editTitle(page, selectedSection.pages)"
                  @delete="deletePage(page.title, selectedSection)"
                >
                  {{ page.title }}
                </EditAndDeleteButtons>
              </div>
            </v-card>
          </v-menu>
        </div>
      </div>

      <div style="overflow-y: auto" class="text-body-2">
        <div
          v-if="grid.selectedPage"
          class="d-flex justify-space-around ga-4 flex-wrap mx-auto"
          style="max-width: 1500px"
        >
          <div
            v-for="(context, contextIndex) in grid.contexts"
            :key="contextIndex"
            class="mb-8"
            style="flex: none; width: 300px"
          >
            <v-card
              :id="`context-card--${context.title}`"
              class="px-3 py-2"
              :color="context === grid.selectedContext ? 'pink-lighten-1' : ''"
              variant="outlined"
            >
              <div
                class="font-weight-bold"
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
                      <div class="my-2 text-body-2">
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
                  <li :class="{ 'font-weight-bold': item === grid.focusedItem }">
                    {{ item.title }}
                  </li>
                </EditAndDeleteButtons>
              </component>
            </v-card>
          </div>
        </div>
      </div>

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
    </div>
  </v-container>
</template>

<style>
.page-grid {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 32px;
  max-height: 90vh;
}

.bottom-of-grid {
  align-self: end;
  width: 100%;
  max-width: 600px;
  justify-self: center;
}
</style>
