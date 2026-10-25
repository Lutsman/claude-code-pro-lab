import type { Todo, TodoPatch } from './types';

const BASE_URL = '/api/todos';

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

// An object (not loose functions) so tests can stub methods with vi.spyOn.
export const todosApi = {
  list: () => request<Todo[]>(''),
  create: (title: string) => request<Todo>('', 'POST', { title }),
  update: (id: string, patch: TodoPatch) => request<Todo>(`/${id}`, 'PATCH', patch),
  remove: (id: string) => request<void>(`/${id}`, 'DELETE'),
  clearCompleted: () => request<{ removedIds: string[] }>('/completed', 'DELETE'),
};
