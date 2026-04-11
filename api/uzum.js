export default async function handler(req, res) {
    const { path, shopId } = req.query;
    
    // Формируем URL вручную для надежности
    const target = `https://api-seller.uzum.uz/seller-openapi/v1/${path}?shopId=${shopId}&shopIds=${shopId}`;
    
    try {
        const response = await fetch(target, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const data = await response.json();
        
        // CORS заголовки
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Uzum", details: error.message });
    }
}