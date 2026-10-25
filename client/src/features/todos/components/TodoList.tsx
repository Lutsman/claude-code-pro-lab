import { useAppSelector } from '../../../app/hooks';
import { selectVisibleTodos } from '../todosSelectors';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const todos = useAppSelector(selectVisibleTodos);

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
