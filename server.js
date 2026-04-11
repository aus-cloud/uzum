const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.static(__dirname));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

app.use(async (req, res, next) => {
    if (req.url.startsWith('/api/')) {
        try {
            // 1. Очищаем путь: убираем /api/ и всё что после ?
            let subPath = req.url.split('?')[0].replace('/api/', '');
            
            // Удаляем начальный слэш если он остался
            if (subPath.startsWith('/')) subPath = subPath.substring(1);

            const url = `https://api-seller.uzum.uz/${subPath}`;
            
            console.log(`[PROXY] Исходящий запрос: ${url}`);
            console.log(`[PROXY] Параметры:`, req.query);

            const response = await axios.get(url, {
                params: req.query,
                headers: { 
                    'Authorization': TOKEN, 
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            
            res.json(response.data);
        } catch (e) {
            console.error(`[ERROR] ${e.message}`);
            // Выводим подробности ошибки от Uzum, если они есть
            const status = e.response ? e.response.status : 500;
            const errorData = e.response ? e.response.data : e.message;
            res.status(status).json({ error: "Uzum API Error", details: errorData });
        }
    } else {
        next();
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));