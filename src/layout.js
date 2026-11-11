import { cartCount, getState, update, subscribe, log } from './lib/store.js';
import { productById } from './lib/catalogue.js';
import { setQty } from './lib/engine.js';
import { getTodayLunarSummary } from './lib/lunar.js';
import './styles/main.css';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
export const VND = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const links = [
  ['home', 'index.html', 'Trang chủ'],
  ['shop', 'mua-le.html', 'Mua lễ vật'],
  ['catalog', 'san-pham.html', 'Sản phẩm'],
  ['ai', 'ai-goi-y.html', 'AI gợi ý'],
  ['calendar', 'lich-gia-dinh.html', 'Lịch gia đình'],
];

export function mountLayout(active) {
  if (!document.getElementById('kt-vn-fonts')) {
    document.head.insertAdjacentHTML(
      'beforeend',
      `<link id="kt-vn-fonts" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lora:wght@500;600;700&display=swap&subset=vietnamese">`
    );
  }
  if (!document.querySelector('link[rel="icon"]')) {
    document.head.insertAdjacentHTML('beforeend', `<link rel="icon" type="image/png" href="/kinh-tam-logo.png">`);
  }

  const todaySummary = getTodayLunarSummary();
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const todayDayOfWeek = dayNames[new Date().getDay()];
  const solarDateStr = `${todaySummary.solar.day}/${todaySummary.solar.month}/${todaySummary.solar.year}`;
  const lunarDateStr = `${todaySummary.lunar.day}/${todaySummary.lunar.month}${todaySummary.lunar.leap ? ' (nhuận)' : ''} (${todaySummary.canChiYear})`;
  const upcomingMsg = todaySummary.upcoming
    ? todaySummary.upcoming.daysAway === 0
      ? `· 🌕 <strong>Hôm nay: ${todaySummary.upcoming.title}</strong>`
      : todaySummary.upcoming.daysAway === 1
      ? `· 🌕 <strong>Ngày mai: ${todaySummary.upcoming.title}</strong>`
      : `· 🌕 Sắp tới: <strong>${todaySummary.upcoming.title}</strong> (còn ${todaySummary.upcoming.daysAway} ngày)`
    : '';

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
  <a class="skip" href="#app">Bỏ qua điều hướng</a>
  <div class="topbar">
    <div class="wrap topbar-inner">
      <span class="topbar-lunar">
        📅 ${todayDayOfWeek}, ${solarDateStr} · Âm lịch: <strong>${lunarDateStr}</strong> ${upcomingMsg}
      </span>
      <span class="hide-sm topbar-note">Dự án sinh viên E-Business (thử nghiệm)</span>
    </div>
  </div>
  <header class="header">
    <div class="wrap nav">
      <a class="brand" href="index.html">
        <img src="/kinh-tam-logo.png" alt="Kính Tâm Logo" class="brand-logo-img">
        <span class="logo">Kính Tâm<small>Chuẩn lễ · Đúng dịp · Trọn tâm</small></span>
      </a>
      <nav class="navlinks" aria-label="Điều hướng chính">
        ${links.map(([k, href, t]) => `<a href="${href}" class="${k === active ? 'active' : ''}">${t}</a>`).join('')}
      </nav>
      <div class="actions-head">
        <a class="iconbtn" href="tai-khoan.html" title="Đơn đã lưu" aria-label="Đơn đã lưu">
          👤 <span class="hide-sm">Đơn hàng</span>
        </a>
        <a class="iconbtn cart-btn" href="gio-hang.html" aria-label="Giỏ hàng">
          🛒 <span class="badge" id="cartBadge">0</span>
        </a>
      </div>
    </div>
  </header>`
  );

  document.body.insertAdjacentHTML(
    'beforeend',
    `
  <div id="productModalBackdrop" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button type="button" class="modal-close" id="closeProductModal" aria-label="Đóng">✕</button>
      <div id="productModalBody"></div>
    </div>
  </div>
  <footer class="footer">
    <div class="wrap footer-grid">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <img src="/kinh-tam-logo.png" alt="Kính Tâm" class="footer-logo-img">
          <strong class="logo" style="font-size:22px">Kính Tâm</strong>
        </div>
        <p class="muted" style="max-width:380px;margin:6px 0 0">
          Chuẩn bị lễ vật theo dịp từ những gì gia đình đã có sẵn — gọn nhẹ, minh bạch và vừa vặn ngân sách.
        </p>
      </div>
      <div>
        <strong>Khám phá</strong>
        <ul class="footer-links">
          <li><a href="mua-le.html">Mua lễ vật</a></li>
          <li><a href="cam-nang.html">Cẩm nang theo dịp</a></li>
          <li><a href="san-pham.html">Tất cả sản phẩm</a></li>
          <li><a href="lich-gia-dinh.html">Lịch gia đình</a></li>
        </ul>
      </div>
      <div>
        <strong>Thông tin & Dữ liệu</strong>
        <ul class="footer-links">
          <li><a href="tai-khoan.html">Lịch sử đơn & Tài khoản</a></li>
          <li><a href="thong-ke.html">Thống kê & Dữ liệu (DB)</a></li>
          <li><a href="chinh-sach.html">Chính sách & Quyền riêng tư</a></li>
        </ul>
      </div>
    </div>
  </footer>`
  );

  const sync = () => {
    const b = document.getElementById('cartBadge');
    if (b) b.textContent = cartCount();
  };
  sync();
  subscribe(sync);

  document.body.addEventListener('click', (e) => {
    const qv = e.target.closest('[data-quick-view]');
    if (qv) {
      e.preventDefault();
      openProductModal(qv.dataset.quickView);
    }
  });

  const backdrop = document.getElementById('productModalBackdrop');
  document.getElementById('closeProductModal')?.addEventListener('click', closeProductModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeProductModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && !backdrop.hidden) closeProductModal();
  });
}

export function openProductModal(id) {
  const p = productById(id);
  if (!p) return;
  const s = getState();
  const isOwned = s.inventory.includes(p.id);
  const body = document.getElementById('productModalBody');
  const backdrop = document.getElementById('productModalBackdrop');
  if (!body || !backdrop) return;

  body.innerHTML = `
    <div class="modal-product-grid">
      <div class="modal-visual" style="background:${p.tone}">
        <div class="modal-emoji">${p.emoji}</div>
        <span class="pill" style="background:#fff">${esc(p.tag)}</span>
      </div>
      <div>
        <h2 id="modalTitle" style="margin:0 0 6px;font:600 24px/1.3 var(--font-display)">${esc(p.name)}</h2>
        <div class="price" style="font-size:21px;margin-bottom:10px">${VND(p.price)} <span class="muted" style="font-size:14px;font-weight:400">/ ${esc(p.unit)}</span></div>
        <p style="margin:0 0 12px">${esc(p.desc)}</p>
        <div class="modal-meta-box">
          <div><strong>Thành phần:</strong> ${p.components.map(esc).join(' · ')}</div>
          <div><strong>Bảo quản:</strong> ${esc(p.shelfLife || 'Trong ngày')}</div>
          <div><strong>Nguồn gốc:</strong> <span class="muted">${esc(p.origin)}</span></div>
        </div>
        <div class="inline-actions" style="margin-top:16px">
          <button type="button" class="btn" id="modalAddCart">+ Thêm vào giỏ</button>
          <button type="button" class="btn ghost" id="modalToggleOwn">
            ${isOwned ? 'Bỏ đánh dấu “Đã có”' : 'Đánh dấu “Nhà đã có”'}
          </button>
        </div>
      </div>
    </div>
  `;

  backdrop.hidden = false;
  $('#modalAddCart')?.addEventListener('click', () => {
    const cur = getState().cart.find((x) => x.id === p.id)?.qty || 0;
    update({ cart: setQty(getState().cart, p.id, cur + 1) });
    log('item_added', { id: p.id, from: 'quick_modal' });
    toast(`Đã thêm ${p.name} vào giỏ`);
    closeProductModal();
  });
  $('#modalToggleOwn')?.addEventListener('click', () => {
    const inv = getState().inventory;
    const nextInv = inv.includes(p.id) ? inv.filter((x) => x !== p.id) : [...inv, p.id];
    update({ inventory: nextInv });
    toast(nextInv.includes(p.id) ? `Đã đánh dấu có sẵn ${p.name}` : `Đã bỏ đánh dấu ${p.name}`);
    openProductModal(p.id);
  });
}

export function closeProductModal() {
  const backdrop = document.getElementById('productModalBackdrop');
  if (backdrop) backdrop.hidden = true;
}

export function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

export function qs(name) {
  return new URLSearchParams(location.search).get(name);
}
