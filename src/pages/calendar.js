import { mountLayout, esc, $, $$, toast } from '../layout.js';
import { occasions, productById } from '../lib/catalogue.js';
import { getState, update, log } from '../lib/store.js';
import { solarToLunar, nextOccurrence } from '../lib/lunar.js';
import { buildICS, downloadICS } from '../lib/ics.js';

mountLayout('calendar');

let editing = null;
const fmt = (d) =>
  d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function eventItem(e) {
  const nx = nextOccurrence(e);
  const pad2 = (n) => String(n).padStart(2, '0');
  const savedLabel = `${pad2(e.day)}/${pad2(e.month)}${e.leap ? ' nhuận' : ''} · ${e.calendar === 'lunar' ? 'Âm lịch' : 'Dương lịch'}`;
  const nextLabel = nx
    ? `Năm ${nx.date.getFullYear()} tương ứng: <strong>${fmt(nx.date)} DL</strong>`
    : '';

  return `<div class="calendar-item">
    <div>
      <strong>${esc(e.name)}</strong>
      <div class="muted" style="font-size:13.5px">${savedLabel} · Nhắc trước ${e.remind} ngày</div>
      ${nextLabel ? `<div style="font-size:13px;margin-top:3px;color:var(--green)">${nextLabel}</div>` : ''}
    </div>
    <div class="inline-actions">
      <button type="button" class="btn small" data-prep="${e.id}">Chuẩn bị lễ</button>
      <button type="button" class="btn small secondary" data-ics="${e.id}">Xuất .ics</button>
      <button type="button" class="btn small ghost" data-edit="${e.id}">Sửa</button>
      <button type="button" class="btn small ghost" data-del="${e.id}">Xóa</button>
    </div>
  </div>`;
}

function lastYearSection() {
  const h = (getState().history || []).slice(0, 3);
  if (!h.length) return '';
  return `
    <h3 style="margin:26px 0 8px;font-size:17px">Lần chuẩn bị trước</h3>
    <p class="muted" style="margin:0 0 12px;font-size:13.5px">
      Năm trước bạn đã chuẩn bị các món sau. Hãy kiểm tra lại những gì nhà mình hiện đã có.
    </p>
    ${h
      .map(
        (o) => `
      <div class="calendar-item" style="background:var(--surface-warm)">
        <div>
          <strong>${esc(o.label)}</strong>
          <div class="muted" style="font-size:13px">${o.items.map((i) => `${esc(productById(i.id)?.name || i.id)} ×${i.qty}`).join(', ')}</div>
        </div>
        <button type="button" class="btn small secondary" data-reuse="${o.id}">Chuẩn bị lại</button>
      </div>`
      )
      .join('')}
  `;
}

function render() {
  const s = getState();
  const e = editing ? s.events.find((x) => x.id === editing) : null;
  const val = e || { name: '', calendar: 'lunar', day: 12, month: 8, leap: false, remind: 7, occasion: 'gio' };

  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="shop-layout">
      <div class="panel">
        <span class="kicker">Lịch gia đình</span>
        <h2 style="margin-top:8px">Các dịp đã lưu</h2>
        <div class="panel-intro">
          Lưu ngày giỗ hoặc dịp lễ riêng để nhắc hằng năm và xuất lịch (.ics).
        </div>

        ${s.events.length ? s.events.map(eventItem).join('') : '<div class="empty">Chưa có dịp nào được lưu.</div>'}

        ${lastYearSection()}

        <h3 style="margin:26px 0 8px;font-size:17px">Đổi ngày Dương ⇄ Âm</h3>
        <div class="field-row">
          <div class="field" style="margin-bottom:0">
            <label for="cv">Chọn ngày Dương</label>
            <input id="cv" type="date" value="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="field" style="margin-bottom:0">
            <span class="lbl">Ngày Âm tương ứng</span>
            <div id="cvOut" class="note" style="margin:0">—</div>
          </div>
        </div>
      </div>

      <aside class="order-box">
        <h3>${e ? 'Sửa dịp' : 'Thêm dịp mới'}</h3>
        <p class="muted" style="font-size:13.5px;margin:0 0 12px">Tên dịp, ngày âm/dương và lịch nhắc.</p>

        <form id="ef" novalidate>
          <div class="field">
            <label for="name">Tên dịp</label>
            <input id="name" required maxlength="60" placeholder="Giỗ gia đình" value="${esc(val.name)}">
            <span class="err" id="e-name"></span>
          </div>
          <div class="field">
            <label for="cal">Loại lịch</label>
            <select id="cal">
              <option value="lunar" ${val.calendar === 'lunar' ? 'selected' : ''}>Âm lịch</option>
              <option value="solar" ${val.calendar === 'solar' ? 'selected' : ''}>Dương lịch</option>
            </select>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="day">Ngày</label>
              <input id="day" type="number" min="1" max="31" value="${val.day}">
            </div>
            <div class="field">
              <label for="month">Tháng</label>
              <input id="month" type="number" min="1" max="12" value="${val.month}">
            </div>
          </div>
          <label class="check-item" id="leapRow" style="margin-bottom:12px;padding:9px 12px">
            <div class="check-item-left">
              <input id="leap" type="checkbox" ${val.leap ? 'checked' : ''}>
              <span>Tháng nhuận</span>
            </div>
          </label>
          <div class="field">
            <label for="remind">Nhắc trước</label>
            <select id="remind">
              ${[1, 3, 7, 14]
                .map((n) => `<option value="${n}" ${val.remind === n ? 'selected' : ''}>${n} ngày</option>`)
                .join('')}
            </select>
          </div>
          <span class="err" id="e-date"></span>
          <button class="btn block" type="submit">${e ? 'Cập nhật' : 'Lưu dịp'}</button>
          ${e ? '<button class="btn ghost block" type="button" id="cancel" style="margin-top:8px">Hủy</button>' : ''}
        </form>
      </aside>
    </div>
  </div></section>`;

  bind();
}

function bind() {
  const toggleLeap = () => {
    $('#leapRow').style.display = $('#cal').value === 'lunar' ? '' : 'none';
  };
  $('#cal').addEventListener('change', toggleLeap);
  toggleLeap();

  const updateConv = () => {
    const val = $('#cv')?.value;
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    if (!y) return;
    const l = solarToLunar(d, m, y);
    $('#cvOut').textContent = `${l.day}/${l.month}${l.leap ? ' (nhuận)' : ''}/${l.year} Âm lịch`;
  };
  $('#cv')?.addEventListener('change', updateConv);
  updateConv();

  $('#ef').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('#name').value.trim();
    const calendar = $('#cal').value;
    const day = Number($('#day').value);
    const month = Number($('#month').value);
    const leap = calendar === 'lunar' && $('#leap').checked;

    $('#e-name').textContent = name ? '' : 'Vui lòng nhập tên dịp.';
    let dateErr = '';
    if (!(day >= 1 && day <= 31 && month >= 1 && month <= 12)) dateErr = 'Ngày/tháng chưa hợp lệ.';
    else if (calendar === 'lunar' && day > 30) dateErr = 'Tháng âm tối đa 30 ngày.';
    else if (calendar === 'solar' && day > new Date(2024, month, 0).getDate()) dateErr = 'Ngày không hợp lệ.';
    $('#e-date').textContent = dateErr;
    if (!name || dateErr) return;

    const rec = {
      id: editing || 'ev_' + Date.now(),
      name: name.slice(0, 60),
      occasion: 'gio',
      calendar,
      day,
      month,
      leap,
      remind: Number($('#remind').value),
      createdAt: new Date().toISOString(),
    };
    update((s) => ({
      events: editing ? s.events.map((x) => (x.id === editing ? rec : x)) : [rec, ...s.events],
    }));
    log('occasion_saved', { calendar });
    editing = null;
    toast('Đã lưu dịp');
    render();
  });

  $('#cancel')?.addEventListener('click', () => {
    editing = null;
    render();
  });

  $$('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      editing = b.dataset.edit;
      render();
    })
  );

  $$('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const ev = getState().events.find((x) => x.id === b.dataset.del);
      if (ev && confirm(`Xóa dịp “${ev.name}”?`)) {
        update((s) => ({ events: s.events.filter((x) => x.id !== ev.id) }));
        render();
      }
    })
  );

  $$('[data-ics]').forEach((b) =>
    b.addEventListener('click', () => {
      const ev = getState().events.find((x) => x.id === b.dataset.ics);
      const nx = ev && nextOccurrence(ev);
      if (!nx) return toast('Chưa tính được ngày tới');
      downloadICS(
        'kinh-tam-su-kien.ics',
        buildICS({
          name: ev.name,
          date: nx.date,
          remindDays: ev.remind,
          uid: `${ev.id}-${nx.date.getFullYear()}@kinhtam.local`,
        })
      );
      log('ics_exported', { calendar: ev.calendar });
    })
  );

  $$('[data-prep]').forEach((b) =>
    b.addEventListener('click', () => {
      const ev = getState().events.find((x) => x.id === b.dataset.prep);
      if (!ev) return;
      update({ occasion: ev.occasion || 'gio', mode: 'du', inventory: [], recSig: '' });
      location.href = 'mua-le.html?step=2';
    })
  );

  $$('[data-reuse]').forEach((b) =>
    b.addEventListener('click', () => {
      const ord = (getState().history || []).find((x) => x.id === b.dataset.reuse);
      if (!ord) return;
      update({ occasion: ord.occasion || 'gio', mode: ord.mode || 'du', inventory: [], recSig: '' });
      location.href = 'mua-le.html?step=2';
    })
  );
}

render();
