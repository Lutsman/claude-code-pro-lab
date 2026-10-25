import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { createJsonFileRepository } from './todos/todo.repository.ts';

const port = Number(process.env.PORT ?? 3001);
const dataFile =
  process.env.DATA_FILE ?? fileURLToPath(new URL('../data/todos.json', import.meta.url));

const repository = await createJsonFileRepository(dataFile);

createApp(repository).listen(port, () => {
  console.log(`API listening on http://localhost:${port} (data: ${dataFile})`);
});
