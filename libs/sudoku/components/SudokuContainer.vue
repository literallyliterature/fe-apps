<script lang="ts">
import {
  cloneDeep,
  flatten,
  flattenDeep,
  uniqBy,
} from 'lodash';
import { computed, defineComponent, ref, useTemplateRef } from 'vue';

import type {
  CellRange,
  SudokuCell as SudokuCellType,
  UserInputValueRange,
  ValueRange,
} from '../data/sudoku.utils';

import {
  createGame,
  extractSudokuCells,
} from '../data/sudoku.utils';
import SudokuCell from './SudokuCell.vue';
import SudokuControls from './SudokuControls.vue';

interface CheckMistakesInput {
  colIndex: number
  rowIndex: number
  squareCol: number
  squareRow: number
}
interface InputRowAndCol {
  col: CellRange | undefined
  row: CellRange | undefined
}
interface SavedState {
  cells: SudokuCellType[][]
  label: string
}
interface SudokuGame {
  cells: SudokuCellType[][]
  difficulty: SudokuGameDifficulty
  focusedCol: CellRange | undefined
  focusedRow: CellRange | undefined
  gameString: string
  originalsString: string
}
type SudokuGameDifficulty = 'easy' | 'expert' | 'hard' | 'medium';
type UserAction = 'del' | 'remove-focus' | UserActionArrow | UserActionDiagonals | ValueRange;
type UserActionArrow = 'down' | 'left' | 'right' | 'up';
type UserActionDiagonals = 'down-left' | 'down-right' | 'up-left' | 'up-right';

export default defineComponent({
  name: 'SudokuContainer',
  components: {
    SudokuCell,
    SudokuControls,
  },
  setup() {
    const game = ref<null | SudokuGame>(null);
    const gameStatus = ref<'completed' | 'started' | 'uninitialised'>('uninitialised');
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
      if (!game.value)
        return [];
      return flatten(game.value.cells);
    });

    const allRows = computed(() => {
      if (!game.value)
        return [];
      return game.value.cells;
    });

    const allCols = computed(() => {
      if (!game.value)
        return [];
      const newArr: SudokuCellType[][] = [];
      flattenedCells.value.forEach((cell) => {
        if (!newArr[cell.column])
          newArr[cell.column] = [];
        newArr[cell.column].push(cell);
      });
      return newArr;
    });

    const allSquares = computed(() => {
      if (!game.value)
        return [];
      const newArr: SudokuCellType[][] = [];
      flattenedCells.value.forEach((cell) => {
        if (!newArr[cell.square])
          newArr[cell.square] = [];
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
        if (!cells[cell.row])
          cells[cell.row] = [];
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
      if (!game.value || !savedRedoStates.value.length)
        return;

      saveUndoState(false);
      const restoredCells = savedRedoStates.value.pop();
      if (restoredCells)
        restoreState(restoredCells.cells);
    };

    const restoreState = (cells: SudokuCellType[][]): void => {
      if (game.value)
        game.value.cells = cloneDeep(cells);
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
      if (!label)
        return;

      savedStates.value.push({
        cells: cloneDeep(game.value?.cells) || [],
        label,
      });
    };

    const saveUndoState = (clearRedos = true): void => {
      savedUndoStates.value.push({
        cells: cloneDeep(game.value?.cells) || [],
        label: (new Date()).toString(),
      });
      if (clearRedos)
        savedRedoStates.value = [];
    };

    const undoState = (): void => {
      if (!game.value || !savedUndoStates.value.length)
        return;

      savedRedoStates.value.push({
        cells: cloneDeep(game.value?.cells) || [],
        label: (new Date()).toString(),
      });
      const restoredCells = savedUndoStates.value.pop();
      if (restoredCells)
        restoreState(restoredCells.cells);
    };

    const setFocusedRowAndCol = ({ col, row }: InputRowAndCol): void => {
      if (game.value && col !== undefined)
        game.value.focusedCol = col;
      if (game.value && row !== undefined)
        game.value.focusedRow = row;

      const ref = useTemplateRef(`cell-${game.value?.focusedRow}-${game.value?.focusedCol}`);
      const f = ref?.[0]?.focus;
      if (f)
        f();
    };

    const triggerKeyPress = (e: KeyboardEvent): void => {
      const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

      const { key } = e;

      const keyToActionMapping = {
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        Backspace: 'del',
        Delete: 'del',
      };

      if (numberKeys.includes(key))
        triggerUserAction(key as UserAction, e?.ctrlKey);
      // @ts-expect-error asdf
      if (keyToActionMapping[key])
        triggerUserAction(keyToActionMapping[key] as UserAction);
    };

    const triggerUserAction = (action: UserAction, ctrlKey: boolean): void => {
      if (!game.value)
        return;

      const {
        cells,
        focusedCol,
        focusedRow,
      } = game.value;
      if (focusedRow === undefined || focusedCol === undefined)
        return;

      const currentCell = cells[focusedRow][focusedCol];

      if (action === 'remove-focus') {
        game.value.focusedCol = undefined;
        game.value.focusedRow = undefined;
      } else if (action === 'left') {
        setFocusedRowAndCol({ col: Math.max((focusedCol - 1), 0) as CellRange } as InputRowAndCol);
      } else if (action === 'up') {
        setFocusedRowAndCol({ row: Math.max((focusedRow - 1), 0) as CellRange } as InputRowAndCol);
      } else if (action === 'right') {
        setFocusedRowAndCol({ col: Math.min((focusedCol + 1), 8) as CellRange } as InputRowAndCol);
      } else if (action === 'down') {
        setFocusedRowAndCol({ row: Math.min((focusedRow + 1), 8) as CellRange } as InputRowAndCol);
      } else if (action === 'del') {
        if (currentCell.userInput !== currentCell.original)
          saveUndoState();
        currentCell.notedNumbers = {};
        currentCell.userInput = currentCell.original;
        if (mistakesToShow.value.length)
          checkForMistakes();
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(action)) {
        const setNotes = inNotesMode.value ? !ctrlKey : !!ctrlKey;

        if (gameStatus.value !== 'completed' && currentCell.original === ' ') {
          if (!setNotes) {
            if (currentCell.userInput !== action) {
              saveUndoState();
              currentCell.userInput = action as UserInputValueRange;
              checkIfGameIsCompleted();
              if (mistakesToShow.value.length)
                checkForMistakes();
              removeAdjacentNotes(currentCell);
            }
          } else if (currentCell.userInput === ' ') {
            currentCell.notedNumbers = {
              ...currentCell.notedNumbers,
              [action]: !currentCell.notedNumbers[action],
            };
          }
        }
      } else if (['down-left', 'down-right', 'up-left', 'up-right'].includes(action)) {
        const actions = action.split('-');
        actions.forEach(a => triggerUserAction(a as UserActionDiagonals, ctrlKey));
      }

      setFocusedRowAndCol({} as InputRowAndCol);
    };

    const checkIfGameIsCompleted = (): void => {
      if (flattenedCells.value.every(cell => cell.correctValue === cell.userInput)) {
        gameStatus.value = 'completed';
        showingSnackbar.value = true;
      }
    };

    const checkForMistakes = (): void => {
      const flattenedMistakes = flattenedCells.value.filter(cell => cell.userInput !== cell.original
        && cell.correctValue !== cell.userInput)
        .map(cell => ({ col: cell.column, row: cell.row }));
      mistakesToShow.value = uniqBy(flattenedMistakes, ({ col, row }) => `${row}-${col}`);
    };

    const checkIfCellHasAMistake = ({
      colIndex,
      rowIndex,
      squareCol,
      squareRow,
    }: CheckMistakesInput): boolean => {
      const c = getColIndex(squareCol, colIndex);
      const r = getRowIndex(squareRow, rowIndex);
      return mistakesToShow.value.some(({ col, row }) => row === r && col === c);
    };

    const removeAdjacentNotes = (cell: SudokuCellType): void => {
      const enteredValue = cell.userInput;
      if (!enteredValue)
        return;

      const allAdjacentCells = [
        ...allRows.value[cell.row],
        ...allCols.value[cell.column],
        ...allSquares.value[cell.square],
      ];
      const flattenedCells = flattenDeep(allAdjacentCells);
      flattenedCells.forEach((c) => {
        c.notedNumbers[enteredValue] = false;
      });
    };

    return {
      allCols,
      allRows,
      allSquares,
      checkForMistakes,
      checkIfCellHasAMistake,
      checkIfGameIsCompleted,
      flattenedCells,
      game,
      gameStatus,
      getColIndex,
      getRowIndex,
      initialiseGame,
      inNotesMode,
      mistakesToShow,
      newSaveStateLabel,
      redoState,
      removeAdjacentNotes,
      resetSaveInput,
      restoreState,
      saveCurrentState,
      savedRedoStates,
      savedStates,
      savedUndoStates,
      saveState,
      saveUndoState,
      selectedDifficulty,
      setFocusedRowAndCol,
      showingMenu,
      showingSnackbar,
      showNewSaveInput,
      snackbarColour,
      snackbarText,
      triggerKeyPress,
      triggerUserAction,
      undoState,
    };
  },
});
</script>

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
                    :is-focused="getRowIndex(squareRow, rowIndex) === game.focusedRow
                      && getColIndex(squareCol, colIndex) === game.focusedCol"
                    :is-game-complete="gameStatus === 'completed'"
                    :mistake="checkIfCellHasAMistake({
                      squareRow, rowIndex, squareCol, colIndex,
                    })"
                    @focused="setFocusedRowAndCol"
                    @key-pressed="triggerKeyPress"
                  />
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </div>

      <SudokuControls
        v-if="gameStatus === 'started'"
        v-model:in-notes-mode="inNotesMode"
        class="mt-12"
        :disable-undo-button="!savedUndoStates.length"
        @action="triggerUserAction"
        @undo="undoState"
      />
    </v-col>

    <v-col v-if="gameStatus === 'completed'" cols="12" />

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
              v-model="newSaveStateLabel"
              autofocus
              hide-details
              label="Save state as"
              @blur="saveState"
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
