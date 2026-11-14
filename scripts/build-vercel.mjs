import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../dist/client/', import.meta.url));
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(new URL('../public/', import.meta.url), output, { recursive: true });
console.log('Built Vercel client; /api/* is handled by api/campus.js.');
