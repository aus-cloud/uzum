const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// Статические файлы (картинки, стили)
app.use(express.static(__dirname));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

app.use(async (req, res, next) => {
    // Проверяем, начинается ли путь с /api
    if (req.url.startsWith('/api')) {
        try {
            // Удаляем '/api' из начала пути
            // Если запрос был /api/v1/test, станет /v1/test
            let subPath = req.url.replace('/api', '');
            
            // Если после удаления остался двойной слэш или его нет, правим
            if (!subPath.startsWith('/')) subPath = '/' + subPath;

            const url = `https://api-seller.uzum.uz${subPath}`;
            
            console.log(`[PROXY] Направляю запрос в Uzum: ${url}`);

            const response = await axios.get(url, {
                params: req.query,
                headers: { 
                    'Authorization': TOKEN, 
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            
            return res.json(response.data);
        } catch (e) {
            console.error(`[PROXY ERROR] Ошибка при запросе к ${req.url}: ${e.message}`);
            return res.status(e.response ? e.response.status : 500).json({ 
                error: "Uzum API Error", 
                message: e.message 
            });
        }
    }
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is LIVE on port ${PORT}`));