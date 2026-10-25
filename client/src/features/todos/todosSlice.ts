import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Todo, TodoFilter } from './types';

export interface TodosState {
  items: Todo[];
  filter: TodoFilter;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export const initialState: TodosState = {
  items: [],
  filter: 'all',
  status: 'idle',
  error: null,
};

/*
 * `*Requested` actions are commands picked up by todosSaga, which calls the API
 * and dispatches the matching result action. Most of them change no state.
 */
const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    fetchTodosRequested(state) {
      state.status = 'loading';
      state.error = null;
    },
    fetchTodosSucceeded(state, action: PayloadAction<Todo[]>) {
      state.status = 'succeeded';
      state.items = action.payload;
    },
    fetchTodosFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },

    addTodoRequested(_state, _action: PayloadAction<string>) {},
    toggleTodoRequested(_state, _action: PayloadAction<string>) {},
    deleteTodoRequested(_state, _action: PayloadAction<string>) {},
    clearCompletedRequested() {},

    todoAdded(state, action: PayloadAction<Todo>) {
      state.items.push(action.payload);
    },
    todoUpdated(state, action: PayloadAction<Todo>) {
      const index = state.items.findIndex((todo) => todo.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    todosRemoved(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload);
      state.items = state.items.filter((todo) => !ids.has(todo.id));
    },

    requestFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    errorDismissed(state) {
      state.error = null;
    },
    filterChanged(state, action: PayloadAction<TodoFilter>) {
      state.filter = action.payload;
    },
  },
});

export const {
  fetchTodosRequested,
  fetchTodosSucceeded,
  fetchTodosFailed,
  addTodoRequested,
  toggleTodoRequested,
  deleteTodoRequested,
  clearCompletedRequested,
  todoAdded,
  todoUpdated,
  todosRemoved,
  requestFailed,
  errorDismissed,
  filterChanged,
} = todosSlice.actions;

export const todosReducer = todosSlice.reducer;
