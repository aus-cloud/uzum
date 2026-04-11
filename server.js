const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// Статические файлы (картинки, стили)
app.use(express.static(__dirname));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Универсальный обработчик (Middleware)
app.use(async (req, res, next) => {
    // 1. Проверяем, идет ли запрос к API Uzum
    if (req.url.startsWith('/api/')) {
        try {
            // Отрезаем /api/ и получаем чистый путь к Uzum
            const subPath = req.url.split('?')[0].replace('/api/', '');
            const url = `https://api-seller.uzum.uz/${subPath}`;
            
            console.log(`[PROXY] Запрос: ${url}`);

            const response = await axios.get(url, {
                params: req.query,
                headers: { 
                    'Authorization': TOKEN, 
                    'Accept': 'application/json' 
                }
            });
            
            return res.json(response.data);
        } catch (e) {
            console.error(`[PROXY ERROR] ${e.message}`);
            return res.status(e.response ? e.response.status : 500).json({ error: e.message });
        }
    }

    // 2. Если это не API и не файл, отдаем index.html (для SPA)
    // Проверяем, что это GET запрос и в пути нет точки (значит не картинка/скрипт)
    if (req.method === 'GET' && !req.url.includes('.')) {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }

    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is LIVE on port ${PORT}`));