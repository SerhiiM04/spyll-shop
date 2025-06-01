let prices = {};

async function fetchPrices() {
  const res = await fetch('/api/prices');
  prices = await res.json();

  document.getElementById('price3').innerText = prices.premium3 + ' ₴';
  document.getElementById('price6').innerText = prices.premium6 + ' ₴';
  document.getElementById('price12').innerText = prices.premium12 + ' ₴';
  document.getElementById('promoLimit').innerText = prices.promoLimit;

  if (prices.starsPromo && prices.promoLimit) {
    document.getElementById('saleBlock').style.display = 'block';
  }

  updateStarPrice();
}

function updateStarPrice() {
  const stars = parseInt(document.getElementById('starsAmount').value || 0);
  const usePromo = stars >= prices.promoLimit;
  const perStar = usePromo ? prices.starsPromo : prices.starsBase;
  const total = (stars * perStar).toFixed(2);
  document.getElementById('starsPrice').innerText = total + ' ₴';
}

function buy(productId) {
  const starsValue = document.getElementById('starsAmount').value || '';
  window.location.href = `/payment?product=${productId}&count=${starsValue}`;
}

function buyStars() {
  const amount = parseInt(document.getElementById('starsAmount').value || 0);
  if (amount <= 0) return alert('Введите количество звёзд');
  window.location.href = `/payment?product=stars&count=${amount}`;
}

async function fetchStatus() {
  const res = await fetch('/api/orders/status');
  const status = await res.json();
  const el = document.getElementById('paymentStatus');

  if (status.status === 'pending') {
    el.textContent = 'Ожидает подтверждения';
    el.className = 'status-badge status-pending';
    el.style.display = 'inline-block';
  } else if (status.status === 'approved') {
    el.textContent = 'Одобрено';
    el.className = 'status-badge status-approved';
    el.style.display = 'inline-block';
    setTimeout(() => el.style.display = 'none', 5000);
  } else if (status.status === 'rejected') {
    el.textContent = 'Отклонено';
    el.className = 'status-badge status-rejected';
    el.style.display = 'inline-block';
    setTimeout(() => el.style.display = 'none', 7000);
  }
}

async function fetchHistory() {
  const res = await fetch('/api/orders/user');
  const history = await res.json();
  const list = document.getElementById('historyList');
  list.innerHTML = '';

  history.reverse().forEach(order => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <strong>${order.description}</strong><br>
      ${order.price} ₴ — <em>${order.status}</em>
      ${order.username ? `<br>Пользователь: <a href="https://t.me/${order.username}" target="_blank">@${order.username}</a>` : ''}
      ${order.reason ? `<br><small>Причина: ${order.reason}</small>` : ''}
    `;
    list.appendChild(div);
  });
}

function scrollToHistory() {
  document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.add('hidden');
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark');
  }
}

document.getElementById('starsAmount').addEventListener('input', updateStarPrice);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('closeHistory').addEventListener('click', closeHistoryModal);

applySavedTheme();
fetchPrices();
fetchStatus();
fetchHistory();
