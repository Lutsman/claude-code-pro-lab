# claude-code-pro-lab

Study project for a course on working with Claude Code: a todo list.

- **Client:** React 19, Redux Toolkit, redux-saga, TypeScript, Vite
- **Server:** Node.js 24, Express 5, zod; todos are stored in a JSON file
- **Tests:** Vitest, Testing Library, supertest

## Getting started

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:3001 and Vite proxies `/api` to it.

## Scripts

| Command          | What it does                                   |
| ---------------- | ---------------------------------------------- |
| `npm run dev`    | API + client in watch mode                     |
| `npm test`       | All tests                                      |
| `npm run check`  | Format check, lint, typecheck and tests        |
| `npm run build`  | Production build of the client (`client/dist`) |
| `npm run format` | Format all files with Prettier                 |

## API

| Method   | Path                   | Body                     | Response           |
| -------- | ---------------------- | ------------------------ | ------------------ |
| `GET`    | `/api/todos`           |                          | `Todo[]`           |
| `POST`   | `/api/todos`           | `{ title }`              | `201 Todo`         |
| `PATCH`  | `/api/todos/:id`       | `{ title?, completed? }` | `Todo`             |
| `DELETE` | `/api/todos/:id`       |                          | `204`              |
| `DELETE` | `/api/todos/completed` |                          | `{ removedIds }`   |
| `GET`    | `/api/health`          |                          | `{ status: 'ok' }` |

Errors come back as `{ "error": "message" }` with a 4xx/5xx status.
