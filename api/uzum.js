export default async function handler(req, res) {
    const { path, shopId } = req.query;
    const target = `https://api-seller.uzum.uz/seller-openapi/v1/${path}?shopId=${shopId}&shopIds=${shopId}`;
    
    // ВСТАВЬ СВОЙ ТОКЕН ТУТ
    const AUTH_TOKEN = "WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=";

    try {
        const response = await fetch(target, {
            method: 'GET',
            headers: {
                'Authorization': AUTH_TOKEN,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const rawBody = await response.text();
        res.setHeader('Access-Control-Allow-Origin', '*');

        try {
            const data = JSON.parse(rawBody);
            return res.status(200).json(data);
        } catch (e) {
            return res.status(403).json({ error: "Uzum Blocked", html: rawBody.slice(0, 200) });
        }
    } catch (error) {
        return res.status(500).json({ error: "Proxy Error", details: error.message });
    }
}