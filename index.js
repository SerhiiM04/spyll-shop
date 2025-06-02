const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Настройка хранилища для квитанций
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Загрузка квитанции
app.post('/api/upload-receipt', upload.single('receipt'), (req, res) => {
  const username = req.body.username || 'unknown';
  const filepath = req.file.path;

  const entry = {
    username,
    file: filepath,
    timestamp: new Date().toISOString()
  };

  const dbPath = './data/topups.json';
  const topups = fs.existsSync(dbPath)
    ? JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    : [];
  topups.push(entry);
  fs.writeFileSync(dbPath, JSON.stringify(topups, null, 2));
  res.send({ success: true });
});

// Получение всех пополнений
app.get('/admin/topups', (req, res) => {
  const dbPath = './data/topups.json';
  const topups = fs.existsSync(dbPath)
    ? JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    : [];
  res.json(topups);
});

// Главная страница мини-приложения
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Spyll_Shop запущен на http://localhost:${PORT}`);
});
