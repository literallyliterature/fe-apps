import { createRouter, createWebHashHistory } from "vue-router";
import HomePage from "./components/HomePage.vue";
import SudokuContainer from '@sudoku/components/SudokuContainer.vue';
import MinesweeperContainer from '@minesweeper/components/MinesweeperContainer.vue';
import NotesContainer from "@note-taker/components/NotesContainer.vue";

const routes = [
    { path: '/', component: HomePage },
    { path: '/sudoku', component: SudokuContainer },
    { path: '/minesweeper', component: MinesweeperContainer },
    { path: '/notes', component: NotesContainer },
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
