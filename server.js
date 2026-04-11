const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.static(__dirname));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Обработчик для API
app.use(async (req, res, next) => {
    if (req.url.startsWith('/api')) {
        try {
            // 1. Берем путь и убираем /api
            let subPath = req.url.split('?')[0].replace('/api', '');
            
            // 2. Убираем лишние слэши в начале, чтобы остался только один
            subPath = '/' + subPath.replace(/^\/+/, '');

            const url = `https://api-seller.uzum.uz${subPath}`;
            
            console.log(`[PROXY] Исходящий запрос: ${url}`);

            const response = await axios({
                method: req.method,
                url: url,
                params: req.query, // Важно для shopIds, page, size
                headers: { 
                    'Authorization': TOKEN, 
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            
            return res.json(response.data);
        } catch (e) {
            console.error(`[PROXY ERROR]`, e.message);
            // Возвращаем ошибку в формате JSON, чтобы фронтенд не ломался
            const status = e.response ? e.response.status : 500;
            return res.status(status).json({ 
                error: "Uzum API Error", 
                message: e.message,
                details: e.response ? e.response.data : null
            });
        }
    }
    next();
});

// Для SPA (если путей много)
app.use((req, res) => {
    if (req.method === 'GET' && !req.url.includes('.')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Proxy Server ready on port ${PORT}`));