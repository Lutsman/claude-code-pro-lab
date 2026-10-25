import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectActiveCount, selectCompletedCount, selectFilter } from '../todosSelectors';
import { clearCompletedRequested, filterChanged } from '../todosSlice';
import type { TodoFilter } from '../types';

const FILTERS: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function TodoFooter() {
  const dispatch = useAppDispatch();
  const activeCount = useAppSelector(selectActiveCount);
  const completedCount = useAppSelector(selectCompletedCount);
  const currentFilter = useAppSelector(selectFilter);

  return (
    <footer className="footer">
      <span>
        {activeCount} {activeCount === 1 ? 'item' : 'items'} left
      </span>
      <div className="filters" role="group" aria-label="Filter todos">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={currentFilter === value}
            onClick={() => dispatch(filterChanged(value))}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="clear"
        disabled={completedCount === 0}
        onClick={() => dispatch(clearCompletedRequested())}
      >
        Clear completed
      </button>
    </footer>
  );
}
