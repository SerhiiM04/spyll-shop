const express = require('express'); const fs = require('fs'); const path = require('path'); const multer = require('multer'); const cors = require('cors');

const app = express(); const PORT = process.env.PORT || 10000;

app.use(cors()); app.use(express.json()); app.use(express.static('public')); app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

const CONFIG_PATH = 'config.json'; const ORDERS_PATH = 'orders.json';

// Ensure files exist if (!fs.existsSync(CONFIG_PATH)) { fs.writeFileSync(CONFIG_PATH, JSON.stringify({ premium3: 150, premium6: 280, premium12: 520, starsBase: 1.0, starsPromo: 0.8 }, null, 2)); } if (!fs.existsSync(ORDERS_PATH)) { fs.writeFileSync(ORDERS_PATH, '[]'); }

// Load prices app.get('/api/prices', (req, res) => { const config = JSON.parse(fs.readFileSync(CONFIG_PATH)); res.json(config); });

app.post('/api/prices', (req, res) => { fs.writeFileSync(CONFIG_PATH, JSON.stringify(req.body, null, 2)); res.json({ success: true }); });

// Load config (for front + admin) app.get('/api/config', (req, res) => { const config = JSON.parse(fs.readFileSync(CONFIG_PATH)); res.json({ star_price: config.starsBase, promo_price: config.starsPromo, promo_min: 500 }); });

// Handle new payment submission app.post('/api/submit-payment', upload.single('screenshot'), (req, res) => { const orders = JSON.parse(fs.readFileSync(ORDERS_PATH)); const { productId, userId, username } = req.body; const fileName = req.file ? req.file.filename : null;

const config = JSON.parse(fs.readFileSync(CONFIG_PATH)); let description = ''; let price = 0; let stars = 0;

if (productId === 'stars') { stars = parseInt(req.body.stars || 0); price = stars >= 500 ? stars * config.starsPromo : stars * config.starsBase; description = Покупка звёзд; } else if (productId === 'premium3') { price = config.premium3; description = 'Telegram Premium на 3 месяца'; } else if (productId === 'premium6') { price = config.premium6; description = 'Telegram Premium на 6 месяцев'; } else if (productId === 'premium12') { price = config.premium12; description = 'Telegram Premium на 12 месяцев'; }

const newOrder = { id: Date.now(), productId, userId, username, price: price.toFixed(2), stars, fileName, status: 'pending', timestamp: Date.now(), description };

orders.unshift(newOrder); fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2)); res.json({ success: true }); });

// Get all orders app.get('/api/orders', (req, res) => { const orders = JSON.parse(fs.readFileSync(ORDERS_PATH)); res.json(orders); });

// Update order status app.post('/api/orders/:id/status', (req, res) => { const orders = JSON.parse(fs.readFileSync(ORDERS_PATH)); const orderId = parseInt(req.params.id); const { status } = req.body;

const order = orders.find(o => o.id === orderId); if (order) { order.status = status; fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2)); res.json({ success: true }); } else { res.status(404).json({ error: 'Order not found' }); } });

app.listen(PORT, () => console.log(Server running on port ${PORT}));

