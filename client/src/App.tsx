import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { ErrorBanner } from './features/todos/components/ErrorBanner';
import { NewTodoForm } from './features/todos/components/NewTodoForm';
import { TodoFooter } from './features/todos/components/TodoFooter';
import { TodoList } from './features/todos/components/TodoList';
import { selectStatus, selectTodos } from './features/todos/todosSelectors';
import { fetchTodosRequested } from './features/todos/todosSlice';

export function App() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectStatus);
  const hasTodos = useAppSelector(selectTodos).length > 0;

  useEffect(() => {
    dispatch(fetchTodosRequested());
  }, [dispatch]);

  return (
    <main className="app">
      <h1>todos</h1>
      <section className="card">
        <NewTodoForm />
        <ErrorBanner />
        {status === 'loading' && <p className="hint">Loading…</p>}
        {hasTodos && (
          <>
            <TodoList />
            <TodoFooter />
          </>
        )}
      </section>
    </main>
  );
}
