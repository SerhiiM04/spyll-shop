
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// In-memory storage (in production, use a database)
let orders = [];
let prices = {
  premium3: 150, // UAH
  premium6: 280, // UAH
  premium12: 500, // UAH
  starsBase: 10, // UAH per star
  starsPromo: 8 // UAH per star (promotional)
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/prices', (req, res) => {
  res.json(prices);
});

app.post('/api/prices', (req, res) => {
  prices = { ...prices, ...req.body };
  res.json({ success: true });
});

app.post('/api/order', (req, res) => {
  const order = {
    id: Date.now(),
    ...req.body,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  orders.push(order);
  res.json({ success: true, orderId: order.id });
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = req.body.status;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
