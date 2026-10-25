import { useState, type FormEvent } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addTodoRequested } from '../todosSlice';

export function NewTodoForm() {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    dispatch(addTodoRequested(trimmed));
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        className="new-todo"
        aria-label="New todo"
        placeholder="What needs to be done?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        autoFocus
      />
    </form>
  );
}
