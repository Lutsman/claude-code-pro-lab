import type { SagaIterator } from 'redux-saga';
import { all, call } from 'redux-saga/effects';
import { todosSaga } from '../features/todos/todosSaga';

// Register every feature saga here.
export function* rootSaga(): SagaIterator {
  yield all([call(todosSaga)]);
}
