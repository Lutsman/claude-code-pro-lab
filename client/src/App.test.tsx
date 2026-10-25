import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { setupStore } from './app/store';
import { todosApi } from './features/todos/todosApi';
import type { Todo } from './features/todos/types';

const todo = (id: string, title: string, completed = false): Todo => ({
  id,
  title,
  completed,
  createdAt: '2026-01-01T00:00:00.000Z',
});

function renderApp() {
  render(
    <Provider store={setupStore()}>
      <App />
    </Provider>,
  );
  return userEvent.setup();
}

describe('App', () => {
  it('shows todos from the API and adds a new one', async () => {
    vi.spyOn(todosApi, 'list').mockResolvedValue([todo('1', 'Buy milk')]);
    vi.spyOn(todosApi, 'create').mockResolvedValue(todo('2', 'Walk the dog'));
    const user = renderApp();

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();

    await user.type(screen.getByLabelText('New todo'), 'Walk the dog{Enter}');

    expect(await screen.findByText('Walk the dog')).toBeInTheDocument();
    expect(screen.getByLabelText('New todo')).toHaveValue('');
    expect(screen.getByText('2 items left')).toBeInTheDocument();
  });

  it('toggles a todo and filters by status', async () => {
    vi.spyOn(todosApi, 'list').mockResolvedValue([todo('1', 'Buy milk'), todo('2', 'Read')]);
    vi.spyOn(todosApi, 'update').mockResolvedValue(todo('1', 'Buy milk', true));
    const user = renderApp();

    await user.click(await screen.findByRole('checkbox', { name: 'Buy milk' }));
    expect(await screen.findByText('1 item left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('shows API errors', async () => {
    vi.spyOn(todosApi, 'list').mockRejectedValue(new Error('Server is down'));
    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('Server is down');
  });
});
