import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sources = [];

function collect(directory) {
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const name = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (name !== join('public', 'vendor')) collect(name);
    } else if (/\.(?:mjs|js)$/.test(name)) {
      sources.push(name);
    }
  }
}

for (const directory of ['public', 'worker', 'server', 'api', 'scripts', 'tests'])
  collect(directory);

let failed = false;
for (const source of sources.sort()) {
  const result = spawnSync(process.execPath, ['--check', join(root, source)], {
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message || result.stderr);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
else console.log(`Syntax checked ${sources.length} JavaScript modules.`);
