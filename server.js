const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// 1. Прокси для Uzum
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        // Берем всё, что идет после /api
        let subPath = req.url.substring(4); 
        
        // Формируем чистый URL для Uzum (без дублей слэшей)
        const uzumUrl = `https://api-seller.uzum.uz${subPath.startsWith('/') ? subPath : '/' + subPath}`;
        
        console.log(`[PROXY] Запрос к Uzum: ${uzumUrl}`);

        axios({
            method: req.method,
            url: uzumUrl,
            headers: { 
                'Authorization': TOKEN, 
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            params: req.query, // Параметры из ссылки (page, size, shopIds)
            data: req.body      // На случай, если будет POST запрос
        })
        .then(response => res.json(response.data))
        .catch(e => {
            console.error(`[PROXY ERROR]`, e.message);
            res.status(e.response ? e.response.status : 500).json({ error: e.message });
        });
        return;
    }
    next();
});

// 2. Раздача статических файлов (index.html, стили)
app.use(express.static(__dirname));

// 3. Запасной вариант для всех остальных путей (вместо *)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));