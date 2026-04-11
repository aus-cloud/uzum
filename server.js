const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static('.'));

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Используем синтаксис (.*) — это "захват всего" для Express 5
app.get('/api/:endpoint(*)', async (req, res) => {
    try {
        // endpoint будет содержать всё, что идет после /api/
        const endpoint = req.params.endpoint;
        const url = `https://api-seller.uzum.uz/${endpoint}`;
        
        console.log(`Target URL: ${url}`); // Полезно для логов Render

        const response = await axios.get(url, {
            params: req.query,
            headers: { 
                'Authorization': TOKEN, 
                'Accept': 'application/json' 
            }
        });
        
        res.json(response.data);
    } catch (e) {
        console.error('Proxy Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));