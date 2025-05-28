<template>
  <v-container class="fill-height" fluid style="max-width: 100%">
    <div class="page-grid">
      <div class="bottom-of-grid">
        <v-autocomplete
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
          variant="outlined" />
      </div>

      <v-container class="fill-height">
        <v-row justify="space-around" style="overflow-y: scroll">
          <v-col style="min-width: 200px">
            <!-- Sections -->
            <div class="text-overline">Sections</div>

            <div
              v-for="section in grid.sections"
              class="mb-1"
              :class="section === grid.selectedSection ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'">
              <EditAndDeleteButtons @edit="editTitle(section)" @delete="deleteSection(section)">
                {{ section.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>

          <v-col style="min-width: 200px">
            <div class="text-overline">Pages</div>

            <div
              v-for="page in grid.pages"
              class="mb-1"
              :class="page === grid.selectedPage ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'">
              <EditAndDeleteButtons @edit="editTitle(page)" @delete="deletePage(page)">
                {{ page.title }}
              </EditAndDeleteButtons>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <div style="overflow-y: scroll">
        <div style="display: grid; grid: auto / 1fr 1fr; gap: 16px">
          <div v-for="context in grid.contexts" class="mb-8">
            <v-card
              class="pa-3"
              :color="context === grid.selectedContext ? 'pink-lighten-1' : ''"
              variant="outlined">
              <div
                class="mb-2 font-weight-bold">
                <EditAndDeleteButtons @edit="editTitle(context)" @delete="deleteContext(context)">
                  {{ context.title }}
                </EditAndDeleteButtons>
              </div>

              <div v-if="context.type === 'todo'">
                <EditAndDeleteButtons
                  v-for="item in context.items"
                  @edit="editTitle(item)"
                  @delete="deleteContextItem(item)">
                  <v-checkbox
                    v-model="item.done"
                    class="mt-n2"
                    density="comfortable"
                    hide-details
                    :label="item.title" />
                </EditAndDeleteButtons>
              </div>
              <component
                v-else :is="context.type === 'unordered-list' ? 'ul' : 'ol'"
                style="list-style-position: inside;">
                <EditAndDeleteButtons
                  v-for="item in context.items"
                  @edit="editTitle(item)"
                  @delete="deleteContextItem(item)">
                  <li>{{ item.title }}</li>
                </EditAndDeleteButtons>
              </component>
              <!-- <ul v-else-if="context.type === 'unordered-list'" style="list-style-position: inside;">
              </ul>
              <ol v-else-if="context.type === 'ordered-list'" style="list-style-position: inside;">
                <li v-for="item in context.items">
                <EditAndDeleteButtons>{{ item.title }}</EditAndDeleteButtons>
                </li>
              </ol> -->
            </v-card>
            </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NoteTaker } from '../data/NoteTaker';
import { Context, ListItem, Page, Section, Todo, type SearchItem } from '../data/NoteTaker.types';

import EditAndDeleteButtons from './EditAndDeleteButtons.vue';
import _ from 'lodash';

const selectedItem = ref(null);

const storedJSON = localStorage.getItem('notes_json');
const parsedJSON = (() => {
  if (!storedJSON) return undefined;
  try {
    return JSON.parse(storedJSON);
  } catch {
    return undefined;
  }
})();

const noteTaker = ref(new NoteTaker(parsedJSON));

const allSections = computed(() => noteTaker.value.allSections);
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

const editTitle = (item: { title: string }) => {
  const newTitle = window.prompt('New title', item.title) || '';
  if (newTitle) item.title = newTitle;
};
const deleteSection = (section: Section) => {
  if (!window.confirm(`Delete section ${section.title}?`)) return;
_.remove(noteTaker.value.allSections, s => s === section);
};
const deletePage = (page: Page) => {
  if (!window.confirm(`Delete page ${page.title}?`)) return;
  _.remove(grid.value.selectedSection?.pages || [], p => p === page);
};
const deleteContext = (context: Context) => {
  if (!window.confirm(`Delete context ${context.title}?`)) return;
  _.remove(grid.value.selectedPage?.contexts || [], c => c === context);
};
const deleteContextItem = (item: Context['items'][0]) => {
  if (!window.confirm(`Delete item ${item.title}?`)) return;
  _.remove(grid.value.selectedContext?.items || [], i => i === item);
};

watch(selectedItem, (v) => {
  if (!v) return;
  noteTaker.value.onSelect(v);
  selectedItem.value = null;
  searchString.value = '';
});
watch(searchString, v => items.value = noteTaker.value.getSearchItems(v));

watch(allSections, v => {
  setTimeout(() => {
    localStorage.setItem('notes_json', JSON.stringify(v));
  });
}, { deep: true });
</script>

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
