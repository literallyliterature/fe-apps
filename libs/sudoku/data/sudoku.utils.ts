export { getSudoku as createGame } from 'sudoku-gen';

export type CellRange = 0|1|2|3|4|5|6|7|8;
export type ValueRange = '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9';
export type UserInputValueRange = ValueRange|' ';
export type SudokuCell = {
  column: CellRange,
  correctValue: ValueRange,
  focused: boolean,
  index: number,
  notedNumbers: { [key: string]: boolean },
  original: UserInputValueRange,
  row: CellRange,
  showAsError: boolean,
  square: CellRange, // starting with 0|1|2 in the top row
  userInput: UserInputValueRange,
};
export type GameStatus = {
  duplicates?: SudokuCell[],
  mistakes?: SudokuCell[],
  complete?: boolean,
};

export function calculateColumnFromIndex(index: number): CellRange {
  return index % 9 as CellRange;
}

export function calculateRowFromIndex(index: number): CellRange {
  return Math.floor(index / 9) as CellRange;
}

export function calculateSquareFromIndex(index: number): CellRange {
  const column = calculateColumnFromIndex(index);
  const row = calculateRowFromIndex(index);
  const { floor } = Math;
  return ((3 * floor(row / 3)) + floor(column / 3)) as CellRange;
}

export function calculateIndexFromRowAndCol(row: number, col: number): number {
  return 9 * row + col;
}

export function extractSudokuCells({
  gameString,
  originalsString,
}: {
  gameString: string,
  originalsString: string,
}): SudokuCell[] {
  return gameString.split('').map((correctValue, index) => ({
    column: calculateColumnFromIndex(index),
    focused: false,
    index,
    notedNumbers: {},
    original: originalsString[index] as UserInputValueRange,
    row: calculateRowFromIndex(index),
    showAsError: false,
    square: calculateSquareFromIndex(index),
    correctValue: correctValue as ValueRange,
    userInput: originalsString[index] as UserInputValueRange,
  }));
}
