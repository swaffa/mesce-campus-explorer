import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDirectory = path.join(root, 'public');
const outputDirectory = path.join(root, 'dist');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};
const assets = {};

function collectAssets(directory) {
  for (const name of fs.readdirSync(directory).sort()) {
    const filename = path.join(directory, name);
    if (fs.statSync(filename).isDirectory()) {
      collectAssets(filename);
      continue;
    }
    const url = '/' + path.relative(publicDirectory, filename).split(path.sep).join('/');
    assets[url] = {
      body: fs.readFileSync(filename, 'utf8'),
      type: contentTypes[path.extname(filename)] || 'text/plain; charset=utf-8',
    };
  }
}

collectAssets(publicDirectory);
fs.rmSync(outputDirectory, { recursive: true, force: true });

await build({
  entryPoints: [path.join(root, 'worker/index.js')],
  outfile: path.join(outputDirectory, 'server/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  charset: 'utf8',
  plugins: [
    {
      name: 'campus-static-assets',
      setup(builder) {
        // Keep the deployment self-contained while resolving the API's real module graph.
        builder.onResolve({ filter: /^\.\/assets\.js$/ }, (args) => {
          if (args.importer !== path.join(root, 'worker/index.js')) return;
          return { path: 'assets', namespace: 'campus-assets' };
        });
        builder.onLoad({ filter: /.*/, namespace: 'campus-assets' }, () => ({
          contents: 'export const assets = ' + JSON.stringify(assets) + ';',
          loader: 'js',
        }));
      },
    },
  ],
});

fs.mkdirSync(path.join(outputDirectory, '.openai'), { recursive: true });
fs.copyFileSync(
  path.join(root, '.openai/hosting.json'),
  path.join(outputDirectory, '.openai/hosting.json'),
);
console.log(`Built campus Worker with ${Object.keys(assets).length} static assets.`);
