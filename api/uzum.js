export default async function handler(req, res) {
    const { path, shopId } = req.query;
    
    // Формируем реальный адрес к Uzum
    let targetUrl = `https://api-seller.uzum.uz/seller-openapi/v1/${path}`;
    if (shopId) targetUrl += `?shopId=${shopId}&shopIds=${shopId}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                // Здесь можно добавить заголовки, если Uzum их потребует
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        // Добавляем заголовки CORS, чтобы твой index.html мог читать данные
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Ошибка сервера Uzum', details: error.message });
    }
}