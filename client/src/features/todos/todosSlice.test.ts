import { describe, expect, it } from 'vitest';
import {
  fetchTodosFailed,
  fetchTodosRequested,
  fetchTodosSucceeded,
  filterChanged,
  initialState,
  todoAdded,
  todosReducer,
  todosRemoved,
  todoUpdated,
} from './todosSlice';
import type { Todo } from './types';

const todo = (id: string, completed = false): Todo => ({
  id,
  title: `Todo ${id}`,
  completed,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('todosSlice', () => {
  it('tracks the fetch lifecycle', () => {
    const loading = todosReducer(initialState, fetchTodosRequested());
    expect(loading.status).toBe('loading');

    const loaded = todosReducer(loading, fetchTodosSucceeded([todo('1')]));
    expect(loaded).toMatchObject({ status: 'succeeded', items: [todo('1')] });

    const failed = todosReducer(loading, fetchTodosFailed('boom'));
    expect(failed).toMatchObject({ status: 'failed', error: 'boom' });
  });

  it('adds, updates and removes todos', () => {
    let state = todosReducer(initialState, todoAdded(todo('1')));
    state = todosReducer(state, todoAdded(todo('2')));
    state = todosReducer(state, todoUpdated(todo('1', true)));
    expect(state.items).toEqual([todo('1', true), todo('2')]);

    state = todosReducer(state, todosRemoved(['1']));
    expect(state.items).toEqual([todo('2')]);
  });

  it('changes the filter', () => {
    expect(todosReducer(initialState, filterChanged('active')).filter).toBe('active');
  });
});
