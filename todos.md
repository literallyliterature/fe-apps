# TODOs

## Behaviour TODOs

- [ ] Add ability to move contexts between each other
- [ ] Add ability to move context to different page
- [ ] Templates
- [ ] Coverage tests
- [ ] Add command to "seed" data
- [ ] Browser tests
- [ ] Try implementing items using linked lists instead of arrays (to simplify moving up and down?)

## UI improvements

- [ ] Separate NotesContainer into different components
- [ ] Ability to collapse contexts

## Notes taker organisation

1. Simple visual layer which basically just shows data and calls simple functions based on user interactions
2. Reactive layer which keeps track of the current state of the data + current displayed information
	1. This layer needs to act as a simple intermediary between visuals and operations on the data
	2. This layer can have tests related to reactive calculations
  3. Might be best to have functions which are then used in the store instead of directly the store
3. Operations on the data
	1. These need to have thorough tests
	2. Might be good to actually separate by file to make it really easy to find operations
4. [ ] Raw data
	1. Zod schema -> Types

