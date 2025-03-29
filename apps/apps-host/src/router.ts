import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./components/HomePage.vue";
import SudokuContainer from '@sudoku/components/SudokuContainer.vue';
import MinesweeperContainer from '@minesweeper/components/MinesweeperContainer.vue';

const routes = [
    { path: '/', component: HomePage },
    { path: '/sudoku', component: SudokuContainer },
    { path: '/minesweeper', component: MinesweeperContainer },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
