import { getState, modeLabel, cartCount, ownedNames } from './lib/store.js';
import { budgetStatus } from './lib/engine.js';
import { templateComparison } from './lib/catalogue.js';
import { VND, esc } from './layout.js';

export function orderSummary({ cta = true } = {}) {
  const s = getState();
  const b = budgetStatus(s.cart, s.budget);
  const cmp = templateComparison(s.occasion, s.mode, s.inventory);

  return `<aside class="order-box" aria-label="Đơn của bạn">
    <h3>Đơn của bạn</h3>
    <p class="muted" style="margin:0 0 12px;font-size:14px">${esc(modeLabel())}</p>

    <div class="summary-line">
      <span>Đã có sẵn</span>
      <strong>${s.inventory.length} món</strong>
    </div>
    <div class="summary-line">
      <span>Trong giỏ</span>
      <strong>${cartCount()} món</strong>
    </div>
    <div class="summary-line">
      <span>Ngân sách</span>
      <strong>${s.budget ? VND(s.budget) : '—'}</strong>
    </div>
    <div class="summary-line">
      <span>Tạm tính</span>
      <strong class="price">${VND(b.total)}</strong>
    </div>

    ${
      s.budget
        ? `<div class="bar ${b.over ? 'over' : ''}" role="progressbar" aria-valuenow="${b.percent}" aria-valuemin="0" aria-valuemax="100">
            <span style="width:${b.percent}%"></span>
          </div>`
        : ''
    }

    ${
      cmp.ownedSavings > 0
        ? `<div class="savings-pill" style="margin-top:8px">
            Tiết kiệm <strong>${VND(cmp.ownedSavings)}</strong> nhờ đồ nhà đã có
          </div>`
        : ''
    }

    <div class="summary-divider"></div>
    <div class="summary-line" style="font-size:13.5px">
      <span>Khung giờ giao</span>
      <strong>${esc(s.delivery.slot || '08:00 - 10:00')}</strong>
    </div>
    <div class="summary-line" style="font-size:13.5px">
      <span>Tình trạng</span>
      <strong style="color:${b.over ? 'var(--danger)' : 'var(--green)'}">
        ${b.over ? 'Vượt ngân sách' : 'Trong ngân sách'}
      </strong>
    </div>

    ${
      cta
        ? `<div style="height:12px"></div>
          <a class="btn block" href="thanh-toan.html">Đi tới checkout</a>
          <a class="btn ghost block" style="margin-top:8px" href="ai-goi-y.html">Nhập bằng AI</a>`
        : ''
    }
  </aside>`;
}

export const ownedList = () => ownedNames().join(', ') || 'Chưa chọn món nào';

export function renderProductVisual(p, size = 'md') {
  const h = size === 'lg' ? 210 : size === 'sm' ? 48 : 120;
  const fs = size === 'lg' ? 72 : size === 'sm' ? 22 : 42;
  const content = p.image
    ? `<img src="${p.image}" alt="${esc(p.name)}" class="prod-img" style="height:${h}px;width:100%;object-fit:cover;border-radius:14px;display:block">`
    : `<span class="prod-emoji" style="font-size:${fs}px" aria-hidden="true">${p.emoji}</span>`;

  return `
    <div class="prod-svg-wrap" style="height:${h}px;background:radial-gradient(circle at 30% 25%, #ffffff 0%, ${p.tone} 85%);border:1px solid rgba(41,83,62,0.08);overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:14px">
      ${content}
    </div>
  `;
}
