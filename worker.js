const UZUM_API_BASE = 'https://api-seller.uzum.uz/api/seller-openapi/v1';

export default {
  async fetch(request) {
    // 1. Формируем универсальные CORS-заголовки
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };

    // 2. Ответ на preflight-запрос браузера (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // 3. Если запрос идет к /api-uzum/...
    if (url.pathname.startsWith('/api-uzum')) {
      // Отрезаем префикс /api-uzum и формируем реальный URL к Uzum
      const targetPath = url.pathname.replace(/^\/api-uzum/, '');
      const targetUrl = `${UZUM_API_BASE}${targetPath}${url.search}`;

      // Копируем заголовки оригинального запроса
      const headers = new Headers(request.headers);
      headers.set('Host', 'api-seller.uzum.uz');
      headers.delete('cf-connecting-ip');
      headers.delete('cf-ray');
      headers.delete('cf-visitor');

      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: headers,
          body: ['GET', 'HEAD'].includes(request.method) ? null : await request.arrayBuffer(),
        });

        // Забираем ответ и добавляем CORS-заголовки
        const responseHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Proxy Error', details: err.message }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Worker Active', { status: 200, headers: corsHeaders });
  },
};