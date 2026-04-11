const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// 1. СНАЧАЛА ОБРАБАТЫВАЕМ API
app.use(async (req, res, next) => {
    if (req.url.startsWith('/api')) {
        try {
            // Вырезаем путь (например, из /api/v1/test получаем /v1/test)
            let subPath = req.url.substring(4); 
            if (!subPath.startsWith('/')) subPath = '/' + subPath;
            
            const url = `https://api-seller.uzum.uz${subPath}`;
            console.log(`[PROXY] Forwarding to: ${url}`);

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
            console.error(`[PROXY ERROR]`, e.message);
            return res.status(e.response ? e.response.status : 500).json({ error: e.message });
        }
    }
    next();
});

// 2. ПОТОМ СТАТИЧЕСКИЕ ФАЙЛЫ
app.use(express.static(__dirname));

// 3. И В КОНЦЕ ОТДАЕМ INDEX.HTML ДЛЯ ВСЕГО ОСТАЛЬНОГО
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));