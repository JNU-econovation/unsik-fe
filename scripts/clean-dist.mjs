import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(join(root, 'dist'));

if (!target.startsWith(`${root}\\`) && !target.startsWith(`${root}/`)) {
  throw new Error(`Refusing to remove outside workspace: ${target}`);
}

await rm(target, {
  force: true,
  recursive: true,
});
