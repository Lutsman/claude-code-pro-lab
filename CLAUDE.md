# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Study project for a course on working with Claude Code: a todo list with a React + Redux Toolkit + redux-saga + TypeScript client and a Node.js (Express 5) API. npm workspaces: `server/` and `client/`.

## Git workflow

- Branches: `main` ← `dev` ← task branches. Start each task on a new branch off `dev` named `TD-001`, `TD-002`, … (the next unused number; see `gh pr list --state all`), push it, and open a PR into `dev` (`gh pr create --base dev`).
- Merge a PR into `dev` only after the user approves it in chat. PRs are opened from the user's own GitHub account, and GitHub doesn't let an author approve their own PR.
- Don't merge into `main` unless the user explicitly asks; by default they promote `dev` → `main` themselves.

## Commands

Run from the repo root. Node 24 is required (`.nvmrc`): the server has no build step, and Node's built-in type stripping runs `server/src/*.ts` directly (no tsx/ts-node).

```sh
npm install                  # installs both workspaces
npm run dev                  # API on :3001 (node --watch) + Vite on :5173 -> open http://localhost:5173
npm run check                # prettier --check, eslint, tsc, all tests; run before committing
npm test                     # all tests in both workspaces
npm test -w client -- src/features/todos/todosSaga.test.ts   # one file, path relative to the workspace
npm run format               # prettier --write
npm run build                # client typecheck + vite build -> client/dist
```

Run Vitest only through a workspace (`-w client` / `-w server`). There is no root Vitest config, so `npx vitest` from the root skips the client's jsdom setup and `App.test.tsx` fails with `document is not defined`.

Environment: the server reads `PORT` (default 3001) and `DATA_FILE` (default `server/data/todos.json`, gitignored); the Vite dev proxy reads `API_PORT` (default 3001), so change `PORT` and `API_PORT` together.

## Architecture

### Server (`server/src`)

- `createApp(repository)` in `app.ts` builds the Express app around an injected `TodoRepository`. `index.ts` wires in the JSON-file repository and listens. Tests pass `createInMemoryRepository()` and call the app through supertest.
- The JSON-file repository reads the data file once at startup and then serves todos from memory, so edits to the file while the server runs are ignored and overwritten by the next change.
- Handlers parse request bodies with the zod schemas in `todo.schema.ts`, and throw `HttpError` for 404s. Express 5 forwards async rejections to the central error handler, which maps everything to `{ error: string }`. Keep that shape: the client shows `error` to the user as-is.
- Relative imports must use the `.ts` extension. Ignore tsc's TS2835 hint to use `.js`: it passes tsc and Vitest but crashes Node at startup.
- Only erasable TypeScript syntax is allowed (`erasableSyntaxOnly`), e.g. no enums, namespaces with runtime code or constructor parameter properties.

### Client (`client/src`)

- Data flow: a component dispatches a `*Requested` action from `todosSlice`; a worker in `todosSaga` calls `todosApi` and dispatches a result action, which the reducer applies. Todo items change only after the server responds (no optimistic updates).
- Thunks are disabled in `app/store.ts`, so every async side effect goes in a saga. Register each new feature saga in `app/rootSaga.ts`.
- Saga and component tests use a fresh real store from `setupStore()` (a factory, not a singleton) and stub only the HTTP layer: `todosApi` is an object so `vi.spyOn(todosApi, 'list')` works, and `restoreMocks` in `vite.config.ts` restores the spies.
- `Todo` and `TodoPatch` exist twice, in `client/src/features/todos/types.ts` and `server/src/todos/todo.types.ts`. Change both together, along with the zod schemas (`NewTodoForm` mirrors the 200-char title limit).

### Tooling

- `tsconfig.base.json` holds the shared strict options. `verbatimModuleSyntax` is on, so import types with `import type`.
- TypeScript is pinned to `~6.0` because typescript-eslint supports only `<6.1`. Don't upgrade to TS 7 until typescript-eslint does.
