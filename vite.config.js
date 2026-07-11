/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno incluyendo GEMINI_API_KEY
  // Se usa '' como prefijo para que cargue TODAS las variables (no solo VITE_)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'gemini-proxy',
        /**
         * Proxy para Gemini API: recibe peticiones del frontend en /api/gemini
         * e inyecta la API key desde el servidor (nunca expuesta al cliente).
         * Esto evita exponer GEMINI_API_KEY en el bundle del navegador
         */
        configureServer(server) {
          server.middlewares.use('/api/gemini', async (req, res) => {
            try {
              const apiKey = env.GEMINI_API_KEY;

              // Si no hay key configurada, responde con error claro
              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY no configurada en .env' }));
                return;
              }

              // Acumula el body de la petición POST del frontend
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', async () => {
                try {
                  // Extraer el modelo del body (default: gemini-2.5-flash)
                  let parsed;
                  try { parsed = JSON.parse(body); } catch { parsed = {}; }
                  const model = parsed?.model || 'gemini-2.5-flash';
                  const allowedModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite'];
                  const resolvedModel = allowedModels.includes(model) ? model : 'gemini-2.5-flash';
                  // Quitar el campo model del body antes de reenviar a Gemini
                  if (parsed?.model) { delete parsed.model; const forwarded = JSON.stringify(parsed); body = forwarded; }

                  // Timeout de 30s para evitar cuelgues
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 30000);
                  // Reenvía la petición a Gemini API con la key y modelo inyectados
                  const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: controller.signal }
                  );
                  clearTimeout(timeout);
                  const data = await response.json();
                  // Inyectar el modelo usado para que el frontend lo sepa
                  data._model = resolvedModel;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } catch (err) {
              // Captura errores no esperados en el handler externo
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        },
      },
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test-setup.js',
    },
  };
});
