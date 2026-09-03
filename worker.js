const UZUM_API_BASE = 'https://api-seller.uzum.uz/api/seller-openapi/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
};

export default {
  async fetch(request, env, ctx) {
    // 1. Обработка OPTIONS (Preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // Перенаправляем все запросы вида /api-uzum/* на Uzum API
    if (url.pathname.startsWith('/api-uzum/')) {
      const targetPath = url.pathname.replace('/api-uzum', '');
      const targetUrl = `${UZUM_API_BASE}${targetPath}${url.search}`;

      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set('Host', 'api-seller.uzum.uz');

      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: modifiedHeaders,
          body: ['GET', 'HEAD'].includes(request.method) ? null : await request.arrayBuffer(),
        });

        // Клонируем заголовки и добавляем CORS
        const newHeaders = new Headers(response.headers);
        Object.keys(corsHeaders).forEach((key) => {
          newHeaders.set(key, corsHeaders[key]);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Worker Active', { status: 200, headers: corsHeaders });
  },
};