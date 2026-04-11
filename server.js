const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// Указываем серверу, где лежат ваши файлы (index.html)
app.use(express.static(__dirname));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Используем регулярное выражение напрямую — это работает везде
app.get(/^\/api\/(.*)/, async (req, res) => {
    try {
        // Извлекаем путь из параметров запроса
        const endpoint = req.params[0];
        const url = `https://api-seller.uzum.uz/${endpoint}`;
        
        console.log(`Запрос к Uzum: ${url}`);

        const response = await axios.get(url, {
            params: req.query,
            headers: { 
                'Authorization': TOKEN, 
                'Accept': 'application/json' 
            }
        });
        
        res.json(response.data);
    } catch (e) {
        console.error('Ошибка прокси:', e.message);
        res.status(e.response ? e.response.status : 500).json({ 
            error: e.message,
            details: e.response ? e.response.data : null 
        });
    }
});

// Для всех остальных запросов отдаем index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));