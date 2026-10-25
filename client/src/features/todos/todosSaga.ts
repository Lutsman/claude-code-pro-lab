import type { SagaIterator } from 'redux-saga';
import { all, call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { todosApi } from './todosApi';
import { selectTodoById } from './todosSelectors';
import {
  addTodoRequested,
  clearCompletedRequested,
  deleteTodoRequested,
  fetchTodosFailed,
  fetchTodosRequested,
  fetchTodosSucceeded,
  requestFailed,
  todoAdded,
  todosRemoved,
  todoUpdated,
  toggleTodoRequested,
} from './todosSlice';
import type { Todo } from './types';

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function* fetchTodos(): SagaIterator {
  try {
    const todos: Todo[] = yield call(todosApi.list);
    yield put(fetchTodosSucceeded(todos));
  } catch (error) {
    yield put(fetchTodosFailed(toMessage(error)));
  }
}

function* addTodo(action: ReturnType<typeof addTodoRequested>): SagaIterator {
  try {
    const todo: Todo = yield call(todosApi.create, action.payload);
    yield put(todoAdded(todo));
  } catch (error) {
    yield put(requestFailed(toMessage(error)));
  }
}

function* toggleTodo(action: ReturnType<typeof toggleTodoRequested>): SagaIterator {
  const current: Todo | undefined = yield select(selectTodoById, action.payload);
  if (!current) return;

  try {
    const todo: Todo = yield call(todosApi.update, current.id, { completed: !current.completed });
    yield put(todoUpdated(todo));
  } catch (error) {
    yield put(requestFailed(toMessage(error)));
  }
}

function* deleteTodo(action: ReturnType<typeof deleteTodoRequested>): SagaIterator {
  try {
    yield call(todosApi.remove, action.payload);
    yield put(todosRemoved([action.payload]));
  } catch (error) {
    yield put(requestFailed(toMessage(error)));
  }
}

function* clearCompleted(): SagaIterator {
  try {
    const { removedIds }: { removedIds: string[] } = yield call(todosApi.clearCompleted);
    yield put(todosRemoved(removedIds));
  } catch (error) {
    yield put(requestFailed(toMessage(error)));
  }
}

export function* todosSaga(): SagaIterator {
  yield all([
    // takeLatest: a newer fetch cancels the one in flight (e.g. StrictMode double effects).
    takeLatest(fetchTodosRequested.type, fetchTodos),
    takeEvery(addTodoRequested.type, addTodo),
    takeEvery(toggleTodoRequested.type, toggleTodo),
    takeEvery(deleteTodoRequested.type, deleteTodo),
    takeLatest(clearCompletedRequested.type, clearCompleted),
  ]);
}
