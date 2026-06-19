import MinesweeperContainer from '@minesweeper/components/MinesweeperContainer.vue';
import NotesContainer from '@note-taker/components/NotesContainer.vue';
import SudokuContainer from '@sudoku/components/SudokuContainer.vue';
import { createRouter, createWebHashHistory } from 'vue-router';

import HomePage from './components/HomePage.vue';

const routes = [
  { component: HomePage, path: '/' },
  { component: SudokuContainer, path: '/sudoku' },
  { component: MinesweeperContainer, path: '/minesweeper' },
  { component: NotesContainer, path: '/notes' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
