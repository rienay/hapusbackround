import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      proxy: {
        '/api/remove-bg': {
          target: 'http://127.0.0.1:5005',
          changeOrigin: true,
        },
        '/api/health': {
          target: 'http://127.0.0.1:5005',
          changeOrigin: true,
        },
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    preview: {
      port: 3000,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    plugins: [
      {
        name: 'dev-api-serverless-shim',
        configureServer(server) {
          server.middlewares.use('/api/create-payment', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = body ? JSON.parse(body) : {};
                const apiKey = env.SUMOPOD_API_KEY || process.env.SUMOPOD_API_KEY;
                const apiUrl = env.SUMOPOD_API_URL || process.env.SUMOPOD_API_URL || 'https://api-pay-sandbox.sumopod.com/api/v1/payments';

                const payload = {
                  order_id: parsed.order_id || `PUDDING-${Date.now()}`,
                  amount: parseInt(parsed.amount, 10) || 2000,
                  currency: 'IDR',
                  expires_in_hours: 1,
                  payment_method_type_code: 'QRIS',
                };

                if (parsed.return_url && parsed.return_url.startsWith('https://')) {
                  payload.success_return_url = parsed.return_url;
                  payload.cancel_return_url = parsed.return_url;
                }

                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey,
                  },
                  body: JSON.stringify(payload),
                });

                const data = await response.json();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = response.status;
                res.end(JSON.stringify(data));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          });
        },
      },
    ],
  };
});
