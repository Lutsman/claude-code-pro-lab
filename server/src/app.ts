import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from './http-error.ts';
import type { TodoRepository } from './todos/todo.repository.ts';
import { createTodoRouter } from './todos/todo.router.ts';

export function createApp(repository: TodoRepository): express.Express {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/todos', createTodoRouter(repository));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Express 5 forwards rejected promises from async handlers here.
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      // Plain messages: the client shows `error` to the user as-is.
      res.status(400).json({ error: error.issues.map((issue) => issue.message).join('; ') });
    } else if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
    } else if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Malformed JSON body' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  app.use(errorHandler);

  return app;
}
