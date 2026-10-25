// Mirrors server/src/todos/todo.types.ts — keep both in sync.
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type TodoPatch = Partial<Pick<Todo, 'title' | 'completed'>>;

export type TodoFilter = 'all' | 'active' | 'completed';
