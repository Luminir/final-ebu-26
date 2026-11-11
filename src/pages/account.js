import { mountLayout, VND, esc, $, $$, toast } from '../layout.js';
import { productById, slots } from '../lib/catalogue.js';
import { getState, update, resetAll } from '../lib/store.js';

mountLayout('');

function render() {
  const s = getState();
  const prof = s.profile || {};
  const orders = s.history || [];

  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="shop-layout">
      <div class="panel">
        <span class="kicker">Đơn hàng</span>
        <h2 style="margin-top:8px">Lịch sử chuẩn bị (${orders.length})</h2>
        <div class="panel-intro">Xem lại các đơn đã chuẩn bị hoặc bắt đầu chuẩn bị cho kỳ tiếp theo.</div>

        ${
          orders.length
            ? orders
                .map(
                  (o) => `
                <div class="calendar-item">
                  <div>
                    <strong>${esc(o.label)}</strong> <span class="muted" style="font-size:12.5px">· ${esc(o.id)}</span>
                    <div class="muted" style="font-size:13px;margin-top:3px">
                      Đã mua: ${(o.items || []).map((it) => `${productById(it.id)?.name || it.id} ×${it.qty}`).join(', ')}
                    </div>
                    <div style="font-size:13px;margin-top:2px">
                      Tổng: <strong class="price">${VND(o.total)}</strong> · Giao: ${esc(o.delivery?.date || '—')} (${esc(o.delivery?.slot || '—')})
                    </div>
                  </div>
                  <div class="inline-actions">
                    <button type="button" class="btn small secondary" data-reprep="${o.id}">Chuẩn bị lại</button>
                    <button type="button" class="btn small ghost" data-del-order="${o.id}">Xóa</button>
                  </div>
                </div>`
                )
                .join('')
            : '<div class="empty">Chưa có đơn hàng nào. <a href="mua-le.html" class="link-green">Mua lễ vật →</a></div>'
        }
      </div>

      <aside class="order-box">
        <h3>Thông tin mặc định</h3>
        <p class="muted" style="font-size:13px;margin:0 0 12px">Lưu trên trình duyệt để điền nhanh khi đặt hàng.</p>

        <form id="profForm">
          <div class="field">
            <label for="pName">Tên người nhận</label>
            <input id="pName" type="text" maxlength="60" value="${esc(prof.displayName || '')}">
          </div>
          <div class="field">
            <label for="pDist">Địa chỉ mặc định</label>
            <input id="pDist" type="text" maxlength="120" value="${esc(prof.defaultDistrict || '')}">
          </div>
          <div class="field">
            <label for="pSlot">Khung giờ ưu tiên</label>
            <select id="pSlot">
              ${slots.map((t) => `<option value="${esc(t)}" ${prof.defaultSlot === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="btn block">Lưu thông tin</button>
        </form>

        <button type="button" class="btn small ghost block" id="btnWipeAccount" style="margin-top:10px">
          Xóa dữ liệu trên trình duyệt
        </button>
      </aside>
    </div>
  </div></section>`;

  $('#profForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    update((st) => ({
      profile: {
        ...st.profile,
        displayName: $('#pName').value.trim(),
        defaultDistrict: $('#pDist').value.trim(),
        defaultSlot: $('#pSlot').value,
      },
    }));
    toast('Đã lưu thông tin');
  });

  $$('[data-reprep]').forEach((b) =>
    b.addEventListener('click', () => {
      const ord = (getState().history || []).find((x) => x.id === b.dataset.reprep);
      if (!ord) return;
      update({ occasion: ord.occasion || 'ram', mode: ord.mode || 'gon', inventory: [], recSig: '' });
      location.href = 'mua-le.html?step=2';
    })
  );

  $$('[data-del-order]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.delOrder;
      update((st) => ({ history: st.history.filter((o) => o.id !== id) }));
      render();
    })
  );

  $('#btnWipeAccount')?.addEventListener('click', () => {
    if (confirm('Xóa toàn bộ dữ liệu trên trình duyệt này?')) {
      resetAll();
      toast('Đã xóa dữ liệu');
      render();
    }
  });
}

render();
