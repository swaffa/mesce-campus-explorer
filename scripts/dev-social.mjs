import http from 'node:http';
import { readFile } from 'node:fs/promises';
import worker from '../dist/server/index.js';
import { localEnv } from './local-env.mjs';
const env = localEnv();
env.EVENT_ORGANIZER_KEY = process.env.EVENT_ORGANIZER_KEY || 'local-organizer';
const ctx = {
  waitUntil(p) {
    p.catch(console.error);
  },
};
http
  .createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost:4173').pathname;
      if (/^\/models\/[a-z-]+\.(glb|json)$/.test(path)) {
        try {
          const bytes = await readFile(new URL('../public' + path, import.meta.url));
          res.writeHead(200, {
            'Content-Type': path.endsWith('.glb') ? 'model/gltf-binary' : 'application/json',
            'Cache-Control': 'no-cache',
          });
          res.end(bytes);
        } catch {
          res.writeHead(404);
          res.end('Model not found');
        }
        return;
      }
      const chunks = [];
      for await (const c of req) {
        chunks.push(c);
        if (chunks.reduce((n, c) => n + c.length, 0) > 600000) {
          res.writeHead(413);
          res.end();
          return;
        }
      }
      const request = new Request('http://localhost:4173' + req.url, {
        method: req.method,
        headers: req.headers,
        ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Buffer.concat(chunks) }),
      });
      const result = await worker.fetch(request, env, ctx);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end('Local preview error');
    }
  })
  .listen(4173, () =>
    console.log('Shared-campus preview: http://localhost:4173 (local test database)'),
  );
