# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Study project for a course on working with Claude Code: a todo list in an npm-workspaces monorepo.

- `server/`: Node 24, Express 5 and zod; todos live in memory and are persisted to a JSON file. Tests: Vitest + supertest.
- `client/`: React 19, Redux Toolkit, redux-saga, Vite. Tests: Vitest + jsdom + Testing Library.

## Commands

Run from the repo root. Node 24 is required (`.nvmrc`): the server has no build step, and Node's built-in type stripping runs `server/src/*.ts` directly (no tsx/ts-node).

```sh
npm install                  # installs both workspaces
npm run dev                  # API on :3001 (node --watch) + Vite on :5173 -> open http://localhost:5173
npm run dev -w server        # API only (npm start -w server: same without watch)
npm run check                # prettier --check, eslint, tsc, all tests
npm test                     # all tests in both workspaces
npm test -w client -- src/features/todos/todosSaga.test.ts   # one file, path relative to the workspace
npm test -w server -- -t "clears completed"                  # tests whose name matches
npm run test:watch -w client # watch mode
npm run typecheck            # tsc in both workspaces (type-check only, nothing is emitted)
npm run lint                 # eslint . (root only; for a subset: npx eslint client/src)
npm run format               # prettier --write .
npm run build                # client typecheck + vite build -> client/dist
```

Run Vitest only through a workspace (`-w client` / `-w server`). There is no root Vitest config, so `npx vitest` from the root runs client tests without jsdom and they fail with `document is not defined`.

Environment: the server reads `PORT` (default 3001) and `DATA_FILE` (default `server/data/todos.json`); the Vite `/api` proxy targets `API_PORT` (default 3001), so change `PORT` and `API_PORT` together.

## HTTP API

The client calls relative `/api/...` URLs (`todosApi.ts`); in dev they reach Express through the Vite proxy. Express does not serve `client/dist`.

- `GET /api/todos` → `Todo[]`; `POST /api/todos` `{ title }` → 201 `Todo`
- `PATCH /api/todos/:id` `{ title?, completed? }` → `Todo`; `DELETE /api/todos/:id` → 204
- `DELETE /api/todos/completed` → `{ removedIds }`; `GET /api/health` → `{ status: 'ok' }`
- Every error, including unknown `/api` routes (404), is `{ error: string }` with a 4xx/5xx status. The client shows `error` to the user verbatim, so server error messages are UI text.

## Architecture

### Request flow

A component dispatches a `*Requested` action from `todosSlice`; a worker in `todosSaga` calls `todosApi`; Express validates the body with zod and calls the repository, which persists to the JSON file. The saga then dispatches a result action (`fetchTodosSucceeded`, `todoAdded`, `todoUpdated`, `todosRemoved`) carrying the server's data. There are no optimistic updates: the store changes only after the server responds, and a failed request leaves `items` untouched. On failure `todosApi` throws an `Error` with the server's `error` text, the saga dispatches `fetchTodosFailed` (list load; sets `status: 'failed'`) or `requestFailed` (mutations; sets only `error`), and `ErrorBanner` shows it.

### Server (`server/src`)

- `createApp(repository)` in `app.ts` builds the app around an injected `TodoRepository`; only `index.ts` wires the JSON-file repository and listens. Order inside `createApp`: JSON body parser, `/api/health`, the `/api/todos` router, a JSON 404 catch-all for `/api`, the error handler. Mount new routers before the catch-all.
- Handlers call `schema.parse(req.body)` and `throw new HttpError(status, message)`, with no try/catch. Express 5 forwards async rejections to the error handler, which maps `ZodError` → 400 (issue messages joined), `HttpError` → its status, malformed JSON → 400, anything else → 500. The zod schemas in `todo.schema.ts` are strict objects, so unknown keys are a 400.
- `DELETE /completed` is registered before the `/:id` routes and must stay there.
- `createInMemoryRepository(initial, onChange)` holds the state and awaits `onChange(todos)` after each mutation. `createJsonFileRepository(path)` reads the file once at startup and supplies an `onChange` that writes the whole snapshot (writes are chained, go to `<file>.tmp`, then are renamed). A new mutating method must call `onChange` or its change is lost on restart. The file is never re-read, so editing it while the server runs gets overwritten by the next mutation.
- The code runs as native ESM through Node type stripping, so relative imports must end in `.ts`. tsc's TS2835 hint suggests `.js` instead, which passes tsc and Vitest but crashes Node at startup. `erasableSyntaxOnly` forbids enums, namespaces and constructor parameter properties (see how `HttpError` declares `status`).
- `server/data/` is gitignored runtime data written by the dev server; tests never touch it.

### Client (`client/src`)

- `setupStore(preloadedState?)` in `app/store.ts` is a factory, not a singleton: each call creates a store with thunks disabled and starts `rootSaga`. All async work goes into sagas. Register a new saga in `app/rootSaga.ts` and a new reducer in `combineReducers` in `store.ts` (`RootState` is inferred from it).
- In `todosSlice.ts` the `*Requested` actions are commands for the saga; most are no-op reducers that exist for their typed action creators (hence the `_`-prefixed params). `status` tracks only the list fetch; the filter is client-only state applied by `selectVisibleTodos`.
- `todosSaga.ts` uses `takeLatest` for the fetch (StrictMode runs `App`'s mount effect twice) and for clear-completed, `takeEvery` for add, toggle and delete. Toggle computes `completed` from the todo in the store, so it does nothing for an id that is not loaded.
- Components use the typed `useAppDispatch`/`useAppSelector` from `app/hooks.ts` and the selectors in `todosSelectors.ts` (derived values are memoized with `createSelector`).
- Imports are extensionless here (`moduleResolution: bundler`), unlike the server.
- `Todo` and `TodoPatch` are declared twice, in `client/src/features/todos/types.ts` and `server/src/todos/todo.types.ts`; there is no shared package. Change both together, along with the zod schemas (titles are trimmed, 1–200 chars; `NewTodoForm` mirrors the 200 limit).

### Tests

- Server: supertest against `createApp(createInMemoryRepository())`, so no port and no disk. The JSON-file repository is tested in a temp dir.
- Client: tests run the real store, root saga, reducers and components and stub only the HTTP layer, e.g. `vi.spyOn(todosApi, 'list').mockResolvedValue([...])`. That is why `todosApi` is an object and sagas use `call(todosApi.method, ...)`. `restoreMocks: true` in `vite.config.ts` restores spies between tests; `src/test/setup.ts` adds jest-dom matchers and cleanup. Seed state with `setupStore({ todos: { ...initialState, items, status: 'succeeded' } })` and await saga results with `vi.waitFor` or `findBy*` queries.

## Tooling

- One flat ESLint config (`eslint.config.js`) covers both workspaces: typescript-eslint recommended everywhere, react-hooks and react-refresh rules on `client/src`. An unused parameter must be `_`-prefixed (ESLint and tsc both accept that); tsc's `noUnusedLocals` rejects unused locals even with `_`.
- Prettier (single quotes, width 100, LF line endings) also checks Markdown and JSON, so `npm run check` fails on an unformatted doc too.
- `tsconfig.base.json` holds the shared strict options, including `noUncheckedIndexedAccess` and `verbatimModuleSyntax` (import types with `import type`; on the server a value import of a type fails when Node loads the module). The client has two tsc projects: `tsconfig.app.json` (`src`) and `tsconfig.node.json` (`vite.config.ts`).
- TypeScript is pinned to `~6.0.3` in all three `package.json` files. typescript-eslint 8.72 declares `typescript >=4.8.4 <6.1.0` as its peer range (see `package-lock.json`), so don't move TypeScript past 6.0 unless typescript-eslint supports it.
