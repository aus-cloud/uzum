export default async function handler(req, res) {
    // Разрешаем CORS сразу
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { path, shopId } = req.query;
    
    // Исправляем формирование URL
    const baseUrl = 'https://api-seller.uzum.uz/seller-openapi/v1';
    let targetUrl = `${baseUrl}/${path}`;
    
    // Добавляем параметры корректно
    const urlWithParams = new URL(targetUrl);
    if (shopId) {
        urlWithParams.searchParams.append('shopId', shopId);
        urlWithParams.searchParams.append('shopIds', shopId);
    }
    // Для заказов добавляем дефолтные размер и страницу
    if (path.includes('orders')) {
        urlWithParams.searchParams.append('page', '0');
        urlWithParams.searchParams.append('size', '50');
    }

    try {
        const response = await fetch(urlWithParams.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // Маскируемся под обычный браузер
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const text = await response.text(); // Сначала получаем текст, чтобы не упасть на пустом ответе
        
        try {
            const data = JSON.parse(text);
            return res.status(response.status).json(data);
        } catch (e) {
            // Если Uzum вернул не JSON (например, ошибку текстом)
            return res.status(response.status).send(text);
        }

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}