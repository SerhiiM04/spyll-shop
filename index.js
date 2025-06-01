const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

const CONFIG_PATH = 'config.json';
const ORDERS_PATH = 'orders.json';

// Ensure files exist
if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({
        premium3: 150,
        premium6: 280,
        premium12: 520,
        starsBase: 1.0,
        starsPromo: 0.8
    }, null, 2));
}

if (!fs.existsSync(ORDERS_PATH)) {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify([], null, 2));
}

// Load prices
app.get('/api/prices', (req, res) => {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    res.json(config);
});

// Save prices
app.post('/api/prices', (req, res) => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

// Serve config to frontend
app.get('/api/config', (req, res) => {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    res.json(config);
});

// Submit payment
app.post('/api/submit-payment', upload.single('screenshot'), (req, res) => {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    let description = '';
    let price = 0;
    let stars = 0;

    const { productId, username, userId } = req.body;
    const fileName = req.file ? req.file.filename : '';

    if (productId === 'premium3') {
        description = 'Telegram Premium – 3 месяца';
        price = config.premium3;
    } else if (productId === 'premium6') {
        description = 'Telegram Premium – 6 месяцев';
        price = config.premium6;
    } else if (productId === 'premium12') {
        description = 'Telegram Premium – 12 месяцев';
        price = config.premium12;
    } else if (productId === 'stars') {
        stars = parseInt(req.body.stars || 0);
        price = stars >= 500 ? stars * config.starsPromo : stars * config.starsBase;
        description = `Покупка ${stars} звёзд`;
    }

    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH));
    const newOrder = {
        id: Date.now(),
        productId,
        username,
        userId,
        description,
        price: price.toFixed(2),
        stars,
        fileName,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    orders.unshift(newOrder);
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
    res.json({ success: true });
});

// Get orders
app.get('/api/orders', (req, res) => {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH));
    res.json(orders);
});

// Update order status
app.post('/api/orders/:id/status', (req, res) => {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH));
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = req.body.status;
        fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
