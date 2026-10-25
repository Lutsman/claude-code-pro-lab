import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJsonFileRepository } from './todo.repository.ts';

describe('createJsonFileRepository', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'todos-'));
    file = join(dir, 'nested', 'todos.json');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('starts empty when the file does not exist', async () => {
    const repo = await createJsonFileRepository(file);

    expect(await repo.list()).toEqual([]);
  });

  it('persists mutations and reloads them', async () => {
    const repo = await createJsonFileRepository(file);
    const a = await repo.create('A');
    await repo.create('B');
    await repo.update(a.id, { completed: true });
    await repo.removeCompleted();

    const onDisk = JSON.parse(await readFile(file, 'utf8'));
    expect(onDisk.map((todo: { title: string }) => todo.title)).toEqual(['B']);

    const reloaded = await createJsonFileRepository(file);
    expect(await reloaded.list()).toEqual(onDisk);
  });
});
