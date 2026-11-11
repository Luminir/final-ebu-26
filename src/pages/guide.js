import { mountLayout, VND, esc, $, $$, qs } from '../layout.js';
import { occasions, templateComparison } from '../lib/catalogue.js';
import { update } from '../lib/store.js';

mountLayout('guide');

let selectedOcc = occasions[qs('occ')] ? qs('occ') : 'ram';

function render() {
  const occ = occasions[selectedOcc];
  const gonCmp = templateComparison(selectedOcc, 'gon', []);
  const duCmp = templateComparison(selectedOcc, 'du', []);

  $('#app').innerHTML = `
  <section class="shop-shell"><div class="wrap">
    <div class="section-title">
      <div>
        <h2>Cẩm nang lễ vật theo dịp</h2>
        <p>Danh sách gợi ý tham khảo cho Gói Gọn và Gói Đủ.</p>
      </div>
    </div>

    <div class="tabs">
      ${Object.entries(occasions)
        .map(
          ([id, o]) => `
        <button type="button" class="${selectedOcc === id ? 'active' : ''}" data-tab="${id}">
          ${o.emoji} ${esc(o.shortName || o.name)}
        </button>`
        )
        .join('')}
    </div>

    <div class="compare-grid">
      <div class="compare-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span class="kicker">Gói Gọn (${gonCmp.missingInTemplate.length} món)</span>
          <strong class="price">${VND(gonCmp.templateTotal)}</strong>
        </div>
        <div>
          ${gonCmp.missingInTemplate
            .map(
              ({ product: p, qty, lineTotal }) => `
            <div class="preview-item">
              <div class="ico" style="background:${p.tone}">${p.emoji}</div>
              <div>
                <strong>${esc(p.name)} ×${qty}</strong>
                <div class="muted" style="font-size:12.5px">${esc(p.tag)}</div>
              </div>
              <div class="price">${VND(lineTotal)}</div>
            </div>`
            )
            .join('')}
        </div>
        <button type="button" class="btn block" style="margin-top:14px" data-start-occ="${selectedOcc}" data-start-mode="gon">
          Chọn Gói Gọn
        </button>
      </div>

      <div class="compare-box good">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span class="kicker">Gói Đủ (${duCmp.missingInTemplate.length} món)</span>
          <strong class="price">${VND(duCmp.templateTotal)}</strong>
        </div>
        <div>
          ${duCmp.missingInTemplate
            .map(
              ({ product: p, qty, lineTotal }) => `
            <div class="preview-item">
              <div class="ico" style="background:${p.tone}">${p.emoji}</div>
              <div>
                <strong>${esc(p.name)} ×${qty}</strong>
                <div class="muted" style="font-size:12.5px">${esc(p.tag)}</div>
              </div>
              <div class="price">${VND(lineTotal)}</div>
            </div>`
            )
            .join('')}
        </div>
        <button type="button" class="btn block" style="margin-top:14px" data-start-occ="${selectedOcc}" data-start-mode="du">
          Chọn Gói Đủ
        </button>
      </div>
    </div>
  </div></section>`;

  $$('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedOcc = b.dataset.tab;
      render();
    })
  );

  $$('[data-start-occ]').forEach((b) =>
    b.addEventListener('click', () => {
      update({ occasion: b.dataset.startOcc, mode: b.dataset.startMode, recSig: '' });
      location.href = 'mua-le.html?step=2';
    })
  );
}

render();
