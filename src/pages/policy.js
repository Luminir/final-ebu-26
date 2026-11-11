import { mountLayout, $, toast } from '../layout.js';
import { resetAll } from '../lib/store.js';

mountLayout('');

$('#app').innerHTML = `<section class="shop-shell"><div class="wrap"><div class="panel prose" style="max-width:860px;margin:0 auto">
  <span class="kicker">Minh bạch pháp lý, đạo đức & độ tin cậy</span>
  <h2 style="margin-top:10px;font-size:30px">Chính sách Hoạt động & Bảo vệ Dữ liệu Cá nhân</h2>

  <div class="test-checkout-banner" id="thu-nghiem" style="margin-top:16px">
    🎓 <strong>TUYÊN BỐ DỰ ÁN SINH VIÊN E-BUSINESS (TEST CHECKOUT):</strong><br>
    Kính Tâm là sản phẩm học thuật phục vụ môn học E-Business. Mọi giao dịch trên website là <strong>đơn hàng thử nghiệm (Test Checkout)</strong>, tuyệt đối không thu tiền thật và không phát sinh giao hàng thương mại. Danh sách lễ vật chỉ mang tính chất <strong>gợi ý tham khảo</strong> tùy theo phong tục và thói quen của từng gia đình.
  </div>

  <h2 id="rieng-tu">1. Bảo vệ dữ liệu cá nhân (Tuân thủ Luật số 91/2025/QH15)</h2>
  <p>
    Theo tinh thần Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (có hiệu lực từ ngày 01/01/2026), Kính Tâm áp dụng nghiêm ngặt nguyên tắc <strong>Tối thiểu hóa dữ liệu (Data Minimization)</strong>:
  </p>
  <ul>
    <li><strong>Lưu trữ cục bộ 100% tại trình duyệt:</strong> Mọi dữ liệu về giỏ hàng (<code>kt_db_draft</code>), lịch sử đơn thử (<code>kt_db_orders</code>), lịch gia đình (<code>kt_db_family_events</code>) và điểm đánh giá (<code>kt_db_feedback</code>) chỉ được lưu trong <code>localStorage</code> trên thiết bị của bạn, không tự động truyền về bất kỳ máy chủ bên thứ ba nào.</li>
    <li><strong>Không thu thập thông tin nhạy cảm không cần thiết:</strong> Để nhắc ngày giỗ gia đình, hệ thống không yêu cầu nhập họ tên thật, tuổi hay năm sinh của người đã khuất; bạn chỉ cần đặt tên gợi nhớ như <em>“Giỗ gia đình”</em>.</li>
    <li><strong>Tự động lọc bỏ PII trước khi phân tích AI:</strong> Bộ phân tích câu tự nhiên (AI Parser) tự động ẩn số điện thoại và email trước khi xử lý.</li>
    <li><strong>Quyền của chủ thể dữ liệu:</strong> Bạn có quyền xem toàn bộ dữ liệu tại trang <a href="thong-ke.html" class="link-green">Cơ sở dữ liệu LocalStorage</a>, chỉnh sửa tại trang <a href="tai-khoan.html" class="link-green">Tài khoản nhẹ</a> hoặc xóa toàn bộ dữ liệu ngay lập tức bằng nút dưới đây.</li>
  </ul>
  <div class="inline-actions" style="margin:12px 0">
    <button type="button" class="btn ghost" id="wipe">🗑️ Xóa toàn bộ dữ liệu của tôi trên trình duyệt này</button>
    <a class="btn secondary" href="thong-ke.html">Kiểm tra dữ liệu đang lưu →</a>
  </div>

  <h2 id="ai-guardrail">2. Nguyên tắc an toàn AI (Theo khung NIST AI RMF)</h2>
  <ul>
    <li><strong>AI không tự quyết định nghi lễ:</strong> AI chỉ đóng vai trò lớp nhập liệu nhanh (chuyển câu tiếng Việt tự nhiên thành cấu trúc JSON).</li>
    <li><strong>Không bịa sản phẩm (SKU) và không bịa giá:</strong> Mọi gợi ý sản phẩm và đơn giá đều do <em>Recommendation Rule Engine</em> truy xuất trực tiếp từ <em>Catalogue DB</em> có kiểm soát.</li>
    <li><strong>Cổng xác nhận bắt buộc (Confirmation Gate):</strong> Người dùng luôn nhìn thấy và chỉnh sửa kết quả AI hiểu trước khi tạo danh sách mua. Nếu câu nhập mơ hồ (ví dụ: <em>“Mai nhà có lễ”</em>), hệ thống để trạng thái chưa xác định và yêu cầu người dùng chọn dịp.</li>
  </ul>

  <h2 id="giao-hang">3. Chính sách Giao nhận & Minh bạch thông tin (Luật Bảo vệ quyền lợi người tiêu dùng 2023)</h2>
  <ul>
    <li><strong>Khung giờ giao dự kiến:</strong> Hỗ trợ chọn các khung giờ từ 07:00 đến 20:00. Trong phạm vi MVP hiện tại, SLA giao hàng thật, đối tác vận chuyển và phí giao hàng production được ghi nhận trung thực ở trạng thái <em>“Không xác định”</em>.</li>
    <li><strong>Chống thông tin sai lệch:</strong> Không hiển thị đánh giá giả (fake reviews), không gắn nhãn chứng nhận chất lượng hoặc nguồn gốc xuất xứ khi chưa được kiểm chứng thực tế (trường nguồn gốc luôn hiển thị rõ <em>“Chưa xác minh — dữ liệu mẫu”</em>).</li>
  </ul>

  <h2 id="doi-tra">4. Chính sách Đổi trả & Hoàn tiền</h2>
  <p>
    Do phiên bản hiện tại là Test Checkout (0đ thu thật), không phát sinh giao dịch tài chính hay hoàn tiền. Trong định hướng phát triển thương mại thực tế, các lễ vật tươi sống (hoa tươi, trái cây, xôi chè, gà luộc) sẽ áp dụng chính sách kiểm tra đồng kiểm khi nhận hàng và hoàn tiền/đổi mới ngay trong khung giờ trước lễ nếu không đạt chất lượng cam kết.
  </p>
</div></div></section>`;

$('#wipe').addEventListener('click', () => {
  if (confirm('Xóa toàn bộ dữ liệu Kính Tâm lưu trong trình duyệt này?')) {
    resetAll();
    toast('Đã xóa toàn bộ dữ liệu trên trình duyệt.');
  }
});
