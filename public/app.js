const content = document.getElementById('content');
const sectionTitle = document.getElementById('section-title');
const themeToggle = document.getElementById('theme-toggle');
const navButtons = document.querySelectorAll('.bottom-nav button');

let currentTab = 'shop';

// === Темная тема ===
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// === Переключение вкладок ===
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    navButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    const tab = button.dataset.tab;
    currentTab = tab;
    loadTab(tab);
  });
});

function loadTab(tab) {
  sectionTitle.textContent = {
    profile: 'Профиль',
    shop: 'Магазин',
    games: 'Мини-Игры',
    wallet: 'Кошелёк'
  }[tab] || 'Spyll_Shop';

  content.innerHTML = '';

  switch (tab) {
    case 'shop':
      loadShop();
      break;
    case 'wallet':
      loadWallet();
      break;
    case 'profile':
      loadProfile();
      break;
    case 'games':
      content.innerHTML = `<p>Игры скоро будут доступны 🎮</p>`;
      break;
  }
}

// === Магазин ===
function loadShop() {
  const products = [
    {
      name: 'Telegram Premium – 3 месяца',
      price: '165 UAH',
      image: 'https://telegram.org/img/t_logo.png'
    },
    {
      name: 'Telegram Premium – 6 месяцев',
      price: '330 UAH',
      image: 'https://telegram.org/img/t_logo.png'
    },
    {
      name: 'Telegram Premium – 12 месяцев',
      price: '660 UAH',
      image: 'https://telegram.org/img/t_logo.png'
    }
  ];

  products.forEach(prod => {
    const el = document.createElement('div');
    el.className = 'product';
    el.innerHTML = `
      <img src="${prod.image}" alt="${prod.name}" />
      <div class="product-info">
        <div class="product-name">${prod.name}</div>
        <div class="product-price">${prod.price}</div>
      </div>
    `;
    content.appendChild(el);
  });
}

// === Профиль ===
function loadProfile() {
  content.innerHTML = `
    <div style="text-align:center">
      <img src="https://t.me/i/userpic/320/username.jpg" alt="avatar" style="width:80px;height:80px;border-radius:50%;margin-bottom:10px;">
      <div style="font-weight:600;margin-bottom:10px">@username</div>
      <button onclick="alert('Здесь будет история пополнений')" style="padding:8px 12px;border:none;background:var(--accent);color:white;border-radius:8px;">История Пополнений</button>
    </div>
  `;
}

// === Кошелёк ===
function loadWallet() {
  content.innerHTML = `
    <div class="wallet-item">
      <img src="https://cdn-icons-png.flaticon.com/512/3621/3621407.png" style="width:24px;height:24px;vertical-align:middle;"> 
      Stars: <b>120</b> <button style="margin-left:10px;" onclick="alert('Запрос на вывод отправлен')">Вывести</button>
    </div>
    <div class="wallet-item">
      <img src="https://cdn-icons-png.flaticon.com/512/330/330439.png" style="width:24px;height:24px;vertical-align:middle;"> 
      UAH: <b>250</b> <button style="margin-left:10px;" onclick="showTopUp()">Пополнить</button>
    </div>
    <div id="topup-form" style="margin-top:20px;display:none;">
      <p><b>Перевод на карту:</b><br>Номер карты: <span style="user-select:all;">5355280218976700</span><br>Комментарий: <b>Подарок</b></p>
      <input type="file" id="receipt" accept="image/*,application/pdf"><br><br>
      <button onclick="confirmTopUp()">Подтвердить оплату</button>
      <p style="font-size:13px;color:gray;">Обычно зачисление происходит в течение 1–5 минут. Максимальное время ожидания — 24 часа.<br>
      Статус вашей транзакции можно узнать в профиле → История Пополнений</p>
    </div>
  `;
}

function showTopUp() {
  document.getElementById('topup-form').style.display = 'block';
}

function confirmTopUp() {
  const receipt = document.getElementById('receipt');
  if (receipt.files.length === 0) {
    alert("Пожалуйста, выберите файл с подтверждением оплаты.");
    return;
  }
  alert("Ожидайте... Заявка отправлена.");
}
