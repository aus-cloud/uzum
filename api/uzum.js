export default async function handler(req, res) {
    const { path, shopId } = req.query;
    
    // Собираем URL вручную, чтобы точно не было ошибок
    const target = `https://api-seller.uzum.uz/seller-openapi/v1/${path}?shopId=${shopId}&shopIds=${shopId}`;
    
    try {
        const response = await fetch(target, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://seller.uzum.uz/',
                'Origin': 'https://seller.uzum.uz',
                // Маскируемся под реальный Chrome на Windows
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const contentType = response.headers.get('content-type');
        const rawBody = await response.text();

        // Проверяем, пришел ли нам вообще JSON
        if (contentType && contentType.includes('application/json')) {
            const data = JSON.parse(rawBody);
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(data);
        } else {
            // Если Uzum выплюнул HTML вместо данных
            console.error("Uzum returned non-JSON:", rawBody.slice(0, 100));
            return res.status(403).json({ 
                error: "Uzum blocked the request", 
                details: "Uzum returned HTML. Possibly a captcha or block." 
            });
        }
    } catch (error) {
        return res.status(500).json({ error: "Proxy failure", details: error.message });
    }
}