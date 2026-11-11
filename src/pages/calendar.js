import { mountLayout, esc, $, $$, toast } from '../layout.js';
import { occasions, productById } from '../lib/catalogue.js';
import { getState, update, log } from '../lib/store.js';
import {
  solarToLunar,
  lunarToSolar,
  nextOccurrence,
  getMonthCalendarGrid,
  getCanChiYear,
  getCanChiDay,
} from '../lib/lunar.js';
import { buildICS, downloadICS } from '../lib/ics.js';

mountLayout('calendar');

let editing = null;
const now = new Date();
let viewYear = now.getFullYear();
let viewMonth = now.getMonth() + 1;
let selectedDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

function renderMonthlyCalendar(events) {
  const grid = getMonthCalendarGrid(viewYear, viewMonth);
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const cellsHtml = grid
    .map((cell) => {
      const matchedEvents = events.filter((ev) => {
        if (ev.calendar === 'lunar') {
          return ev.day === cell.lunarDay && ev.month === cell.lunarMonth;
        } else {
          return ev.day === cell.solarDay && ev.month === cell.solarMonth;
        }
      });

      const isSelected = cell.dateString === selectedDateStr;
      const classes = [
        'cal-day',
        cell.isCurrentMonth ? '' : 'other-month',
        cell.isToday ? 'today' : '',
        isSelected ? 'selected' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const lunarText = cell.lunarDay === 1 ? `1/${cell.lunarMonth}` : String(cell.lunarDay);

      const badges = [];
      if (cell.isMung1) badges.push(`<span class="cal-badge mung1" title="Mùng 1 Âm lịch">🌑 Mùng 1</span>`);
      if (cell.isRam) badges.push(`<span class="cal-badge ram" title="Rằm 15 Âm lịch">🌕 Rằm</span>`);
      matchedEvents.forEach((ev) => {
        badges.push(`<span class="cal-badge event" title="${esc(ev.name)}">🕯️ ${esc(ev.name)}</span>`);
      });

      return `
        <div class="${classes}" data-date="${cell.dateString}" data-sday="${cell.solarDay}" data-smonth="${cell.solarMonth}" data-syear="${cell.solarYear}" data-lday="${cell.lunarDay}" data-lmonth="${cell.lunarMonth}" data-lyear="${cell.lunarYear}" data-leap="${cell.leap ? '1' : '0'}" role="button" tabindex="0">
          <div class="cal-day-top">
            <span class="cal-solar">${cell.solarDay}</span>
            <span class="cal-lunar">${lunarText}</span>
          </div>
          <div class="cal-day-badges">
            ${badges.slice(0, 2).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  const [selY, selM, selD] = selectedDateStr.split('-').map(Number);
  const selDate = new Date(selY, selM - 1, selD);
  const selDayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const selWeekday = selDayNames[selDate.getDay()];
  const selLunar = solarToLunar(selD, selM, selY);
  const selCanChiYear = getCanChiYear(selLunar.year);
  const selCanChiDay = getCanChiDay(selD, selM, selY);

  const selEvents = events.filter((ev) => {
    if (ev.calendar === 'lunar') {
      return ev.day === selLunar.day && ev.month === selLunar.month;
    } else {
      return ev.day === selD && ev.month === selM;
    }
  });

  let occasionSuggestion = 'Ngày bình nhật — chuẩn bị hoa quả, trà nước dâng hương thanh tịnh.';
  let suggestedOccId = 'mung1';
  if (selLunar.day === 1) {
    occasionSuggestion = '🌑 Ngày Mùng Một (Sóc nhật) — dâng hương, hoa cúng tươi, lễ mọn tâm thành.';
    suggestedOccId = 'mung1';
  } else if (selLunar.day === 15) {
    occasionSuggestion = '🌕 Ngày Rằm (Vọng nhật) — trăng tròn viên mãn, dâng mâm lễ cúng gia tiên, Phật thánh.';
    suggestedOccId = 'ram';
  } else if (selEvents.length) {
    occasionSuggestion = `🕯️ ${selEvents.map((e) => esc(e.name)).join(', ')}`;
    suggestedOccId = selEvents[0].occasion || 'gio';
  }

  return `
    <div class="cal-control-bar">
      <div class="cal-month-nav">
        <button type="button" class="btn small ghost" id="calPrev" title="Tháng trước">◀</button>
        <span class="cal-title">Tháng ${viewMonth} / ${viewYear}</span>
        <button type="button" class="btn small ghost" id="calNext" title="Tháng sau">▶</button>
      </div>
      <div class="inline-actions">
        <button type="button" class="btn small secondary" id="calToday">Hôm nay</button>
      </div>
    </div>

    <div class="cal-grid-container">
      <div class="cal-weekdays">
        ${weekdays.map((w, idx) => `<span class="${idx === 6 ? 'weekend' : ''}">${w}</span>`).join('')}
      </div>
      <div class="cal-days-grid">
        ${cellsHtml}
      </div>
    </div>

    <div class="day-inspector">
      <div class="day-inspector-info">
        <strong>${selWeekday}, ngày ${selD}/${selM}/${selY} Dương lịch</strong>
        <span>
          Âm lịch: Ngày <strong>${selLunar.day}/${selLunar.month}${selLunar.leap ? ' (nhuận)' : ''}/${selLunar.year}</strong> (${selCanChiYear}) · Ngày ${selCanChiDay}
        </span>
        <div style="font-size:13px;color:var(--green);margin-top:4px;font-weight:600">
          ${occasionSuggestion}
        </div>
      </div>
      <div class="day-inspector-actions">
        <button type="button" class="btn small" id="prepSelectedDay" data-occ="${suggestedOccId}">
          Chuẩn bị lễ cúng
        </button>
        <button type="button" class="btn small ghost" id="addFromSelectedDay" data-lday="${selLunar.day}" data-lmonth="${selLunar.month}">
          ➕ Lưu dịp vào ngày này
        </button>
      </div>
    </div>
  `;
}

function render() {
  const s = getState();
  const e = editing ? s.events.find((x) => x.id === editing) : null;
  const val = e || { name: '', calendar: 'lunar', day: 15, month: viewMonth, leap: false, remind: 7, occasion: 'gio' };

  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="shop-layout">
      <div class="panel">
        <span class="kicker">Lịch Vạn Niên & Gia Đình</span>
        <h2 style="margin-top:8px">Lịch Âm - Dương & Dịp cúng</h2>
        <div class="panel-intro">
          Theo dõi ngày Sóc (Mùng 1), ngày Vọng (Rằm 15) và các ngày giỗ gia đình để chủ động sắm lễ vừa vặn, đúng ngày.
        </div>

        ${renderMonthlyCalendar(s.events)}

        <h3 style="margin:28px 0 10px;font-size:18px">Dịp giỗ & Lễ riêng đã lưu</h3>
        ${s.events.length ? s.events.map(eventItem).join('') : '<div class="empty">Chưa có dịp nào được lưu. Bạn có thể bấm vào ngày trên lịch hoặc điền form bên phải.</div>'}

        ${lastYearSection()}

        <h3 style="margin:26px 0 8px;font-size:17px">Đổi nhanh ngày Dương ⇄ Âm</h3>
        <div class="field-row">
          <div class="field" style="margin-bottom:0">
            <label for="cv">Chọn ngày Dương</label>
            <input id="cv" type="date" value="${selectedDateStr}">
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
            <input id="leap" type="checkbox" ${val.leap ? 'checked' : ''}>
            <span class="check-item-text">Tháng nhuận</span>
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
  $('#calPrev')?.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 1) {
      viewMonth = 12;
      viewYear--;
    }
    render();
  });

  $('#calNext')?.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 12) {
      viewMonth = 1;
      viewYear++;
    }
    render();
  });

  $('#calToday')?.addEventListener('click', () => {
    const n = new Date();
    viewYear = n.getFullYear();
    viewMonth = n.getMonth() + 1;
    selectedDateStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    render();
  });

  $$('.cal-day').forEach((el) => {
    el.addEventListener('click', () => {
      selectedDateStr = el.dataset.date;
      render();
    });
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        selectedDateStr = el.dataset.date;
        render();
      }
    });
  });

  $('#prepSelectedDay')?.addEventListener('click', () => {
    const occ = $('#prepSelectedDay').dataset.occ || 'mung1';
    update({ occasion: occ, mode: 'du', inventory: [], recSig: '' });
    location.href = `mua-le.html?step=2&date=${selectedDateStr}`;
  });

  $('#addFromSelectedDay')?.addEventListener('click', () => {
    const lday = $('#addFromSelectedDay').dataset.lday;
    const lmonth = $('#addFromSelectedDay').dataset.lmonth;
    $('#cal').value = 'lunar';
    $('#day').value = lday;
    $('#month').value = lmonth;
    $('#leap').checked = false;
    $('#leapRow').style.display = '';
    $('#name').focus();
    toast(`Đã chọn ngày ${lday}/${lmonth} Âm lịch để thêm dịp`);
  });

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
    const canChi = getCanChiYear(l.year);
    const canChiDay = getCanChiDay(d, m, y);
    $('#cvOut').textContent = `${l.day}/${l.month}${l.leap ? ' (nhuận)' : ''}/${l.year} Âm lịch (${canChi}) · Ngày ${canChiDay}`;
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
