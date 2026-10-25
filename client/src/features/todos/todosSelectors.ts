import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export const selectTodos = (state: RootState) => state.todos.items;
export const selectFilter = (state: RootState) => state.todos.filter;
export const selectStatus = (state: RootState) => state.todos.status;
export const selectError = (state: RootState) => state.todos.error;

export const selectTodoById = (state: RootState, id: string) =>
  state.todos.items.find((todo) => todo.id === id);

export const selectVisibleTodos = createSelector([selectTodos, selectFilter], (todos, filter) => {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
});

export const selectActiveCount = createSelector(
  [selectTodos],
  (todos) => todos.filter((todo) => !todo.completed).length,
);

export const selectCompletedCount = createSelector(
  [selectTodos, selectActiveCount],
  (todos, activeCount) => todos.length - activeCount,
);
