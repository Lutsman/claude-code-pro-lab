import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.ts';
import { createInMemoryRepository } from './todos/todo.repository.ts';

describe('todos API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createInMemoryRepository());
  });

  it('creates and lists todos', async () => {
    const created = await request(app).post('/api/todos').send({ title: '  Buy milk  ' });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: 'Buy milk', completed: false });
    expect(created.body.id).toEqual(expect.any(String));

    const list = await request(app).get('/api/todos');
    expect(list.body).toEqual([created.body]);
  });

  it('rejects an empty title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{"title":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Malformed JSON body' });
  });

  it('updates a todo', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Walk' });

    const res = await request(app).patch(`/api/todos/${todo.id}`).send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...todo, completed: true });
  });

  it('rejects an empty or unknown patch', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Walk' });

    expect((await request(app).patch(`/api/todos/${todo.id}`).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/todos/${todo.id}`).send({ foo: 1 })).status).toBe(400);
  });

  it('returns 404 for a missing todo', async () => {
    expect((await request(app).patch('/api/todos/nope').send({ completed: true })).status).toBe(
      404,
    );
    expect((await request(app).delete('/api/todos/nope')).status).toBe(404);
  });

  it('deletes a todo', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Walk' });

    expect((await request(app).delete(`/api/todos/${todo.id}`)).status).toBe(204);
    expect((await request(app).get('/api/todos')).body).toEqual([]);
  });

  it('clears completed todos', async () => {
    const { body: done } = await request(app).post('/api/todos').send({ title: 'Done' });
    const { body: open } = await request(app).post('/api/todos').send({ title: 'Open' });
    await request(app).patch(`/api/todos/${done.id}`).send({ completed: true });

    const res = await request(app).delete('/api/todos/completed');

    expect(res.body).toEqual({ removedIds: [done.id] });
    expect((await request(app).get('/api/todos')).body).toEqual([open]);
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
