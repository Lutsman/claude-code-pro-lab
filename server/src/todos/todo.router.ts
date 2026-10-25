import { Router } from 'express';
import { HttpError } from '../http-error.ts';
import type { TodoRepository } from './todo.repository.ts';
import { createTodoSchema, updateTodoSchema } from './todo.schema.ts';

export function createTodoRouter(repository: TodoRepository): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await repository.list());
  });

  router.post('/', async (req, res) => {
    const { title } = createTodoSchema.parse(req.body);
    res.status(201).json(await repository.create(title));
  });

  // Registered before '/:id' so "completed" is not treated as an id.
  router.delete('/completed', async (_req, res) => {
    res.json({ removedIds: await repository.removeCompleted() });
  });

  router.patch('/:id', async (req, res) => {
    const patch = updateTodoSchema.parse(req.body);
    const todo = await repository.update(req.params.id, patch);
    if (!todo) throw new HttpError(404, 'Todo not found');
    res.json(todo);
  });

  router.delete('/:id', async (req, res) => {
    const removed = await repository.remove(req.params.id);
    if (!removed) throw new HttpError(404, 'Todo not found');
    res.status(204).end();
  });

  return router;
}
