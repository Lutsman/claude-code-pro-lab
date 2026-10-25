import { describe, expect, it, vi } from 'vitest';
import { setupStore } from '../../app/store';
import { todosApi } from './todosApi';
import {
  addTodoRequested,
  clearCompletedRequested,
  deleteTodoRequested,
  fetchTodosRequested,
  initialState,
  toggleTodoRequested,
} from './todosSlice';
import type { Todo } from './types';

const todo = (id: string, completed = false): Todo => ({
  id,
  title: `Todo ${id}`,
  completed,
  createdAt: '2026-01-01T00:00:00.000Z',
});

// Runs the real store + root saga; only the HTTP layer is stubbed.
const storeWith = (items: Todo[] = []) =>
  setupStore({ todos: { ...initialState, items, status: 'succeeded' } });

describe('todosSaga', () => {
  it('loads todos', async () => {
    vi.spyOn(todosApi, 'list').mockResolvedValue([todo('1')]);
    const store = setupStore();

    store.dispatch(fetchTodosRequested());

    await vi.waitFor(() => expect(store.getState().todos.status).toBe('succeeded'));
    expect(store.getState().todos.items).toEqual([todo('1')]);
  });

  it('reports a failed load', async () => {
    vi.spyOn(todosApi, 'list').mockRejectedValue(new Error('offline'));
    const store = setupStore();

    store.dispatch(fetchTodosRequested());

    await vi.waitFor(() => expect(store.getState().todos.status).toBe('failed'));
    expect(store.getState().todos.error).toBe('offline');
  });

  it('adds a todo', async () => {
    const create = vi.spyOn(todosApi, 'create').mockResolvedValue(todo('1'));
    const store = storeWith();

    store.dispatch(addTodoRequested('Todo 1'));

    await vi.waitFor(() => expect(store.getState().todos.items).toEqual([todo('1')]));
    expect(create).toHaveBeenCalledWith('Todo 1');
  });

  it('toggles a todo using its current state', async () => {
    const update = vi.spyOn(todosApi, 'update').mockResolvedValue(todo('1', true));
    const store = storeWith([todo('1')]);

    store.dispatch(toggleTodoRequested('1'));

    await vi.waitFor(() => expect(store.getState().todos.items).toEqual([todo('1', true)]));
    expect(update).toHaveBeenCalledWith('1', { completed: true });
  });

  it('keeps the todo and reports an error when delete fails', async () => {
    vi.spyOn(todosApi, 'remove').mockRejectedValue(new Error('Todo not found'));
    const store = storeWith([todo('1')]);

    store.dispatch(deleteTodoRequested('1'));

    await vi.waitFor(() => expect(store.getState().todos.error).toBe('Todo not found'));
    expect(store.getState().todos.items).toEqual([todo('1')]);
  });

  it('clears completed todos returned by the API', async () => {
    vi.spyOn(todosApi, 'clearCompleted').mockResolvedValue({ removedIds: ['1'] });
    const store = storeWith([todo('1', true), todo('2')]);

    store.dispatch(clearCompletedRequested());

    await vi.waitFor(() => expect(store.getState().todos.items).toEqual([todo('2')]));
  });
});
