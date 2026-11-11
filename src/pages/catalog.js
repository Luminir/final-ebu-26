import { mountLayout, VND, esc, $, $$, qs, toast } from '../layout.js';
import { products, categories, productById } from '../lib/catalogue.js';
import { getState, update, log } from '../lib/store.js';
import { setQty } from '../lib/engine.js';
import { renderProductVisual } from '../components.js';

mountLayout('catalog');

let activeCat = 'all';

function add(id) {
  const cur = getState().cart.find((x) => x.id === id)?.qty || 0;
  update({ cart: setQty(getState().cart, id, cur + 1) });
  log('item_added', { id, from: 'catalog' });
  toast(`Đã thêm ${productById(id).name}`);
  render();
}

function detail(p) {
  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <p><a href="san-pham.html" class="link-green">← Tất cả sản phẩm</a></p>
    <div class="panel detail">
      <div>${renderProductVisual(p, 'lg')}</div>
      <div>
        <h2 style="margin:0 0 6px">${esc(p.name)}</h2>
        <p class="muted" style="margin:0 0 10px">${esc(p.tag)}</p>
        <p style="font-size:24px;margin:8px 0 14px" class="price">
          ${VND(p.price)} <span class="muted" style="font-size:14px;font-weight:400">/ ${esc(p.unit)}</span>
        </p>
        <p>${esc(p.desc)}</p>
        <div class="modal-meta-box" style="margin:14px 0">
          <div><strong>Thành phần:</strong> ${p.components.map(esc).join(' · ')}</div>
          <div><strong>Bảo quản:</strong> ${esc(p.shelfLife || 'Trong ngày')}</div>
          <div><strong>Nguồn gốc:</strong> <span class="muted">${esc(p.origin)}</span></div>
        </div>
        <div class="inline-actions" style="margin-top:16px">
          <button type="button" class="btn" id="add">+ Thêm vào giỏ</button>
          <a class="btn ghost" href="gio-hang.html">Xem giỏ hàng</a>
        </div>
      </div>
    </div>
  </div></section>`;
  $('#add').addEventListener('click', () => add(p.id));
}

function list() {
  const filtered = products.filter((p) => activeCat === 'all' || p.category === activeCat);

  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="section-title">
      <div>
        <h2>Sản phẩm lẻ</h2>
        <p>Chọn từng món gia đình cần bổ sung.</p>
      </div>
    </div>

    <div class="tabs">
      ${categories
        .map(
          (c) => `
        <button type="button" class="${activeCat === c.id ? 'active' : ''}" data-cat="${c.id}">
          ${c.icon} ${esc(c.name)}
        </button>`
        )
        .join('')}
    </div>

    <div class="card-grid">
      ${filtered
        .map(
          (p) => `
        <div class="card product-card">
          <div>
            <a href="san-pham.html?id=${p.id}" aria-label="${esc(p.name)}">
              ${renderProductVisual(p, 'md')}
            </a>
            <h3><a href="san-pham.html?id=${p.id}">${esc(p.name)}</a></h3>
            <p style="font-size:13.5px">${esc(p.tag)}</p>
          </div>
          <div class="row">
            <strong class="price">${VND(p.price)}<span class="muted" style="font-weight:400;font-size:12px"> /${esc(p.unit)}</span></strong>
            <button type="button" class="btn small ghost" data-add="${p.id}">Thêm</button>
          </div>
        </div>`
        )
        .join('')}
    </div>
  </div></section>`;

  $$('[data-cat]').forEach((b) =>
    b.addEventListener('click', () => {
      activeCat = b.dataset.cat;
      list();
    })
  );
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => add(b.dataset.add)));
}

function render() {
  const p = productById(qs('id'));
  p ? detail(p) : list();
}

render();
