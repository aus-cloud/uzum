const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static('.'));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Самый надежный способ для новых версий Express
app.get('/api/*', async (req, res) => {
    try {
        // Получаем чистый путь после /api/
        const subPath = req.params[0] || req.url.replace('/api/', '').split('?')[0];
        
        const url = `https://api-seller.uzum.uz/${subPath}`;
        
        console.log(`Запрос к Uzum: ${url}`); // Для отладки в логах Render

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
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));