const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка middleware для разбора JSON и URL-encoded данных
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Обслуживаем статические файлы из папки public
app.use(express.static('public'));

// Настройка хранения для загруженных файлов (скриншотов)
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Простой in-memory массив для хранения транзакций (для демонстрации; для продакшна стоит использовать БД)
let transactions = [];

/*
  API для подтверждения платежа.
  Ожидается, что на фронтенде будет отправлен formData с полями:
  - username
  - amount
  - currency
  - screenshot (файл, обязательный для подтверждения платежа)
*/
app.post('/api/confirm-payment', upload.single('screenshot'), (req, res) => {
  const { username, amount, currency } = req.body;
  const screenshot = req.file ? req.file.filename : null;
  if (!username || !amount || !currency || !screenshot) {
    return res.status(400).json({ message: 'Не все поля заполнены' });
  }

  const transaction = {
    id: transactions.length + 1,
    username,
    amount,
    currency,
    screenshot,
    status: 'pending', // статус "в ожидании" до подтверждения администратором
    timestamp: new Date()
  };

  transactions.push(transaction);

  // В реальной реализации можно добавить уведомление администратору
  res.json({
    message: 'Ваш платеж подтвержден, ожидайте...',
    transactionId: transaction.id,
    estimatedTime: '1-5 минут (максимум 24 часа)'
  });
});

// Получение истории транзакций для пользователя
app.get('/api/transaction-history/:username', (req, res) => {
  const username = req.params.username;
  const history = transactions.filter(t => t.username === username);
  res.json({ history });
});

// Админ: получение всех ожидающих транзакций (пополнений)
app.get('/api/admin/transactions', (req, res) => {
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  res.json({ pendingTransactions });
});

// Админ: подтверждение транзакции
app.post('/api/admin/confirm-transaction', (req, res) => {
  const { transactionId } = req.body;
  const transaction = transactions.find(t => t.id === parseInt(transactionId));
  if (!transaction) {
    return res.status(404).json({ message: 'Транзакция не найдена' });
  }
  transaction.status = 'confirmed';
  res.json({ message: `Транзакция ${transactionId} подтверждена` });
});

// Админ: отклонение транзакции с указанием причины
app.post('/api/admin/reject-transaction', (req, res) => {
  const { transactionId, reason } = req.body;
  const transaction = transactions.find(t => t.id === parseInt(transactionId));
  if (!transaction) {
    return res.status(404).json({ message: 'Транзакция не найдена' });
  }
  transaction.status = 'rejected';
  transaction.rejectReason = reason;
  res.json({ message: `Транзакция ${transactionId} отклонена. Причина: ${reason}` });
});

// Здесь можно добавить дополнительные endpoint'ы, например:
// - для осуществления покупки товаров (Телеграм премиум, Stars и т.д.)
// - для обработки вывода средств у Stars
// - для управления заказами в админке

app.listen(PORT, () => {
  console.log(`Server запущен на порту ${PORT}`);
});
