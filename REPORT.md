## 1

```
Зменшив опис, бо його за багато

самостійно згенерований клодом Опис
```

Study project for a course on working with Claude Code: a todo list in an npm-workspaces monorepo.

- `server/`: Node 24, Express 5 and zod; todos live in memory and are persisted to a JSON file. Tests: Vitest + supertest.
- `client/`: React 19, Redux Toolkit, redux-saga, Vite. Tests: Vitest + jsdom + Testing Library.

```
згенеровано клодом з моєю допомогою і вимогами влізти в 60 строк
```

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Study project for a course on working with Claude Code: a todo list with a React + Redux Toolkit + redux-saga + TypeScript client and a Node.js (Express 5) API. npm workspaces: `server/` and `client/`.

## 2

```
Додав Git workflow, клод не міг знати про це, так як це мої вподобання
```

## Git workflow

```
пустий
```

```
згенеровано клодом з моєю допомогою
```

## Git workflow

- Branches: `main` ← `dev` ← task branches. Start each task on a new branch off `dev` named `TD-001`, `TD-002`, … (the next unused number; see `gh pr list --state all`), push it, and open a PR into `dev` (`gh pr create --base dev`).
- Merge a PR into `dev` only after the user approves it in chat. PRs are opened from the user's own GitHub account, and GitHub doesn't let an author approve their own PR.
- Don't merge into `main` unless the user explicitly asks; by default they promote `dev` → `main` themselves.

## 3

## Commands

```
видалив в commands
рідко потрібна; npm run dev теж запускає API, а сама команда видна в server/package.json і в кореневому dev
```

npm run dev -w server # API only (npm start -w server: same without watch)

```
приклад з одним файлом уже показує, як передати аргументи Vitest через --, а -t — стандартний прапорець Vitest
```

npm test -w server -- -t "clears completed" # tests whose name matches

```
watch за тестами не потрібні при розробці клодом
```

npm run test:watch -w client # watch mode

```
lint, typecheck робиться за допомогою check
```

npm run typecheck # tsc in both workspaces (type-check only, nothing is emitted)
npm run lint # eslint . (root only; for a subset: npx eslint client/src)

## 4

```
request flow він замінений коротким пунктом Data flow в абзаці Client
також було неправдиве твердження "the store changes only after the server responds", а один редьюсер міняє стор одразу
```

```ts
fetchTodosRequested(state) {
  state.status = 'loading';   // одразу, ще до запиту
  state.error = null;         // і стирає попередню помилку
},
```

### Request flow

A component dispatches a `*Requested` action from `todosSlice`; a worker in `todosSaga` calls `todosApi`; Express validates the body with zod and calls the repository, which persists to the JSON file. The saga then dispatches a result action (`fetchTodosSucceeded`, `todoAdded`, `todoUpdated`, `todosRemoved`) carrying the server's data. There are no optimistic updates: the store changes only after the server responds, and a failed request leaves `items` untouched. On failure `todosApi` throws an `Error` with the server's `error` text, the saga dispatches `fetchTodosFailed` (list load; sets `status: 'failed'`) or `requestFailed` (mutations; sets only `error`), and `ErrorBanner` shows it.

## 5

```
Прибрав абзац http API, дублювання таблиці в README. Контракт { error: string } збережено в пункті Server
```

## HTTP API

The client calls relative `/api/...` URLs (`todosApi.ts`); in dev they reach Express through the Vite proxy. Express does not serve `client/dist`.

- `GET /api/todos` → `Todo[]`; `POST /api/todos` `{ title }` → 201 `Todo`
- `PATCH /api/todos/:id` `{ title?, completed? }` → `Todo`; `DELETE /api/todos/:id` → 204
- `DELETE /api/todos/completed` → `{ removedIds }`; `GET /api/health` → `{ status: 'ok' }`
- Every error, including unknown `/api` routes (404), is `{ error: string }` with a 4xx/5xx status. The client shows `error` to the user verbatim, so server error messages are UI text.

## 6

```
видалив Tests, опис тестів є в клієнті
```

### Tests

- Server: supertest against `createApp(createInMemoryRepository())`, so no port and no disk. The JSON-file repository is tested in a temp dir.
- Client: tests run the real store, root saga, reducers and components and stub only the HTTP layer, e.g. `vi.spyOn(todosApi, 'list').mockResolvedValue([...])`. That is why `todosApi` is an object and sagas use `call(todosApi.method, ...)`. `restoreMocks: true` in `vite.config.ts` restores spies between tests; `src/test/setup.ts` adds jest-dom matchers and cleanup. Seed state with `setupStore({ todos: { ...initialState, items, status: 'succeeded' } })` and await saga results with `vi.waitFor` or `findBy*` queries.

## 7

```
поміняв "tooling" на той, що був згенерований клодом з моїми підказками, цей абзац коротший
бо те що робить prettier та eslint і так видно з їх налаштувань, не треба це додатково описувати в CLAUDE.md

самостійно згенерований клодом tooling
```

## Tooling

- One flat ESLint config (`eslint.config.js`) covers both workspaces: typescript-eslint recommended everywhere, react-hooks and react-refresh rules on `client/src`. An unused parameter must be `_`-prefixed (ESLint and tsc both accept that); tsc's `noUnusedLocals` rejects unused locals even with `_`.
- Prettier (single quotes, width 100, LF line endings) also checks Markdown and JSON, so `npm run check` fails on an unformatted doc too.
- `tsconfig.base.json` holds the shared strict options, including `noUncheckedIndexedAccess` and `verbatimModuleSyntax` (import types with `import type`; on the server a value import of a type fails when Node loads the module). The client has two tsc projects: `tsconfig.app.json` (`src`) and `tsconfig.node.json` (`vite.config.ts`).
- TypeScript is pinned to `~6.0.3` in all three `package.json` files. typescript-eslint 8.72 declares `typescript >=4.8.4 <6.1.0` as its peer range (see `package-lock.json`), so don't move TypeScript past 6.0 unless typescript-eslint supports it.

```
згенеровано клодом з моєю допомогою і вимогами влізти в 60 строк
```

### Tooling

- `tsconfig.base.json` holds the shared strict options. `verbatimModuleSyntax` is on, so import types with `import type`.
- TypeScript is pinned to `~6.0` because typescript-eslint supports only `<6.1`. Don't upgrade to TS 7 until typescript-eslint does.
