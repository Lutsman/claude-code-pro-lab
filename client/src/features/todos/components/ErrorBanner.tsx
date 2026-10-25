import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectError } from '../todosSelectors';
import { errorDismissed } from '../todosSlice';

export function ErrorBanner() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  if (!error) return null;

  return (
    <div className="error" role="alert">
      <span>{error}</span>
      <button type="button" aria-label="Dismiss error" onClick={() => dispatch(errorDismissed())}>
        ×
      </button>
    </div>
  );
}
