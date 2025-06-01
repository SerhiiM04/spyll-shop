const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('images'));

const upload = multer({ dest: 'uploads/' });
const imageUpload = multer({ dest: 'images/' });

const configPath = './config.json';
const ordersPath = './orders.json';

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function loadOrders() {
  if (!fs.existsSync(ordersPath)) fs.writeFileSync(ordersPath, '[]');
  return JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
}

function saveOrders(data) {
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
}

app.get('/api/prices', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/prices', (req, res) => {
  saveConfig(req.body);
  res.sendStatus(200);
});

app.post('/api/upload-images', imageUpload.fields([
  { name: 'premium', maxCount: 1 },
  { name: 'stars', maxCount: 1 }
]), (req, res) => {
  const config = loadConfig();
  if (req.files.premium) {
    config.premiumImage = `/images/${req.files.premium[0].filename}`;
  }
  if (req.files.stars) {
    config.starsImage = `/images/${req.files.stars[0].filename}`;
  }
  saveConfig(config);
  res.sendStatus(200);
});

app.post('/api/submit-payment', upload.single('screenshot'), (req, res) => {
  const config = loadConfig();
  const orders = loadOrders();

  const newOrder = {
    id: orders.length + 1,
    userId: req.headers['x-telegram-id'] || Date.now(),
    username: req.headers['x-telegram-user'] || '',
    description:
      req.body.productId === 'stars'
        ? `⭐ Покупка звёзд (${req.body.stars})`
        : `Telegram Premium (${req.body.productId})`,
    stars: +req.body.stars || 0,
    price: calculatePrice(config, req.body),
    status: 'pending',
    fileName: req.file?.filename || '',
    timestamp: Date.now(),
    reason: '',
  };

  orders.push(newOrder);
  saveOrders(orders);
  res.sendStatus(200);
});

function calculatePrice(config, data) {
  if (data.productId === 'premium3') return config.premium3;
  if (data.productId === 'premium6') return config.premium6;
  if (data.productId === 'premium12') return config.premium12;
  if (data.productId === 'stars') {
    const perStar = +data.stars >= config.promoLimit ? config.starsPromo : config.starsBase;
    return (perStar * data.stars).toFixed(2);
  }
  return 0;
}

app.get('/api/orders', (req, res) => {
  res.json(loadOrders());
});

app.get('/api/orders/status', (req, res) => {
  const id = req.headers['x-telegram-id'];
  const order = loadOrders().reverse().find(o => o.userId == id);
  if (!order) return res.json({ status: null });
  res.json({ status: order.status });
});

app.get('/api/orders/user', (req, res) => {
  const id = req.headers['x-telegram-id'];
  const userOrders = loadOrders().filter(o => o.userId == id);
  res.json(userOrders);
});

app.post('/api/orders/:id/status', (req, res) => {
  const orders = loadOrders();
  const index = orders.findIndex(o => o.id == req.params.id);
  if (index === -1) return res.sendStatus(404);
  orders[index].status = req.body.status;
  orders[index].reason = req.body.reason || '';
  saveOrders(orders);
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`✅ Сервер запущен на порту ${PORT}`));
