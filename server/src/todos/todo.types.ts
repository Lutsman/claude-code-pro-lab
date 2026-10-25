export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type TodoPatch = Partial<Pick<Todo, 'title' | 'completed'>>;
