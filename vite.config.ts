/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function logSaverPlugin(): Plugin {
  const logsDir = path.resolve(__dirname, 'logs');
  return {
    name: 'poke-log-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__log/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = Buffer.concat(chunks).toString('utf8');
          if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
          const url = new URL(req.url ?? '', 'http://local');
          const nameParam = url.searchParams.get('name');
          const safeName = nameParam?.replace(/[^a-zA-Z0-9_-]/g, '');
          const file = `session-${safeName || Date.now()}.json`;
          const full = path.join(logsDir, file);
          fs.writeFileSync(full, body);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, path: path.relative(__dirname, full) }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });

      server.middlewares.use('/__log/list', (_req, res) => {
        try {
          if (!fs.existsSync(logsDir)) return res.end(JSON.stringify([]));
          const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.json')).sort().reverse();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(files));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
          return;
        }
      });

      server.middlewares.use('/__log/load', (req, res) => {
        try {
          const url = new URL(req.url ?? '', 'http://local');
          const name = url.searchParams.get('name');
          if (!name) { res.statusCode = 400; res.end('name required'); return; }
          const safe = path.join(logsDir, path.basename(name));
          if (!fs.existsSync(safe)) { res.statusCode = 404; res.end('not found'); return; }
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(safe, 'utf8'));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), logSaverPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      server: {
        deps: {
          inline: [
            // These packages are ESM-only but are being required by CJS dependencies like JSDOM
            /@exodus\/bytes/,
            /html-encoding-sniffer/
          ],
        },
      },
    },
  };
});