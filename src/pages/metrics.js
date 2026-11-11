import { mountLayout, VND, esc, $, $$, toast } from '../layout.js';
import { KinhTamDB, initDB } from '../lib/db.js';
import { reloadStateFromDB, resetAll } from '../lib/store.js';

mountLayout('');

let selectedTable = 'orders';

const tableLabels = [
  ['orders', 'kt_db_orders (Đơn thử)'],
  ['family_events', 'kt_db_family_events (Lịch giỗ/lễ)'],
  ['draft', 'kt_db_draft (Phiên đang chuẩn bị)'],
  ['profile', 'kt_db_profile (Tài khoản nhẹ)'],
  ['feedback', 'kt_db_feedback (Ease Score 1–5)'],
  ['ai_logs', 'kt_db_ai_logs (Lịch sử AI Parser)'],
  ['analytics', 'kt_db_analytics (Funnel Events)'],
  ['occasions', 'kt_db_occasions (4 Dịp & Mẫu)'],
  ['products', 'kt_db_products (14 SKU & Giá)'],
];

function render() {
  const m = KinhTamDB.computeMetrics();
  const all = KinhTamDB.getAllTables();
  const currentData = all[selectedTable];

  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="section-title">
      <div>
        <span class="kicker">📊 Usability Evidence & Quản trị Cơ sở dữ liệu LocalStorage</span>
        <h2 style="margin-top:8px">Bảng đo lường 13 chỉ số Funnel & Cơ sở dữ liệu Kính Tâm</h2>
        <p>Tất cả chỉ số dưới đây được tính toán trực tiếp từ các bảng <code>kt_db_*</code> lưu trong <code>localStorage</code> theo đúng định nghĩa tại mục <em>“Metrics đo thành công”</em> của tài liệu yêu cầu.</p>
      </div>
      <div class="inline-actions">
        <button type="button" class="btn small secondary" id="btnExportJson">⬇️ Xuất DB (.JSON)</button>
        <button type="button" class="btn small ghost" id="btnReseed">🌱 Khôi phục dữ liệu mẫu</button>
        <button type="button" class="btn small ghost" id="btnWipeAll" style="color:var(--danger)">🗑️ Xóa trắng dữ liệu</button>
      </div>
    </div>

    <!-- 12 Funnel & Retention Metrics Grid -->
    <div class="metric-grid">
      <div class="metric-card">
        <strong>1. Activation Rate</strong>
        <div class="val">${m.activationRate}%</div>
        <small>User đến được checklist “Nhà đã có gì?” hoặc AI summary</small>
      </div>
      <div class="metric-card">
        <strong>2. Checklist Completion</strong>
        <div class="val">${m.checklistCompletionRate}%</div>
        <small>Hoàn thành bước “Nhà mình đã có gì?” / Bắt đầu checklist</small>
      </div>
      <div class="metric-card">
        <strong>3. Items Already Owned Rate</strong>
        <div class="val">${m.itemsAlreadyOwnedRate}%</div>
        <small>Tỷ lệ lễ vật trong mẫu mà gia đình đánh dấu đã có sẵn</small>
      </div>
      <div class="metric-card">
        <strong>4. AI Parse Acceptance</strong>
        <div class="val">${m.aiAcceptanceRate}%</div>
        <small>Xác nhận AI summary không cần sửa (${m.totalAiSubmissions} lượt thử)</small>
      </div>
      <div class="metric-card">
        <strong>5. AI Correction Rate</strong>
        <div class="val">${m.aiCorrectionRate}%</div>
        <small>Tỷ lệ phiên AI người dùng có chỉnh sửa dịp/đồ đã có/ngân sách</small>
      </div>
      <div class="metric-card">
        <strong>6. Recommendation-to-Cart</strong>
        <div class="val">${m.recommendationToCartRate}%</div>
        <small>Giữ hoặc thêm ≥ 1 sản phẩm sau khi xem gợi ý phần thiếu</small>
      </div>
      <div class="metric-card">
        <strong>7. Test Conversion (Đơn thử)</strong>
        <div class="val">${m.testConversionCount} đơn</div>
        <small>Số đơn Test Checkout hoàn tất (đã tiết kiệm ${VND(m.totalSavedVnd)})</small>
      </div>
      <div class="metric-card">
        <strong>8. Median Time-to-Checkout</strong>
        <div class="val">${m.medianTimeSec} giây</div>
        <small>Thời gian trung vị từ lúc bắt đầu chuẩn bị tới khi hoàn tất đơn thử</small>
      </div>
      <div class="metric-card">
        <strong>9. Ease Score (1–5)</strong>
        <div class="val">⭐ ${m.avgEaseScore} / 5</div>
        <small>Điểm dễ sử dụng trung bình từ ${m.feedbackCount} phản hồi</small>
      </div>
      <div class="metric-card">
        <strong>10. Saved Family Occasions</strong>
        <div class="val">${m.savedOccasionsCount} dịp</div>
        <small>Số ngày giỗ / dịp truyền thống đang lưu trong Lịch gia đình</small>
      </div>
      <div class="metric-card">
        <strong>11. Calendar Export (.ICS)</strong>
        <div class="val">${m.calendarExportCount} lượt</div>
        <small>Số lần xuất sự kiện nhắc lịch sang Google/Apple Calendar</small>
      </div>
      <div class="metric-card">
        <strong>12. Repeat Preparation</strong>
        <div class="val">${m.repeatPreparation ? 'Có (≥2)' : '1 kỳ'}</div>
        <small>Chuẩn bị lặp lại nhiều kỳ lễ + ${m.totalLogEvents} sự kiện đã ghi log</small>
      </div>
    </div>

    <!-- Interactive LocalStorage Database Inspector -->
    <div class="panel" style="margin-top:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div>
          <span class="kicker">🗄️ LocalStorage Relational Inspector (KinhTamDB v2.0)</span>
          <h3 style="margin:6px 0 2px">Trình kiểm tra trực tiếp các bảng dữ liệu trong trình duyệt</h3>
          <p class="muted" style="margin:0;font-size:13.5px">
            Nhấn vào từng tên bảng bên trái để xem dữ liệu JSON đang lưu thực tế trong <code>window.localStorage</code>.
          </p>
        </div>
        <label class="btn small ghost" style="cursor:pointer">
          ⬆️ Nhập DB từ file .JSON
          <input type="file" id="importFile" accept=".json,application/json" style="display:none">
        </label>
      </div>

      <div class="db-inspector">
        <div class="db-table-list" role="tablist">
          ${tableLabels
            .map(([key, label]) => {
              const val = all[key];
              const count = Array.isArray(val) ? `${val.length} dòng` : 'Object';
              return `
              <button type="button" class="db-table-btn ${selectedTable === key ? 'active' : ''}" data-tbl="${key}">
                <span>${esc(label)}</span>
                <span class="badge ${selectedTable === key ? '' : 'badge-soft'}" style="font-size:11px">${count}</span>
              </button>`;
            })
            .join('')}
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong>Nội dung bảng: <code>${esc(selectedTable)}</code></strong>
            <span class="muted" style="font-size:12px">Cập nhật lần cuối: ${esc(all.meta?.updatedAt || 'Vừa xong')}</span>
          </div>
          <pre class="code-box">${esc(JSON.stringify(currentData, null, 2))}</pre>
        </div>
      </div>
    </div>
  </div></section>`;

  $$('[data-tbl]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedTable = b.dataset.tbl;
      render();
    })
  );

  $('#btnExportJson')?.addEventListener('click', () => {
    const blob = new Blob([KinhTamDB.exportJSON()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinh-tam-db-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Đã tải xuống file sao lưu LocalStorage DB (.json)');
  });

  $('#importFile')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      KinhTamDB.importJSON(txt);
      reloadStateFromDB();
      toast('Đã nhập cơ sở dữ liệu thành công!');
      render();
    } catch {
      alert('File JSON không hợp lệ.');
    }
  });

  $('#btnReseed')?.addEventListener('click', () => {
    if (confirm('Khôi phục bộ dữ liệu mẫu ban đầu (Kịch bản A, B, C và đơn mẫu năm trước)?')) {
      initDB(true);
      reloadStateFromDB();
      toast('Đã khôi phục dữ liệu mẫu vào LocalStorage DB');
      render();
    }
  });

  $('#btnWipeAll')?.addEventListener('click', () => {
    if (confirm('Xóa trắng toàn bộ dữ liệu người dùng trong LocalStorage?')) {
      resetAll();
      toast('Đã xóa trắng dữ liệu cá nhân');
      render();
    }
  });
}

render();
