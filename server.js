const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static('.')); // Позволяет серверу отдавать ваш index.html

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';

// Прокси-запрос
app.get('/api/*', async (req, res) => {
    try {
        const url = `https://api-seller.uzum.uz/${req.params[0]}?${new URLSearchParams(req.query).toString()}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': TOKEN, 'Accept': 'application/json' }
        });
        res.json(response.data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));