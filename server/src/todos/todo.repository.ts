import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Todo, TodoPatch } from './todo.types.ts';

export interface TodoRepository {
  list(): Promise<Todo[]>;
  create(title: string): Promise<Todo>;
  update(id: string, patch: TodoPatch): Promise<Todo | undefined>;
  remove(id: string): Promise<boolean>;
  removeCompleted(): Promise<string[]>;
}

type OnChange = (todos: Todo[]) => Promise<void>;

/**
 * Keeps todos in memory; `onChange` is awaited after every mutation,
 * which is how the JSON-file repository persists.
 */
export function createInMemoryRepository(
  initial: Todo[] = [],
  onChange: OnChange = async () => {},
): TodoRepository {
  let todos = [...initial];

  return {
    async list() {
      return [...todos];
    },

    async create(title) {
      const todo: Todo = {
        id: randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      await onChange(todos);
      return todo;
    },

    async update(id, patch) {
      const index = todos.findIndex((todo) => todo.id === id);
      const current = todos[index];
      if (!current) return undefined;

      const updated = { ...current, ...patch };
      todos[index] = updated;
      await onChange(todos);
      return updated;
    },

    async remove(id) {
      const before = todos.length;
      todos = todos.filter((todo) => todo.id !== id);
      if (todos.length === before) return false;

      await onChange(todos);
      return true;
    },

    async removeCompleted() {
      const removed = todos.filter((todo) => todo.completed).map((todo) => todo.id);
      if (removed.length === 0) return removed;

      todos = todos.filter((todo) => !todo.completed);
      await onChange(todos);
      return removed;
    },
  };
}

export async function createJsonFileRepository(filePath: string): Promise<TodoRepository> {
  let initial: Todo[] = [];
  try {
    initial = JSON.parse(await readFile(filePath, 'utf8')) as Todo[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  await mkdir(dirname(filePath), { recursive: true });

  // Writes are chained so concurrent requests never interleave on disk;
  // write-then-rename keeps the file intact if the process dies mid-write.
  let pending = Promise.resolve();
  const persist: OnChange = (todos) => {
    const snapshot = JSON.stringify(todos, null, 2);
    const write = pending.then(async () => {
      const tmp = `${filePath}.tmp`;
      await writeFile(tmp, snapshot);
      await rename(tmp, filePath);
    });
    // A failed write rejects its own request but must not block later writes.
    pending = write.catch(() => {});
    return write;
  };

  return createInMemoryRepository(initial, persist);
}
