import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

function apiDevPlugin(): Plugin {
  return {
    name: 'vite-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const host = req.headers.host || 'localhost:5173';
          const fullUrl = new URL(req.url, `http://${host}`);
          const routeName = fullUrl.pathname.replace(/^\/api\//, '').split('/')[0];
          const apiFilePath = path.resolve(process.cwd(), `api/${routeName}.js`);

          if (!fs.existsSync(apiFilePath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: `API route /api/${routeName} not found` }));
          }

          const query: Record<string, string> = {};
          fullUrl.searchParams.forEach((val, key) => {
            query[key] = val;
          });
          req.query = query;

          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const raw = Buffer.concat(chunks);
            req.rawBody = raw;
            const bodyStr = raw.toString('utf-8');
            try {
              req.body = bodyStr ? JSON.parse(bodyStr) : {};
            } catch {
              req.body = {};
            }
          }

          res.status = function (code: number) {
            res.statusCode = code;
            return res;
          };
          res.json = function (data: any) {
            if (!res.getHeader('Content-Type')) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
            return res;
          };

          const mod = await server.ssrLoadModule(`./api/${routeName}.js`);
          const handler = mod.default || mod;
          await handler(req, res);
        } catch (err: any) {
          console.error(`[API Dev Error] ${req.url}:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal API Error' }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    server: {
      host: '0.0.0.0',
    },
  };
});
