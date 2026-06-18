<script setup lang="ts">
import type { Context, Page, SearchItem, Section, Todo } from '../data/NoteTaker.types';
import _ from 'lodash';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { NoteTaker } from '../data/NoteTaker';
import EditAndDeleteButtons from './EditAndDeleteButtons.vue';

const selectedItem = ref(null);

const route = useRoute();
const jsonFromQueryParam = route.query.notes_json;

const storedJSON = localStorage.getItem('notes_json');

const noteTaker = ref(NoteTaker.fromJSON(_.isString(jsonFromQueryParam) ? jsonFromQueryParam : storedJSON));

const grid = computed(() => {
  const { allSections, selectedSection, selectedPage, selectedContext } = noteTaker.value;
  return {
    sections: allSections,
    selectedSection,

    pages: selectedSection?.pages || [],
    selectedPage,

    contexts: selectedPage?.contexts || [],
    selectedContext,
  };
});

const items = ref<SearchItem[]>([]);
const searchString = ref('');

const getOrderedTodoItems = (items: Todo[]) => _.orderBy(items, 'done');

function selectSection(section: Section) {
  noteTaker.value.selectSection(section);
}
function selectPage(page: Page) {
  noteTaker.value.selectPage(page);
}
function selectContext(context: Context) {
  noteTaker.value.selectContext(context);
}

function editTitle(item: { title: string }) {
  const newTitle = window.prompt('New title', item.title) || '';
  if (newTitle)
    item.title = newTitle;
}
function deleteSection(section: Section) {
  if (!window.confirm(`Delete section ${section.title}?`))
    return;
  noteTaker.value.removeSection(section);
}
function deletePage(page: Page) {
  if (!window.confirm(`Delete page ${page.title}?`))
    return;
  noteTaker.value.removePage(page);
}
function deleteContext(context: Context) {
  if (!window.confirm(`Delete context ${context.title}?`))
    return;
  noteTaker.value.removeContext(context);
}
function deleteContextItem(item: Context['items'][0]) {
  if (!window.confirm(`Delete item ${item.title}?`))
    return;
  _.remove(grid.value.selectedContext?.items || [], i => i === item);
}
function deleteDoneContextItems(context: Context) {
  if (!window.confirm(`Delete done items in ${context.title}`))
    return;
  noteTaker.value.removeDoneFromContext(context);
}

watch(selectedItem, (v) => {
  if (!v)
    return;
  noteTaker.value.onSelect(v);
  selectedItem.value = null;
  searchString.value = '';
});
watch(searchString, v => items.value = noteTaker.value.getSearchItems(v));

function storeToLocalStorage() {
  setTimeout(() => {
    localStorage.setItem('notes_json', noteTaker.value.toJSON());
  });
}

watch(grid, storeToLocalStorage, { deep: true });

const input = useTemplateRef('userInput');
onMounted(() => {
  document.addEventListener('keydown', (event) => {
    if (event.isComposing)
      return;
    if (event.key === '/') {
      if (event.target instanceof HTMLInputElement && event.target?.type === 'text')
        return;
      if (input.value?.focus)
        input.value.focus();
      event.preventDefault();
    }
  });
});
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
              <EditAndDeleteButtons @click="selectSection(section)" @edit="editTitle(section)" @delete="deleteSection(section)">
                {{ section.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>

          <v-col style="min-width: 200px">
            <div class="text-overline">
              Pages
            </div>

            <div
              v-for="(page, pageIndex) in grid.pages"
              :key="pageIndex"
              class="mb-1"
              :class="page === grid.selectedPage ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'"
            >
              <EditAndDeleteButtons @click="selectPage(page)" @edit="editTitle(page)" @delete="deletePage(page)">
                {{ page.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>

          <v-col style="min-width: 200px">
            <div class="text-overline">
              Contexts
            </div>

            <div
              v-for="(context, contextIndex) in grid.contexts"
              :key="contextIndex"
              class="mb-1"
              :class="context === grid.selectedContext ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'"
            >
              <EditAndDeleteButtons @click="selectContext(context)" @edit="editTitle(context)" @delete="deleteContext(context)">
                {{ context.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <div style="overflow-y: auto">
        <div style="display: grid; grid: auto / 1fr 1fr; gap: 16px">
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
                  @edit="editTitle(context)" @click="selectContext(context)" @delete="deleteContext(context)" @delete-items="deleteDoneContextItems(context)"
                >
                  {{ context.title }}
                </EditAndDeleteButtons>
              </div>

              <div v-if="context.type === 'todo'">
                <EditAndDeleteButtons
                  v-for="(item, itemIndex) in getOrderedTodoItems(context.items)"
                  :key="itemIndex"
                  :default-opacity="item.done ? '0.5' : undefined"
                  no-click-listener
                  @edit="editTitle(item)"
                  @delete="deleteContextItem(item)"
                >
                  <v-checkbox
                    v-model="item.done"
                    class="my-n1"
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
                  @edit="editTitle(item)"
                  @delete="deleteContextItem(item)"
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
