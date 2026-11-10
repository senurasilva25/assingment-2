import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadChatHandler } from './chat.mjs';

const root = path.resolve('dist');
const chat = await loadChatHandler();
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
http
  .createServer((req, res) => {
    void chat(req, res, async () => {
      try {
        if (!['GET', 'HEAD'].includes(req.method)) {
          res.writeHead(405);
          res.end();
          return;
        }
        const pathname = decodeURIComponent(
          new URL(req.url, 'http://localhost').pathname,
        );
        const file = path.resolve(
          root,
          '.' + (pathname === '/' ? '/index.html' : pathname),
        );
        if (!file.startsWith(root + path.sep)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const data = await fs.readFile(file);
        res.writeHead(200, {
          'Content-Type':
            types[path.extname(file)] || 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
        });
        res.end(req.method === 'HEAD' ? undefined : data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
  })
  .listen(
    Number(process.env.PORT) || 3000,
    process.env.HOST || '127.0.0.1',
    () =>
      console.log(
        'Phone Fix server ready on port ' + (process.env.PORT || 3000),
      ),
  );
