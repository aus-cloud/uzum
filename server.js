const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// 1. ПРОКСИ ЧЕРЕЗ ФУНКЦИЮ (Никаких путей со звездами)
const handleProxy = async (req, res) => {
    try {
        // Вычисляем путь: отрезаем /api
        const subPath = req.url.split('?')[0].replace('/api', '');
        const targetUrl = `https://api-seller.uzum.uz${subPath}`;
        
        console.log(`[PROXY] Направляю на Uzum: ${targetUrl}`);

        const response = await axios({
            method: req.method,
            url: targetUrl,
            params: req.query,
            headers: {
                'Authorization': TOKEN,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        res.json(response.data);
    } catch (e) {
        console.error(`[PROXY ERROR] ${e.message}`);
        res.status(e.response ? e.response.status : 500).json({ 
            error: "Uzum API Error", 
            details: e.response ? e.response.data : e.message 
        });
    }
};

// 2. ГЛАВНЫЙ ОБРАБОТЧИК (Middleware)
app.use((req, res, next) => {
    // Если это запрос к API
    if (req.url.startsWith('/api')) {
        return handleProxy(req, res);
    }
    
    // Если это статический файл (картинка, js, css)
    if (req.url.includes('.')) {
        return next();
    }

    // Во всех остальных случаях отдаем index.html
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));