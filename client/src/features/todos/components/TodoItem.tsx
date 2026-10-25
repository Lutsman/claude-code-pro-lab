import { useAppDispatch } from '../../../app/hooks';
import { deleteTodoRequested, toggleTodoRequested } from '../todosSlice';
import type { Todo } from '../types';

export function TodoItem({ todo }: { todo: Todo }) {
  const dispatch = useAppDispatch();

  return (
    <li className={todo.completed ? 'todo completed' : 'todo'}>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => dispatch(toggleTodoRequested(todo.id))}
        />
        <span className="title">{todo.title}</span>
      </label>
      <button
        type="button"
        className="destroy"
        aria-label={`Delete "${todo.title}"`}
        onClick={() => dispatch(deleteTodoRequested(todo.id))}
      >
        ×
      </button>
    </li>
  );
}
