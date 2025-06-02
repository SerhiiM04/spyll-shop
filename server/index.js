const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use('/public', express.static(path.join(__dirname, '../public')));

const dbPath = path.join(__dirname, 'db.json');

// Хранилище для скриншотов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'upload'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Получение всех товаров
app.get('/api/products', async (req, res) => {
  const db = await fs.readJson(dbPath);
  res.json(db.products || []);
});

// Получение баланса пользователя
app.get('/api/balance/:username', async (req, res) => {
  const db = await fs.readJson(dbPath);
  const user = db.users[req.params.username] || {
    stars: 0,
    uah: 0
  };
  res.json(user);
});

// Пополнение (с загрузкой скрина)
app.post('/api/topup', upload.single('screenshot'), async (req, res) => {
  const { username, amount } = req.body;
  const db = await fs.readJson(dbPath);

  db.topups = db.topups || [];
  db.topups.push({
    id: Date.now(),
    username,
    amount,
    status: 'pending',
    screenshot: `/upload/${req.file.filename}`
  });

  await fs.writeJson(dbPath, db, { spaces: 2 });
  res.json({ success: true });
});

// История пополнений
app.get('/api/topups/:username', async (req, res) => {
  const db = await fs.readJson(dbPath);
  const all = db.topups || [];
  const filtered = all.filter(t => t.username === req.params.username);
  res.json(filtered);
});

// Подтверждение/отмена админом
app.post('/api/topup/status', async (req, res) => {
  const { id, action, reason } = req.body;
  const db = await fs.readJson(dbPath);

  const topup = db.topups.find(t => t.id === id);
  if (!topup) return res.status(404).json({ error: 'Not found' });

  topup.status = action;
  if (reason) topup.reason = reason;

  if (action === 'approved') {
    db.users[topup.username] = db.users[topup.username] || { stars: 0, uah: 0 };
    db.users[topup.username].uah += parseFloat(topup.amount);
  }

  await fs.writeJson(dbPath, db, { spaces: 2 });
  res.json({ success: true });
});

// Добавление заказа (из магазина)
app.post('/api/order', async (req, res) => {
  const { username, productId } = req.body;
  const db = await fs.readJson(dbPath);

  const product = (db.products || []).find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.orders = db.orders || [];
  db.orders.push({
    id: Date.now(),
    username,
    productId,
    status: 'pending'
  });

  await fs.writeJson(dbPath, db, { spaces: 2 });
  res.json({ success: true });
});

// Получение заказов (для админа)
app.get('/api/orders', async (req, res) => {
  const db = await fs.readJson(dbPath);
  res.json(db.orders || []);
});

// Подтверждение заказа (отправка товара)
app.post('/api/order/status', async (req, res) => {
  const { id, status } = req.body;
  const db = await fs.readJson(dbPath);

  const order = db.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;

  await fs.writeJson(dbPath, db, { spaces: 2 });
  res.json({ success: true });
});

// Добавление нового товара (админ)
app.post('/api/product', async (req, res) => {
  const { name, price, image, type } = req.body;
  const db = await fs.readJson(dbPath);

  db.products = db.products || [];
  db.products.push({
    id: Date.now(),
    name,
    price,
    image,
    type
  });

  await fs.writeJson(dbPath, db, { spaces: 2 });
  res.json({ success: true });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
