import { mountLayout, VND, esc, $, $$, toast } from '../layout.js';
import { productById, slots } from '../lib/catalogue.js';
import {
  getState,
  update,
  resetAll,
  loginUser,
  logoutUser,
  updateOrderStatus,
  nextOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_FLOW,
} from '../lib/store.js';

mountLayout('');

function render() {
  const s = getState();
  const u = s.currentUser;
  const prof = s.profile || {};
  const orders = s.history || [];

  if (!u) {
    // Unauthenticated View: Clean, intuitive Login & Demo Login
    $('#app').innerHTML = `
    <section class="shop-shell"><div class="wrap" style="max-width:820px">
      <div class="section-title" style="text-align:center;margin-bottom:24px">
        <span class="kicker">🔐 Tài khoản & Đồng bộ đơn hàng</span>
        <h2 style="margin-top:8px">Đăng nhập tài khoản Kính Tâm</h2>
        <p style="max-width:540px;margin:6px auto 0">
          Đăng nhập để lưu trữ lịch sử mua hàng, theo dõi tiến trình đơn lễ và tự động ghi nhớ thông tin cho các kỳ cúng giỗ sau.
        </p>
      </div>

      <div class="card" style="padding:28px 32px;background:#fff;border-radius:20px;box-shadow:var(--shadow)">
        <div style="background:#eef6ef;border:1px solid #c2dec7;border-radius:14px;padding:16px 18px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <strong style="color:var(--green);font-size:15px">⚡ Trải nghiệm nhanh dành cho Giảng viên / Tester:</strong>
            <div class="muted" style="font-size:13px;margin-top:2px">Bấm nút bên cạnh để đăng nhập tức thì bằng tài khoản mẫu đã có sẵn lịch sử đơn hàng.</div>
          </div>
          <button type="button" class="btn small" id="btnQuickLogin">Đăng nhập nhanh 1 chạm</button>
        </div>

        <form id="loginForm">
          <div class="field">
            <label for="lEmail">Địa chỉ Email</label>
            <input id="lEmail" type="email" placeholder="nguyenvana@gmail.com" value="nguyenvana@gmail.com" required>
          </div>
          <div class="field">
            <label for="lPass">Mật khẩu</label>
            <input id="lPass" type="password" value="123456" required>
          </div>
          <div class="field">
            <label for="lName">Họ và tên người dùng</label>
            <input id="lName" type="text" value="Nguyễn Văn A" placeholder="Nguyễn Văn A">
          </div>
          <div class="field">
            <label for="lPhone">Số điện thoại liên hệ</label>
            <input id="lPhone" type="tel" value="0912345678" placeholder="0912345678">
          </div>
          <div class="field">
            <label for="lAddress">Địa chỉ mặc định</label>
            <input id="lAddress" type="text" value="Số 15 ngõ 68 Triều Khúc, Thanh Xuân, Hà Nội">
          </div>

          <div class="inline-actions" style="margin-top:20px">
            <button type="submit" class="btn" style="flex:1">Đăng nhập tài khoản</button>
            <button type="button" class="btn ghost" id="btnRegisterDemo" style="flex:1">Tạo tài khoản mới</button>
          </div>
        </form>

        <div style="margin-top:24px;padding-top:18px;border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">
          <div style="font-size:13px;color:var(--muted)">
            <strong style="color:var(--text);display:block;margin-bottom:2px">📦 Lịch sử trọn đời</strong>
            Xem lại danh sách đồ cúng đã chuẩn bị từ các năm trước.
          </div>
          <div style="font-size:13px;color:var(--muted)">
            <strong style="color:var(--text);display:block;margin-bottom:2px">🚚 Trạng thái đơn hàng</strong>
            Cập nhật tiến trình chuẩn bị lễ vật và shipper đang giao.
          </div>
          <div style="font-size:13px;color:var(--muted)">
            <strong style="color:var(--text);display:block;margin-bottom:2px">📅 Nhắc lịch gia đình</strong>
            Tự động đồng bộ các ngày giỗ theo âm lịch hàng năm.
          </div>
        </div>
      </div>
    </div></section>`;

    const performLogin = (customName) => {
      const name = customName || $('#lName').value.trim() || 'Nguyễn Văn A';
      const email = $('#lEmail').value.trim() || 'nguyenvana@gmail.com';
      const phone = $('#lPhone')?.value.trim() || '0912345678';
      const address = $('#lAddress')?.value.trim() || 'Số 15 ngõ 68 Triều Khúc, Thanh Xuân, Hà Nội';
      loginUser({ name, email, phone, address });
      toast(`Xin chào, ${name}! Bạn đã đăng nhập thành công.`);
      render();
    };

    $('#btnQuickLogin')?.addEventListener('click', () => performLogin('Nguyễn Văn A'));
    $('#loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      performLogin();
    });
    $('#btnRegisterDemo')?.addEventListener('click', () => {
      performLogin($('#lName').value.trim() || 'Khách hàng mới');
    });
    return;
  }

  // Authenticated View: User Profile + Order Tracking Progress + Defaults
  $('#app').innerHTML = `<section class="shop-shell"><div class="wrap">
    <div class="shop-layout">
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <span class="kicker">📦 Quản lý đơn hàng & Lịch sử</span>
            <h2 style="margin:6px 0 2px">Lịch sử chuẩn bị lễ (${orders.length} đơn)</h2>
            <div class="panel-intro">Theo dõi tiến trình chuẩn bị lễ vật và xem lại các kỳ cúng giỗ đã qua.</div>
          </div>
          <a class="btn small" href="mua-le.html">+ Chuẩn bị dịp mới</a>
        </div>

        ${
          orders.length
            ? orders
                .map((o) => {
                  const statusKey = o.status || 'completed';
                  const stMeta = ORDER_STATUS_LABELS[statusKey] || ORDER_STATUS_LABELS.completed;
                  const flowIdx = ORDER_STATUS_FLOW.indexOf(statusKey);

                  return `
                <div class="calendar-item" style="display:block;padding:20px;border-radius:18px;margin-bottom:18px;border:1px solid #d4dfd6;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.03)">
                  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
                    <div>
                      <strong style="font-size:17px;color:var(--green)">${esc(o.label)}</strong>
                      <span class="muted" style="font-size:13px">· Mã đơn: <strong>${esc(o.id)}</strong> · ${new Date(o.ts || Date.now()).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <span class="status-badge" style="background:${stMeta.bg};color:${stMeta.color};border:1px solid ${stMeta.color}33;padding:4px 12px;border-radius:999px;font-weight:700;font-size:12.5px;display:inline-flex;align-items:center;gap:6px">
                      <span>${stMeta.icon}</span> ${esc(stMeta.label)}
                    </span>
                  </div>

                  <!-- 4-Step Order Status Progress Bar -->
                  <div class="order-tracker" style="margin:16px 0;background:#f8faf8;padding:12px 14px;border-radius:14px;border:1px solid #e2ebe4">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;font-size:12px">
                      ${ORDER_STATUS_FLOW.map((sKey, sIdx) => {
                        const isDone = sIdx <= flowIdx;
                        const isCurrent = sIdx === flowIdx;
                        const meta = ORDER_STATUS_LABELS[sKey];
                        return `
                        <div style="position:relative">
                          <div style="height:6px;border-radius:999px;background:${isDone ? 'var(--green)' : '#d5ded7'};margin-bottom:6px"></div>
                          <strong style="color:${isDone ? 'var(--green)' : 'var(--muted)'};font-size:11.5px;display:block">
                            ${isCurrent ? '👉 ' : ''}${meta.icon} ${meta.label}
                          </strong>
                        </div>`;
                      }).join('')}
                    </div>
                    <div class="muted" style="font-size:12px;text-align:center;margin-top:8px">
                      💡 <em>${esc(stMeta.desc)}</em>
                    </div>
                  </div>

                  <div style="font-size:13.5px;line-height:1.6;margin:12px 0">
                    <div><strong>Lễ vật đã mua:</strong> ${(o.items || []).map((it) => `${productById(it.id)?.name || it.id} ×${it.qty}`).join(', ')}</div>
                    <div><strong>Tổng thanh toán:</strong> <strong class="price" style="font-size:16px">${VND(o.total)}</strong> · <strong>Giao hàng:</strong> ${esc(o.delivery?.date || '—')} (${esc(o.delivery?.slot || '—')})</div>
                    <div class="muted" style="font-size:12.5px"><strong>Địa chỉ:</strong> ${esc(o.delivery?.address || prof.defaultDistrict || 'Hà Nội')} · Người nhận: ${esc(o.delivery?.name || u.name)} (${esc(o.delivery?.phone || u.phone)})</div>
                  </div>

                  <div class="inline-actions" style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);align-items:center">
                    <button type="button" class="btn small secondary" data-step-status="${o.id}">
                      🔄 Cập nhật tiến độ tiếp theo (Demo)
                    </button>
                    <button type="button" class="btn small ghost" data-reprep="${o.id}">Chuẩn bị lại dịp này</button>
                    <button type="button" class="btn small ghost" data-del-order="${o.id}" style="color:var(--danger)">Xóa</button>
                  </div>
                </div>`;
                })
                .join('')
            : '<div class="empty">Chưa có đơn hàng nào trong tài khoản. <a href="mua-le.html" class="link-green">Chuẩn bị lễ vật ngay →</a></div>'
        }
      </div>

      <!-- Right Aside: User Profile & Default Settings -->
      <aside class="order-box">
        <div style="background:#eef6ef;border:1px solid #c2dec7;border-radius:14px;padding:14px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:28px">👤</span>
            <div>
              <strong style="font-size:16px;display:block">${esc(u.name)}</strong>
              <small class="muted">${esc(u.email)}</small>
            </div>
          </div>
          <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
            <span class="badge" style="background:var(--green);font-size:11px">Đã xác thực</span>
            <button type="button" class="btn small ghost" id="btnLogout" style="color:var(--danger);padding:4px 10px;font-size:12px">
              Đăng xuất
            </button>
          </div>
        </div>

        <h3>Thông tin giao hàng mặc định</h3>
        <p class="muted" style="font-size:13px;margin:0 0 12px">Dùng để tự động điền khi bạn tiến hành Checkout.</p>

        <form id="profForm">
          <div class="field">
            <label for="pName">Họ và tên</label>
            <input id="pName" type="text" maxlength="60" value="${esc(u.name || prof.displayName || '')}">
          </div>
          <div class="field">
            <label for="pPhone">Số điện thoại</label>
            <input id="pPhone" type="tel" maxlength="20" value="${esc(u.phone || '0912345678')}">
          </div>
          <div class="field">
            <label for="pDist">Địa chỉ nhận hàng</label>
            <input id="pDist" type="text" maxlength="120" value="${esc(u.address || prof.defaultDistrict || '')}">
          </div>
          <div class="field">
            <label for="pSlot">Khung giờ ưu tiên</label>
            <select id="pSlot">
              ${slots.map((t) => `<option value="${esc(t)}" ${prof.defaultSlot === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="btn block">Lưu thông tin</button>
        </form>

        <button type="button" class="btn small ghost block" id="btnWipeAccount" style="margin-top:12px;color:var(--muted)">
          Xóa toàn bộ dữ liệu mẫu (Reset)
        </button>
      </aside>
    </div>
  </div></section>`;

  $('#profForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      ...u,
      name: $('#pName').value.trim(),
      phone: $('#pPhone').value.trim(),
      address: $('#pDist').value.trim(),
    };
    loginUser(updated);
    update((st) => ({
      profile: {
        ...st.profile,
        displayName: updated.name,
        defaultDistrict: updated.address,
        defaultSlot: $('#pSlot').value,
      },
    }));
    toast('Đã cập nhật thông tin cá nhân');
  });

  $('#btnLogout')?.addEventListener('click', () => {
    logoutUser();
    toast('Bạn đã đăng xuất');
    render();
  });

  $$('[data-step-status]').forEach((b) =>
    b.addEventListener('click', () => {
      const orderId = b.dataset.stepStatus;
      const nextSt = nextOrderStatus(orderId);
      const meta = ORDER_STATUS_LABELS[nextSt];
      toast(`Đã cập nhật đơn ${orderId} sang: ${meta?.label || nextSt}`);
      render();
    })
  );

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
      toast('Đã xóa đơn hàng');
      render();
    })
  );

  $('#btnWipeAccount')?.addEventListener('click', () => {
    if (confirm('Khôi phục toàn bộ dữ liệu về trạng thái ban đầu?')) {
      resetAll();
      toast('Đã thiết lập lại dữ liệu');
      render();
    }
  });
}

render();
