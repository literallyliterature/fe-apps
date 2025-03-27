<template>
  <v-row justify="center" no-gutters style="max-width: 400px; margin: auto">
    <v-col v-if="game && (gameStatus === 'started' || gameStatus === 'completed')" cols="auto">
      <div style="margin: 1px">
        <v-row v-for="squareRow in 3" :key="squareRow" no-gutters>
          <v-col v-for="squareCol in 3" :key="squareCol" cols="auto" no-gutters>
            <div style="margin: 1px">
              <v-row v-for="rowIndex in 3" :key="rowIndex" no-gutters>
                <v-col v-for="colIndex in 3" :key="colIndex">
                  <SudokuCell
                    :ref="`cell-${getRowIndex(squareRow, rowIndex)}-${getColIndex(squareCol, colIndex)}`"
                    :cell="game.cells[getRowIndex(squareRow, rowIndex)][getColIndex(squareCol, colIndex)]"
                    :is-focused="getRowIndex(squareRow, rowIndex) === game.focusedRow &&
                    getColIndex(squareCol, colIndex) === game.focusedCol"
                    :is-game-complete="gameStatus === 'completed'"
                    :mistake="checkIfCellHasAMistake({
                      squareRow, rowIndex, squareCol, colIndex,
                    })"
                    @focused="setFocusedRowAndCol"
                    @keyPressed="triggerKeyPress"
                  />
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </div>

      <SudokuControls
        v-if="gameStatus === 'started'"
        class="mt-12"
        :disable-undo-button="!savedUndoStates.length"
        v-model:in-notes-mode="inNotesMode"
        @action="triggerUserAction"
        @undo="undoState"
      />
    </v-col>

    <v-col cols="12" v-if="gameStatus === 'completed'" />

    <v-col v-if="gameStatus !== 'started'" cols="auto" class="mt-12">
      <v-chip-group v-model="selectedDifficulty" color="primary" column mandatory>
        <v-chip
          v-for="difficulty in ['easy', 'medium', 'hard', 'expert']"
          :key="difficulty"
          variant="outlined"
          :value="difficulty"
          v-text="difficulty"
        />
      </v-chip-group>

      <v-btn block class="mt-4" color="primary darken-3" size="small" @click="initialiseGame(selectedDifficulty)">
        Start
      </v-btn>
    </v-col>

    <v-col v-if="gameStatus === 'started'" class="mt-6" cols="8">
      <v-btn block color="secondary" variant="outlined" @click="checkForMistakes">
        Check for mistakes
      </v-btn>
    </v-col>

    <v-col v-if="gameStatus === 'started'" class="mt-6" cols="8">
      <v-menu
        v-model="showingMenu"
        bottom
        :close-on-content-click="false"
        offset-y
        @input="resetSaveInput"
      >
        <template #activator="{ props }">
          <v-btn block color="secondary" variant="outlined" v-bind="props">
            Save states
          </v-btn>
        </template>

        <v-card color="pink-lighten-5" min-width="150px">
          <div v-if="!showNewSaveInput" class="text-left pa-4" :class="savedStates.length ? 'pb-0' : ''">
            <button class="pb-3" @click="showNewSaveInput = true">
              <a class="text-body-2">
                Save current state
              </a>
            </button>
          </div>
          <v-form v-else class="pa-2 pl-4 pb-4" @submit.prevent="saveState">
            <v-text-field
              autofocus
              hide-details
              label="Save state as"
              @blur="saveState"
              v-model="newSaveStateLabel"
            />
          </v-form>

          <v-list v-if="savedStates.length" color="primary" density="compact">
            <v-list-item v-for="(savedState, index) in savedStates" :key="index" @click="restoreState(savedState.cells)">
              {{ savedState.label }}
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-col>

    <v-fade-transition>
      <v-col v-if="gameStatus === 'started' && savedRedoStates.length" class="mt-6" cols="8">
        <v-btn block color="secondary" variant="outlined" @click="redoState">
          Redo
        </v-btn>
      </v-col>
    </v-fade-transition>

    <v-snackbar v-model="showingSnackbar" class="mb-8" :color="snackbarColour" location="bottom">
      {{ snackbarText }}
    </v-snackbar>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, computed, useTemplateRef } from 'vue';
import {
  cloneDeep, flatten, flattenDeep, uniqBy,
} from 'lodash';
import {
  CellRange,
  createGame,
  extractSudokuCells,
  SudokuCell as SudokuCellType,
  UserInputValueRange,
  ValueRange,
} from '../data/sudoku.utils';
import SudokuCell from './SudokuCell.vue';
import SudokuControls from './SudokuControls.vue';

type SudokuGameDifficulty = 'easy'|'medium'|'hard'|'expert';
type UserActionArrow = 'left'|'up'|'right'|'down';
type UserActionDiagonals = 'up-left'|'up-right'|'down-left'|'down-right';
type UserAction = UserActionArrow|UserActionDiagonals|ValueRange|'del'|'remove-focus';
interface SavedState {
  cells: SudokuCellType[][],
  label: string,
}
interface SudokuGame {
  cells: SudokuCellType[][],
  difficulty: SudokuGameDifficulty,
  focusedCol: undefined|CellRange,
  focusedRow: undefined|CellRange,
  gameString: string,
  originalsString: string,
}
interface InputRowAndCol {
  row: undefined|CellRange,
  col: undefined|CellRange
}
interface CheckMistakesInput {
  squareRow: number,
  squareCol: number,
  colIndex: number,
  rowIndex: number,
}

export default defineComponent({
  name: 'SudokuContainer',
  components: {
    SudokuCell,
    SudokuControls,
  },
  setup() {
    const game = ref<null | SudokuGame>(null);
    const gameStatus = ref<'uninitialised' | 'started' | 'completed'>('uninitialised');
    const inNotesMode = ref(false);
    const mistakesToShow = ref<InputRowAndCol[]>([]);
    const newSaveStateLabel = ref('');
    const savedStates = ref<SavedState[]>([]);
    const savedRedoStates = ref<SavedState[]>([]);
    const savedUndoStates = ref<SavedState[]>([]);
    const selectedDifficulty = ref<SudokuGameDifficulty>('easy');
    const showingMenu = ref(false);
    const showingSnackbar = ref(false);
    const showNewSaveInput = ref(false);
    const snackbarColour = ref('primary');
    const snackbarText = ref('Woot woot! Great job!');

    const flattenedCells = computed(() => {
      if (!game.value) return [];
      return flatten(game.value.cells);
    });

    const allRows = computed(() => {
      if (!game.value) return [];
      return game.value.cells;
    });

    const allCols = computed(() => {
      if (!game.value) return [];
      const newArr: SudokuCellType[][] = [];
      flattenedCells.value.forEach((cell) => {
        if (!newArr[cell.column]) newArr[cell.column] = [];
        newArr[cell.column].push(cell);
      });
      return newArr;
    });

    const allSquares = computed(() => {
      if (!game.value) return [];
      const newArr: SudokuCellType[][] = [];
      flattenedCells.value.forEach((cell) => {
        if (!newArr[cell.square]) newArr[cell.square] = [];
        newArr[cell.square].push(cell);
      });
      return newArr;
    });

    const getColIndex = (squareCol: number, cellCol: number): number => {
      return 3 * (squareCol - 1) + (cellCol - 1);
    };

    const getRowIndex = (squareRow: number, cellRow: number): number => {
      return 3 * (squareRow - 1) + (cellRow - 1);
    };

    const initialiseGame = (difficulty: SudokuGameDifficulty): void => {
      const newGame = createGame(difficulty);
      const gameString = newGame.solution;
      const originalsString = newGame.puzzle.replaceAll('-', ' ');
      const cellsFlatArray = extractSudokuCells({
        gameString,
        originalsString,
      });
      const cells: SudokuCellType[][] = [];

      cellsFlatArray.forEach((cell) => {
        if (!cells[cell.row]) cells[cell.row] = [];
        cells[cell.row][cell.column] = cell;
      });

      gameStatus.value = 'started';
      game.value = {
        cells,
        difficulty,
        focusedCol: undefined,
        focusedRow: undefined,
        gameString,
        originalsString,
      };
      savedStates.value = [];
      savedRedoStates.value = [];
      savedUndoStates.value = [];
      mistakesToShow.value = [];

      saveCurrentState('Beginning');
    };

    const redoState = (): void => {
      if (!game.value || !savedRedoStates.value.length) return;

      saveUndoState(false);
      const restoredCells = savedRedoStates.value.pop();
      if (restoredCells) restoreState(restoredCells.cells);
    };

    const restoreState = (cells: SudokuCellType[][]): void => {
      if (game.value) game.value.cells = cloneDeep(cells);
    };

    const resetSaveInput = (): void => {
      showNewSaveInput.value = false;
      newSaveStateLabel.value = '';
    };

    const saveState = (): void => {
      saveCurrentState(newSaveStateLabel.value);
      resetSaveInput();
      showingMenu.value = false;
    };

    const saveCurrentState = (label: string = newSaveStateLabel.value): void => {
      if (!label) return;

      savedStates.value.push({
        label,
        cells: cloneDeep(game.value?.cells) || [],
      });
    };

    const saveUndoState = (clearRedos = true): void => {
      savedUndoStates.value.push({
        label: (new Date()).toString(),
        cells: cloneDeep(game.value?.cells) || [],
      });
      if (clearRedos) savedRedoStates.value = [];
    };

    const undoState = (): void => {
      if (!game.value || !savedUndoStates.value.length) return;

      savedRedoStates.value.push({
        label: (new Date()).toString(),
        cells: cloneDeep(game.value?.cells) || [],
      });
      const restoredCells = savedUndoStates.value.pop();
      if (restoredCells) restoreState(restoredCells.cells);
    };

    const setFocusedRowAndCol = ({ row, col }: InputRowAndCol): void => {
      if (game.value && col !== undefined) game.value.focusedCol = col;
      if (game.value && row !== undefined) game.value.focusedRow = row;

      const ref = useTemplateRef(`cell-${game.value?.focusedRow}-${game.value?.focusedCol}`);
      const f = ref?.[0]?.focus;
      if (f) f();
    };

    const triggerKeyPress = (e: KeyboardEvent): void => {
      const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

      const { key } = e;

      const keyToActionMapping = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        Backspace: 'del',
        Delete: 'del',
      };

      if (numberKeys.includes(key)) triggerUserAction(key as UserAction, e?.ctrlKey);
      // @ts-expect-error asdf
      if (keyToActionMapping[key]) triggerUserAction(keyToActionMapping[key] as UserAction);
    };

    const triggerUserAction = (action: UserAction, ctrlKey: boolean): void => {
      if (!game.value) return;

      const {
        cells, focusedRow, focusedCol,
      } = game.value;
      if (focusedRow === undefined || focusedCol === undefined) return;

      const currentCell = cells[focusedRow][focusedCol];

      if (action === 'remove-focus') {
        game.value.focusedCol = undefined;
        game.value.focusedRow = undefined;
      } else if (action === 'left') setFocusedRowAndCol({ col: Math.max((focusedCol - 1), 0) as CellRange } as InputRowAndCol); // eslint-disable-line max-len
      else if (action === 'up') setFocusedRowAndCol({ row: Math.max((focusedRow - 1), 0) as CellRange } as InputRowAndCol); // eslint-disable-line max-len
      else if (action === 'right') setFocusedRowAndCol({ col: Math.min((focusedCol + 1), 8) as CellRange } as InputRowAndCol); // eslint-disable-line max-len
      else if (action === 'down') setFocusedRowAndCol({ row: Math.min((focusedRow + 1), 8) as CellRange } as InputRowAndCol); // eslint-disable-line max-len
      else if (action === 'del') {
        if (currentCell.userInput !== currentCell.original) saveUndoState();
        currentCell.notedNumbers = {};
        currentCell.userInput = currentCell.original;
        if (mistakesToShow.value.length) checkForMistakes();
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(action)) {
        const setNotes = inNotesMode.value ? !ctrlKey : !!ctrlKey;

        if (gameStatus.value !== 'completed' && currentCell.original === ' ') {
          if (!setNotes) {
            if (currentCell.userInput !== action) {
              saveUndoState();
              currentCell.userInput = action as UserInputValueRange;
              checkIfGameIsCompleted();
              if (mistakesToShow.value.length) checkForMistakes();
              removeAdjacentNotes(currentCell);
            }
          } else if (currentCell.userInput === ' ') {
            currentCell.notedNumbers = {
              ...currentCell.notedNumbers,
              [action]: !currentCell.notedNumbers[action],
            };
          }
        }
      } else if (['up-left', 'up-right', 'down-left', 'down-right'].includes(action)) {
        const actions = action.split('-');
        actions.forEach((a) => triggerUserAction(a as UserActionDiagonals, ctrlKey));
      }

      setFocusedRowAndCol({} as InputRowAndCol);
    };

    const checkIfGameIsCompleted = (): void => {
      if (flattenedCells.value.every((cell) => cell.correctValue === cell.userInput)) {
        gameStatus.value = 'completed';
        showingSnackbar.value = true;
      }
    };

    const checkForMistakes = (): void => {
      const flattenedMistakes = flattenedCells.value.filter((cell) => cell.userInput !== cell.original
        && cell.correctValue !== cell.userInput)
        .map((cell) => ({ row: cell.row, col: cell.column }));
      mistakesToShow.value = uniqBy(flattenedMistakes, ({ row, col }) => `${row}-${col}`);
    };

    const checkIfCellHasAMistake = ({
      squareRow, squareCol, colIndex, rowIndex,
    }: CheckMistakesInput): boolean => {
      const c = getColIndex(squareCol, colIndex);
      const r = getRowIndex(squareRow, rowIndex);
      return mistakesToShow.value.some(({ row, col }) => row === r && col === c);
    };

    const removeAdjacentNotes = (cell: SudokuCellType): void => {
      const enteredValue = cell.userInput;
      if (!enteredValue) return;

      const allAdjacentCells = [
        ...allRows.value[cell.row],
        ...allCols.value[cell.column],
        ...allSquares.value[cell.square],
      ];
      const flattenedCells = flattenDeep(allAdjacentCells);
      flattenedCells.forEach((c) => {
        c.notedNumbers[enteredValue] = false; // eslint-disable-line no-param-reassign
      });
    };

    return {
      game,
      gameStatus,
      inNotesMode,
      mistakesToShow,
      newSaveStateLabel,
      savedStates,
      savedRedoStates,
      savedUndoStates,
      selectedDifficulty,
      showingMenu,
      showingSnackbar,
      showNewSaveInput,
      snackbarColour,
      snackbarText,
      flattenedCells,
      allRows,
      allCols,
      allSquares,
      getColIndex,
      getRowIndex,
      initialiseGame,
      redoState,
      restoreState,
      resetSaveInput,
      saveState,
      saveCurrentState,
      saveUndoState,
      undoState,
      setFocusedRowAndCol,
      triggerKeyPress,
      triggerUserAction,
      checkIfGameIsCompleted,
      checkForMistakes,
      checkIfCellHasAMistake,
      removeAdjacentNotes,
    };
  },
});
</script>
