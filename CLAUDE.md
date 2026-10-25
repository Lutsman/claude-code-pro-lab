# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Study project for a course on working with Claude Code: a todo list with a React + Redux Toolkit + redux-saga + TypeScript client and a Node.js (Express 5) API. npm workspaces: `server/` and `client/`.

## Git workflow

- Branches: `main` ← `dev` ← feature branches. Start work on a new branch off `dev` (`feature/<name>`), push it, and open a PR into `dev` (`gh pr create --base dev`).
- Merge a PR into `dev` only after the user approves it. Never push or merge into `main`: the user promotes `dev` → `main` by hand.
- The remote uses SSH (`git@github.com:Lutsman/claude-code-pro-lab.git`); commits are authored as Lutsman / 333333y@gmail.com.

## Commands

Node 24 is required (`.nvmrc`). The server has no build step: Node's built-in type stripping runs `server/src/*.ts` directly, so there is no tsx/ts-node.

```sh
npm install                      # from the root; installs both workspaces
npm run dev                      # API on :3001 + Vite on :5173 (proxies /api → :3001)
npm run check                    # prettier --check, eslint, tsc, all tests; run before committing
npm test                         # all tests (Vitest) in both workspaces
npm test -w server               # one workspace
npm test -w client -- src/features/todos/todosSaga.test.ts   # one file
npm test -w server -- -t "clears completed"                  # tests matching a name
npm run typecheck | lint | format
npm run build                    # client typecheck + Vite production build → client/dist
```

Environment: the server reads `PORT` (default 3001) and `DATA_FILE` (default `server/data/todos.json`, gitignored); the Vite dev proxy reads `API_PORT`.

## Architecture

### Server (`server/src`)

- `createApp(repository)` in `app.ts` builds the Express app around an injected `TodoRepository`. `index.ts` wires in the JSON-file repository and listens. Tests pass `createInMemoryRepository()` and call the app through supertest.
- The JSON-file repository is the in-memory repository plus an `onChange` hook. The hook persists a full snapshot after each mutation; writes are serialized and go to a temp file that is then renamed into place.
- Handlers parse request bodies with the zod schemas in `todo.schema.ts`, and throw `HttpError` for 404s. Express 5 forwards async rejections to the central error handler, which maps everything to `{ error: string }`. Keep that shape: the client shows `error` to the user as-is.
- Routes: `GET`/`POST /api/todos`, `PATCH`/`DELETE /api/todos/:id`, and `DELETE /api/todos/completed`, which returns `{ removedIds }`. That last route must stay registered before `/:id`.
- Relative imports must use the `.ts` extension. Only erasable TypeScript syntax is allowed (no enums, namespaces or constructor parameter properties); `erasableSyntaxOnly` enforces this.

### Client (`client/src`)

- Data flow: a component dispatches a `*Requested` action from `todosSlice`. A worker in `todosSaga` calls `todosApi` and dispatches a result action (`fetchTodosSucceeded`, `todoAdded`, `todoUpdated`, `todosRemoved`, `requestFailed`), and the reducer applies it. There are no optimistic updates: state changes only after the server responds.
- Thunks are disabled in `app/store.ts`, so every async side effect goes in a saga. Register each new feature saga in `app/rootSaga.ts`.
- `setupStore(preloadedState?)` is a factory, not a singleton, so each test builds a fresh store that runs the real root saga.
- Components use the typed `useAppDispatch`/`useAppSelector` from `app/hooks.ts`. Derived data comes from memoized selectors in `todosSelectors.ts`.
- Tests stub only the HTTP layer. `todosApi` is an object so that `vi.spyOn(todosApi, 'list')` works; `restoreMocks` in `vite.config.ts` resets the spies. The slice, sagas and components all run for real.
- The `Todo` type exists twice, in `client/src/features/todos/types.ts` and `server/src/todos/todo.types.ts`. Change both together.

### Tooling

- One ESLint flat config (`eslint.config.js`) and one Prettier config (single quotes, width 100) cover both workspaces.
- `tsconfig.base.json` holds the shared strict options. `verbatimModuleSyntax` is on, so import types with `import type`.
- TypeScript is pinned to `~6.0` because typescript-eslint supports only `<6.1`. Don't upgrade to TS 7 until typescript-eslint does.
