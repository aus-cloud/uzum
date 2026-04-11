const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.static(__dirname));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Используем Middleware вместо app.get — это обходит все проверки path-to-regexp
app.use((req, res, next) => {
    // Если запрос начинается на /api/
    if (req.url.startsWith('/api/')) {
        const endpoint = req.url.replace('/api/', '').split('?')[0];
        const url = `https://api-seller.uzum.uz/${endpoint}`;
        
        console.log(`Forwarding to Uzum: ${url}`);

        axios.get(url, {
            params: req.query,
            headers: { 
                'Authorization': TOKEN, 
                'Accept': 'application/json' 
            }
        })
        .then(response => res.json(response.data))
        .catch(e => {
            console.error('Uzum Error:', e.message);
            res.status(e.response ? e.response.status : 500).json({ error: e.message });
        });
    } else {
        // Если это не API, просто идем дальше (к статическим файлам)
        next();
    }
});

// Для всех остальных путей просто отдаем index.html
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.includes('.')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        next();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server LIVE on port ${PORT}`));