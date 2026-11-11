import { mountLayout, VND, esc, $, $$, toast } from '../layout.js';
import { occasions, productById } from '../lib/catalogue.js';
import { update, getState, log, applyScenario } from '../lib/store.js';
import { setQty } from '../lib/engine.js';
import { renderProductVisual } from '../components.js';

mountLayout('home');
log('session_started', { page: 'home' });

const featured = ['trai', 'xoi', 'che', 'ga'].map(productById);
const preview = ['trai', 'nen', 'gao', 'muoi'].map(productById);

$('#app').innerHTML = `
<section class="hero"><div class="wrap hero-grid">
  <div style="padding:14px 0">
    <h1>Chuẩn lễ nhẹ nhàng, vẹn toàn tâm ý.</h1>
    <p class="lead">
      Kính Tâm gợi ý lễ vật theo dịp, loại bỏ những món gia đình đã có, cho phép bạn điều chỉnh danh sách và kiểm soát ngân sách ngay trên giỏ hàng.
    </p>
    <div class="hero-actions">
      <a class="btn" href="mua-le.html">Mua lễ vật</a>
      <a class="btn secondary" href="ai-goi-y.html">Thử AI gợi ý</a>
    </div>
    <div class="hero-highlights">
      <span class="pill">🌿 Gợi ý theo dịp</span>
      <span class="pill">🧺 Bỏ món đã có</span>
      <span class="pill">💸 Theo dõi tổng tiền</span>
      <span class="pill">🚚 Chọn khung giờ giao</span>
    </div>
  </div>

  <div class="hero-panel">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Gợi ý phổ biến</h3>
      <span class="kicker">Rằm · Gói gọn</span>
    </div>
    <div class="mini-grid">
      <div class="mini-card">
        <strong>Đã có</strong>
        <span>Hoa, nhang</span>
      </div>
      <div class="mini-card">
        <strong>Ngân sách</strong>
        <span>${VND(400000)}</span>
      </div>
    </div>
    <div>
      ${preview
        .map(
          (p) => `
        <div class="preview-item">
          <div class="ico" style="background:${p.tone}">${p.emoji}</div>
          <div>
            <strong><a href="#" data-quick-view="${p.id}">${esc(p.name)}</a></strong>
            <div class="muted" style="font-size:13px">${esc(p.tag)}</div>
          </div>
          <div class="price">${VND(p.price)}</div>
        </div>`
        )
        .join('')}
    </div>
    <button class="btn block" id="loadDemo">Xem gợi ý này</button>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-title">
    <div>
      <h2>Chọn dịp lễ</h2>
      <p>Điểm bắt đầu của hành trình chuẩn bị.</p>
    </div>
    <a href="cam-nang.html" class="link-green" style="font-size:14px">Xem cẩm nang các gói →</a>
  </div>
  <div class="card-grid">
    ${Object.entries(occasions)
      .map(
        ([id, o]) => `
      <button class="card occasion-card" data-occ="${id}">
        <div>
          <div class="icon">${o.emoji}</div>
          <h3>${esc(o.shortName || o.name)}</h3>
          <p>${esc(o.desc)}</p>
        </div>
      </button>`
      )
      .join('')}
  </div>
</div></section>

<section class="section" style="padding-bottom:36px"><div class="wrap">
  <div class="section-title">
    <div>
      <h2>Lựa chọn phổ biến trong tháng</h2>
      <p>Có thể đặt lẻ từng món theo nhu cầu thực tế của gia đình.</p>
    </div>
    <a href="san-pham.html" class="link-green" style="font-size:14px">Xem tất cả sản phẩm →</a>
  </div>
  <div class="card-grid">
    ${featured
      .map(
        (p) => `
      <div class="card product-card">
        <div>
          <a href="#" data-quick-view="${p.id}" aria-label="Xem ${esc(p.name)}">
            ${renderProductVisual(p, 'md')}
          </a>
          <h3><a href="#" data-quick-view="${p.id}">${esc(p.name)}</a></h3>
          <p style="font-size:13.5px">${esc(p.tag)}</p>
        </div>
        <div class="row">
          <strong class="price">${VND(p.price)}</strong>
          <button class="btn small ghost" data-add="${p.id}">Thêm</button>
        </div>
      </div>`
      )
      .join('')}
  </div>
</div></section>`;

$$('[data-occ]').forEach((b) =>
  b.addEventListener('click', () => {
    update({ occasion: b.dataset.occ, startedAt: Date.now() });
    log('occasion_selected', { occasion: b.dataset.occ, from: 'home' });
    location.href = 'mua-le.html?step=1';
  })
);

$$('[data-add]').forEach((b) =>
  b.addEventListener('click', () => {
    const id = b.dataset.add;
    const cur = getState().cart.find((x) => x.id === id)?.qty || 0;
    update({ cart: setQty(getState().cart, id, cur + 1) });
    log('item_added', { id, from: 'home' });
    toast(`Đã thêm ${productById(id).name}`);
  })
);

$('#loadDemo').addEventListener('click', () => {
  applyScenario('A');
  location.href = 'mua-le.html?step=3';
});
