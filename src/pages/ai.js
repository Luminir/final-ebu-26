import { mountLayout, VND, esc, $, $$, toast } from '../layout.js';
import { occasions, inventoryItems, productById } from '../lib/catalogue.js';
import { parseNeed, dateIntentLabel } from '../lib/aiParser.js';
import { update, log } from '../lib/store.js';
import { KinhTamDB } from '../lib/db.js';

mountLayout('ai');

const EXAMPLE = 'Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k';
let text = EXAMPLE;
let parsed = parseNeed(EXAMPLE);

const SAMPLES = [
  'Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k',
  'Mùng 1 nhà có hoa quả, ngân sách 300k',
  'Tuần sau nhà có giỗ, đã có nhang, nến, rượu, tầm 600k',
];

function render() {
  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="ai-grid">
      <div class="panel">
        <span class="kicker">Nhập nhanh bằng AI</span>
        <h2 style="margin-top:8px">Bạn đang cần chuẩn bị gì?</h2>
        <div class="panel-intro">
          Nhập một câu ngắn về dịp lễ, món nhà đã có và ngân sách. Bạn sẽ kiểm tra lại trước khi tạo giỏ hàng.
        </div>

        <div class="field">
          <label for="aiText">Nội dung nhập</label>
          <textarea id="aiText" maxlength="400">${esc(text)}</textarea>
        </div>

        <div class="inline-actions" style="margin-bottom:16px">
          <button type="button" class="btn" id="parse">Phân tích</button>
          <button type="button" class="btn ghost" id="example">Điền ví dụ</button>
        </div>

        <div class="muted" style="font-size:13px;margin-bottom:6px">Thử câu mẫu:</div>
        <div class="chips">
          ${SAMPLES.map((s, idx) => `<button type="button" class="chip" data-sample="${idx}">${esc(s)}</button>`).join('')}
        </div>
      </div>

      <div>
        ${parsed ? confirmCard() : ''}
      </div>
    </div>
  </div></section>`;

  $('#parse').addEventListener('click', () => {
    text = $('#aiText').value.trim();
    parsed = parseNeed(text);
    log('ai_parsed', { occasion: parsed.occasion });
    render();
  });

  $('#example').addEventListener('click', () => {
    text = EXAMPLE;
    parsed = parseNeed(EXAMPLE);
    render();
  });

  $$('[data-sample]').forEach((b) =>
    b.addEventListener('click', () => {
      text = SAMPLES[Number(b.dataset.sample)];
      parsed = parseNeed(text);
      render();
    })
  );

  if (parsed) bindConfirm();
}

function confirmCard() {
  return `<div class="panel">
    <h3 style="margin-top:0">Kính Tâm hiểu rằng</h3>

    <div class="field">
      <label for="aiOcc">Dịp lễ</label>
      <select id="aiOcc">
        <option value="unknown">Chọn dịp lễ</option>
        ${Object.entries(occasions)
          .map(([id, o]) => `<option value="${id}" ${parsed.occasion === id ? 'selected' : ''}>${esc(o.shortName || o.name)}</option>`)
          .join('')}
      </select>
      ${
        parsed.occasion === 'unknown'
          ? '<span class="err">Chưa rõ dịp lễ — vui lòng chọn dịp để tiếp tục.</span>'
          : ''
      }
    </div>

    <div class="field">
      <label for="aiBudget">Ngân sách (đ)</label>
      <input id="aiBudget" type="number" min="0" step="10000" value="${parsed.budget_vnd || ''}">
    </div>

    <div class="field">
      <span class="lbl">Đã có sẵn</span>
      <div class="check-grid">
        ${inventoryItems
          .slice(0, 9)
          .map(productById)
          .map(
            (p) => `
          <label class="check-item ${parsed.inventory.includes(p.id) ? 'checked' : ''}" style="padding:9px 12px">
            <div class="check-item-left">
              <input class="aiOwn" type="checkbox" value="${p.id}" ${parsed.inventory.includes(p.id) ? 'checked' : ''}>
              <span class="emoji" style="font-size:20px">${p.emoji}</span>
              <strong>${esc(p.name)}</strong>
            </div>
          </label>`
          )
          .join('')}
      </div>
    </div>

    <div class="note">Thời gian nhận diện: <strong>${dateIntentLabel[parsed.date_intent]}</strong></div>

    <button type="button" class="btn block" id="confirm" ${parsed.occasion === 'unknown' ? 'disabled' : ''}>
      Xác nhận & tạo giỏ hàng
    </button>
  </div>`;
}

function bindConfirm() {
  const syncEdits = () => {
    parsed.occasion = $('#aiOcc').value;
    parsed.budget_vnd = Number($('#aiBudget').value) || 0;
    parsed.inventory = $$('.aiOwn:checked').map((x) => x.value);
  };

  $('#aiOcc').addEventListener('change', () => {
    syncEdits();
    render();
  });
  $$('.aiOwn').forEach((c) =>
    c.addEventListener('change', () => {
      c.closest('label').classList.toggle('checked', c.checked);
      syncEdits();
    })
  );

  $('#confirm').addEventListener('click', () => {
    const occasion = $('#aiOcc').value;
    if (occasion === 'unknown') return;
    const budget = Math.max(0, Number($('#aiBudget').value) || 0);
    const inventory = $$('.aiOwn:checked').map((x) => x.value);

    KinhTamDB.recordAiSubmission({
      input: text,
      parsed: parseNeed(text),
      confirmed: { occasion, budget, inventory },
    });

    update({
      occasion,
      mode: 'gon',
      budget,
      inventory,
      recSig: '',
      aiUsed: true,
    });
    log('ai_confirmed', { occasion });
    toast('Đã tạo danh sách gợi ý');
    location.href = 'mua-le.html?step=3';
  });
}

render();
