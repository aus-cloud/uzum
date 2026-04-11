const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// 1. ПРОКСИ (Обрабатываем API через Middleware)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        let subPath = req.url.substring(4); // Убираем "/api"
        if (!subPath.startsWith('/')) subPath = '/' + subPath;
        
        const url = `https://api-seller.uzum.uz${subPath.split('?')[0]}`;
        
        console.log(`[PROXY] Исходящий адрес: ${url}`);

        axios.get(url, {
            params: req.query,
            headers: { 
                'Authorization': TOKEN, 
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        })
        .then(response => res.json(response.data))
        .catch(e => {
            console.error(`[PROXY ERROR] ${e.message}`);
            res.status(e.response ? e.response.status : 500).json({ error: e.message });
        });
        return; // Важно: выходим, чтобы не идти дальше в статику
    }
    next();
});

// 2. СТАТИКА
app.use(express.static(__dirname));

// 3. ОБРАБОТКА ОСТАЛЬНЫХ ПУТЕЙ (Вместо app.get('*'))
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is LIVE on port ${PORT}`));