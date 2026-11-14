import { mountLayout, VND, esc, $, $$ } from '../layout.js';
import { productById } from '../lib/catalogue.js';
import { getState, update, cartCount, modeLabel, ownedNames } from '../lib/store.js';
import { setQty, budgetStatus } from '../lib/engine.js';
import { orderSummary, SHIPPING_FEE, FREESHIP_THRESHOLD } from '../components.js';

mountLayout('shop');

function render() {
  const s = getState();
  const b = budgetStatus(s.cart, s.budget);
  const shippingFee = b.total >= FREESHIP_THRESHOLD || b.total === 0 ? 0 : SHIPPING_FEE;
  const grandTotal = b.total + shippingFee;

  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap shop-layout">
    <div class="panel">
      <span class="kicker">Giỏ hàng</span>
      <h2 style="margin-top:8px">${esc(modeLabel())}</h2>
      <div class="panel-intro">Kiểm tra danh sách trước khi đặt. Phần “Nhà đã có” không tính tiền.</div>

      <h3 style="font-size:16px;margin-bottom:10px">Cần mua (${cartCount()} món)</h3>
      ${
        s.cart.length
          ? `<div class="product-list">
              ${s.cart
                .map((it) => {
                  const p = productById(it.id);
                  if (!p) return '';
                  return `<div class="product-row">
                    <a href="#" data-quick-view="${p.id}" class="ico" style="background:${p.tone}">${p.emoji}</a>
                    <div>
                      <strong><a href="#" data-quick-view="${p.id}">${esc(p.name)}</a></strong>
                      <small>${VND(p.price)}/${esc(p.unit)}</small>
                      <div class="qty">
                        <button type="button" data-qty="${p.id}" data-d="-1" aria-label="Giảm ${esc(p.name)}">−</button>
                        <span>${it.qty}</span>
                        <button type="button" data-qty="${p.id}" data-d="1" aria-label="Tăng ${esc(p.name)}">+</button>
                      </div>
                    </div>
                    <div class="price-col">
                      <div class="price">${VND(p.price * it.qty)}</div>
                      <button type="button" class="link" data-rm="${p.id}">Bỏ món</button>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>`
          : `<div class="empty">Giỏ hàng trống. <a href="mua-le.html" class="link-green">Bắt đầu chuẩn bị →</a></div>`
      }

      <h3 style="font-size:16px;margin:22px 0 8px">Nhà đã có (${s.inventory.length} món)</h3>
      ${
        s.inventory.length
          ? `<div class="chips">${ownedNames().map((n) => `<span class="chip">✓ ${esc(n)}</span>`).join('')}</div>`
          : '<p class="muted" style="margin:0">Chưa đánh dấu món nào đã có.</p>'
      }

      ${
        b.over
          ? `<div class="warn" role="alert">Tổng hiện tại đang vượt ngân sách ${VND(b.diff)}.</div>`
          : ''
      }

      <div class="footer-actions">
        <a class="btn ghost" href="mua-le.html?step=3">Chỉnh danh sách</a>
        <a class="btn ${s.cart.length ? '' : 'disabled'}" ${s.cart.length ? 'href="thanh-toan.html"' : 'aria-disabled="true"'}>
          Đến checkout
        </a>
      </div>
    </div>
    ${orderSummary({ cta: false })}
  </div>
  ${
    s.cart.length
      ? `<div class="mobile-sticky-checkout">
          <div>
            <div class="muted" style="font-size:11px">Tổng cộng:</div>
            <div class="price" style="font-size:17px;color:var(--green)">${VND(grandTotal)}</div>
          </div>
          <a class="btn small" href="thanh-toan.html">Checkout ngay →</a>
        </div>`
      : ''
  }
  </section>`;

  $$('[data-qty]').forEach((x) =>
    x.addEventListener('click', () => {
      const id = x.dataset.qty;
      const cur = getState().cart.find((i) => i.id === id)?.qty || 0;
      update({ cart: setQty(getState().cart, id, cur + Number(x.dataset.d)) });
      render();
    })
  );
  $$('[data-rm]').forEach((x) =>
    x.addEventListener('click', () => {
      update({ cart: setQty(getState().cart, x.dataset.rm, 0) });
      render();
    })
  );
}

render();
