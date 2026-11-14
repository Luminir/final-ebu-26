// Controlled catalogue: the ONLY source of products, prices, categories, and occasion templates.
// NOTE: All data is sample data for the E-Business student project.
// `origin` stays "Chưa xác minh (dữ liệu mẫu)" until verified (no fake claims or certificates).

export const categories = [
  { id: 'all', name: 'Tất cả lễ vật', icon: '🪷' },
  { id: 'huong-hoa', name: 'Hương hoa & Đèn nến', icon: '🌸' },
  { id: 'trai-ngot', name: 'Trái cây & Lễ ngọt', icon: '🍎' },
  { id: 'xoi-man', name: 'Xôi chè & Lễ mặn', icon: '🍚' },
  { id: 'do-kho', name: 'Gạo muối & Trà rượu', icon: '🍵' },
];

export const products = [
  {
    id: 'hoa',
    image: '/products/hoa.jpg',
    emoji: '🌸',
    name: 'Hoa cúng tươi',
    price: 70000,
    unit: 'bó',
    category: 'huong-hoa',
    tag: 'Hoa tươi trong ngày',
    tone: '#f6e6ea',
    accent: '#c86d82',
    commonlyOwned: true,
    shelfLife: 'Tươi 3–5 ngày khi thay nước sạch',
    components: ['Hoa cúc vàng hoặc hoa hồng tỉa sẵn (7–9 bông)', 'Lá đệm & giấy gói lịch sự'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Bó hoa tươi cắm bàn thờ gia tiên. Nếu vườn nhà hoặc bình hoa đã cắm sẵn, bạn chỉ cần đánh dấu "Đã có" để hệ thống bỏ qua.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'nhang',
    image: '/products/nhang.jpg',
    emoji: '🪔',
    name: 'Nhang thơm thảo mộc',
    price: 30000,
    unit: 'hộp',
    category: 'huong-hoa',
    tag: 'Mùi dịu nhẹ, ít khói',
    tone: '#f3ead7',
    accent: '#9c7336',
    commonlyOwned: true,
    shelfLife: 'Bảo quản nơi khô ráo 12 tháng',
    components: ['1 hộp nhang thảo mộc (~60 nén)', 'Ống đựng chống ẩm'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Hầu hết các gia đình đều còn sẵn nhang từ các dịp trước. Hãy kiểm tra ngăn kéo bàn thờ trước khi đặt mua thêm.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'trai',
    image: '/products/trai.jpg',
    emoji: '🍎',
    name: 'Trái cây ngũ quả',
    price: 95000,
    unit: 'phần',
    category: 'trai-ngot',
    tag: 'Chọn sẵn 5 loại theo mùa',
    tone: '#fbe7d9',
    accent: '#cb6237',
    commonlyOwned: false,
    shelfLife: 'Dùng tốt nhất trong 2–3 ngày',
    components: ['5 loại quả tươi theo mùa (ví dụ: chuối/táo/cam/xoài/thanh long)', 'Khay giấy sạch sẽ'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Một phần trái cây tươi 5 loại vừa vặn cho một đĩa bày bàn thờ, đã rửa sạch và đóng hộp gọn gàng.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'nen',
    image: '/products/nen.jpg',
    emoji: '🕯️',
    name: 'Nến đỏ an toàn',
    price: 25000,
    unit: 'cặp',
    category: 'huong-hoa',
    tag: 'Phù hợp bàn thờ gia tiên',
    tone: '#f8dcd5',
    accent: '#b64638',
    commonlyOwned: true,
    shelfLife: 'Bảo quản nơi thoáng mát 24 tháng',
    components: ['2 cây nến đỏ có đế nhôm chống chảy sáp'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Cặp nến đỏ có đế chắn sáp an toàn. Thường dùng được nhiều lần nếu gia đình chỉ thắp trong lúc hành lễ.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'gao',
    image: '/products/gao.jpg',
    emoji: '🌾',
    name: 'Gạo thơm dâng lễ',
    price: 28000,
    unit: 'gói',
    category: 'do-kho',
    tag: 'Gạo trắng 1kg',
    tone: '#f1efdc',
    accent: '#8a8238',
    commonlyOwned: true,
    shelfLife: 'Bảo quản kín 6 tháng',
    components: ['Gạo trắng hạt đều đóng túi 1kg'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Gói gạo trắng 1kg. Gia đình có thể dùng gạo sẵn trong bếp mà không cần mua gói mới.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'muoi',
    image: '/products/muoi.jpg',
    emoji: '🧂',
    name: 'Muối hạt sạch',
    price: 12000,
    unit: 'gói',
    category: 'do-kho',
    tag: 'Gói nhỏ 500g',
    tone: '#eaf0f2',
    accent: '#4d7485',
    commonlyOwned: true,
    shelfLife: 'Bảo quản kín 12 tháng',
    components: ['Muối sạch đóng gói 500g'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Gói muối sạch 500g. Đây là món hầu như bếp gia đình nào cũng sẵn có.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'xoi',
    image: '/products/xoi.jpg',
    emoji: '🍚',
    name: 'Xôi gấc khuôn hoa',
    price: 65000,
    unit: 'hộp',
    category: 'xoi-man',
    tag: 'Đồ mới nấu trong sáng giao',
    tone: '#fbe1cf',
    accent: '#c4532c',
    commonlyOwned: false,
    shelfLife: 'Dùng trong ngày nhận hàng',
    components: ['Xôi nếp cái hoa vàng đồ gấc tươi (400g)', 'Mè rang / hành phi đóng gói riêng'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Xôi gấc đóng khuôn hoa sen trang nhã, giao ấm theo khung giờ đã chọn.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'che',
    image: '/products/che.jpg',
    emoji: '🥣',
    name: 'Chè đậu thanh ngọt',
    price: 55000,
    unit: 'hộp',
    category: 'xoi-man',
    tag: 'Set 3 chén nhỏ ngọt vừa',
    tone: '#efe9d6',
    accent: '#8d7535',
    commonlyOwned: false,
    shelfLife: 'Bảo quản mát dùng trong ngày',
    components: ['3 hộp nhỏ chè đậu xanh / chè trôi nước thanh ngọt'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Phần chè nấu ít ngọt, chia sẵn 3 hộp nhỏ vừa vặn để bày lễ rồi thụ lộc.',
    occasions: ['ram', 'gio', 'tangia'],
  },
  {
    id: 'ga',
    image: '/products/ga.jpg',
    emoji: '🍗',
    name: 'Gà luộc nguyên con',
    price: 190000,
    unit: 'con',
    category: 'xoi-man',
    tag: 'Làm sạch, tạo dáng sẵn',
    tone: '#f7e3c8',
    accent: '#ad6824',
    commonlyOwned: false,
    shelfLife: 'Dùng trong ngày, bảo quản mát',
    components: ['1 con gà luộc (~1.3kg sau làm sạch)', 'Lá chanh thái chỉ & muối tiêu chanh'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Gà luộc sẵn dành cho các dịp cần mâm lễ mặn đầy đặn như Ngày giỗ hoặc Tân gia.',
    occasions: ['gio', 'tangia'],
  },
  {
    id: 'rung',
    image: '/products/rung.jpg',
    emoji: '🍬',
    name: 'Bánh kẹo dâng lễ',
    price: 60000,
    unit: 'hộp',
    category: 'trai-ngot',
    tag: 'Hộp bánh kẹo lịch sự',
    tone: '#f6e5ee',
    accent: '#9c527b',
    commonlyOwned: false,
    shelfLife: 'Theo hạn in trên bao bì (6–12 tháng)',
    components: ['Hộp bánh quy / kẹo hạt sen đóng hộp giấy trang nhã'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Hộp bánh kẹo tổng hợp gọn nhẹ, phù hợp dâng lễ Mùng 1 hoặc Rằm và dùng thưởng trà sau lễ.',
    occasions: ['mung1', 'ram', 'gio'],
  },
  {
    id: 'ruou',
    image: '/products/ruou.jpg',
    emoji: '🍶',
    name: 'Rượu nếp / Nước tinh khiết',
    price: 45000,
    unit: 'chai',
    category: 'do-kho',
    tag: 'Chai thủy tinh 300ml',
    tone: '#e8eee6',
    accent: '#4a6b53',
    commonlyOwned: true,
    shelfLife: 'Bảo quản nơi thoáng mát 12 tháng',
    components: ['1 chai rượu nếp nhẹ 300ml (hoặc đổi sang bộ nước tinh khiết)'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Chai rượu nếp nhỏ phục vụ nghi thức rót lễ trong dịp Giỗ hoặc Tân gia.',
    occasions: ['gio', 'tangia'],
  },
  {
    id: 'tra',
    image: '/products/tra.jpg',
    emoji: '🍵',
    name: 'Trà mạn Thái Nguyên',
    price: 40000,
    unit: 'hộp',
    category: 'do-kho',
    tag: 'Gói trà xanh 100g',
    tone: '#e3eedb',
    accent: '#3e6e48',
    commonlyOwned: true,
    shelfLife: 'Bảo quản kín 12 tháng',
    components: ['Gói trà mạn hút chân không 100g'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Trà xanh dùng pha ấm trà dâng hương hoặc đặt gói trà khô trên bàn thờ.',
    occasions: ['ram', 'mung1', 'gio', 'tangia'],
  },
  {
    id: 'vang',
    image: '/products/vang.jpg',
    emoji: '📜',
    name: 'Bộ vàng mã cơ bản',
    price: 35000,
    unit: 'bộ',
    category: 'huong-hoa',
    tag: 'Tùy chọn theo thói quen gia đình',
    tone: '#f2e6c9',
    accent: '#997a2c',
    commonlyOwned: false,
    shelfLife: 'Bảo quản khô ráo',
    components: ['Bộ tiền vàng cơ bản vừa phải (khuyến khích hạn chế đốt nhiều)'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Tùy chọn tham khảo cho các gia đình có thói quen hóa vàng ngày giỗ. Kính Tâm luôn tôn trọng lựa chọn bỏ qua món này.',
    occasions: ['gio'],
  },
  {
    id: 'banh',
    image: '/products/banh.jpg',
    emoji: '🥮',
    name: 'Bánh đậu xanh / Bánh ngọt',
    price: 80000,
    unit: 'hộp',
    category: 'trai-ngot',
    tag: 'Hộp 6 bánh truyền thống',
    tone: '#f4e0c4',
    accent: '#a36828',
    commonlyOwned: false,
    shelfLife: 'Bảo quản mát 15–30 ngày',
    components: ['Hộp 6 chiếc bánh đậu xanh / bánh nướng truyền thống'],
    origin: 'Chưa xác minh (dữ liệu mẫu)',
    desc: 'Hộp bánh truyền thống dùng thêm cho mâm lễ Rằm lớn hoặc biếu ông bà.',
    occasions: ['ram', 'gio'],
    image: '/products/banh.jpg',
  },
];

// Items shown in "Nhà mình đã có gì?" (taxonomy)
export const inventoryItems = [
  'hoa',
  'nhang',
  'trai',
  'nen',
  'gao',
  'muoi',
  'xoi',
  'che',
  'ga',
  'rung',
  'ruou',
  'tra',
  'vang',
];

// Quick helper list of dry/reusable items families very often already have at home
export const dryHouseholdItems = ['nhang', 'nen', 'gao', 'muoi', 'tra'];

export const occasions = {
  ram: {
    name: 'Ngày Rằm (15 Âm lịch)',
    shortName: 'Ngày Rằm',
    emoji: '🌕',
    desc: 'Chuẩn bị thanh tịnh cho ngày Rằm hàng tháng',
    culturalNote:
      'Danh sách tham khảo cho ngày Rằm hàng tháng. Nhiều gia đình chỉ dâng hương, hoa tươi, đĩa ngũ quả và chén nước sạch; một số gia đình thêm xôi chè khi có thời gian.',
    usualOwnedHint: 'Các gia đình thường đã có sẵn: Nhang, Nến, Gạo, Muối, Trà hoặc Hoa tươi.',
    tpl: {
      gon: { hoa: 1, nhang: 1, trai: 1, nen: 1, gao: 1, muoi: 1 },
      du: { hoa: 1, nhang: 1, trai: 1, nen: 1, gao: 1, muoi: 1, xoi: 1, che: 1, tra: 1 },
    },
  },
  mung1: {
    name: 'Mùng 1 Đầu tháng',
    shortName: 'Mùng 1',
    emoji: '🌤️',
    desc: 'Mâm lễ gọn nhẹ, khởi đầu tháng mới bình an',
    culturalNote:
      'Mùng 1 thường ưu tiên sự gọn gàng, tươi tắn trước giờ đi làm. Danh sách dưới đây chỉ mang tính gợi ý — bạn hoàn toàn có thể lược bớt theo thói quen gia đình.',
    usualOwnedHint: 'Các gia đình thường đã có sẵn: Nhang, Gạo, Muối, Trà.',
    tpl: {
      gon: { hoa: 1, nhang: 1, trai: 1, gao: 1, muoi: 1 },
      du: { hoa: 1, nhang: 1, trai: 1, nen: 1, gao: 1, muoi: 1, xoi: 1, rung: 1 },
    },
  },
  gio: {
    name: 'Ngày Giỗ Gia đình',
    shortName: 'Ngày giỗ',
    emoji: '🕯️',
    desc: 'Tưởng nhớ người thân với mâm lễ chu đáo',
    culturalNote:
      'Tùy điều kiện và phong tục từng nhà, lễ giỗ có thể là mâm chay gọn (hoa quả, xôi chè) hoặc mâm mặn có thêm gà luộc, rượu trà. Bạn cũng có thể lưu ngày giỗ Âm lịch vào Lịch gia đình để được nhắc hằng năm.',
    usualOwnedHint: 'Khi đến kỳ giỗ năm mới, hãy kiểm tra lại đồ trong nhà (không mặc định đồ năm trước vẫn còn).',
    tpl: {
      gon: { hoa: 1, nhang: 1, trai: 1, nen: 1, xoi: 1, che: 1 },
      du: { hoa: 1, nhang: 1, trai: 1, nen: 2, gao: 1, muoi: 1, xoi: 1, che: 1, ga: 1, ruou: 1, vang: 1 },
    },
  },
  tangia: {
    name: 'Tân gia / Về nhà mới',
    shortName: 'Tân gia',
    emoji: '🏠',
    desc: 'Lễ vật tham khảo ấm cúng khi dọn về nơi ở mới',
    culturalNote:
      'Khi chuyển về nhà mới, gia đình thường chưa có sẵn gạo, muối hay nến hương tại bếp mới. Bạn có thể chọn Gói Đủ hoặc Gói Gọn rồi bỏ bớt những món đã mang theo.',
    usualOwnedHint: 'Nhà mới thường cần bổ sung cả Gạo, Muối, Nhang, Nến nếu chưa mang từ nhà cũ sang.',
    tpl: {
      gon: { hoa: 1, nhang: 1, trai: 1, nen: 1 },
      du: { hoa: 1, nhang: 1, trai: 1, nen: 2, xoi: 1, che: 1, gao: 1, muoi: 1, ruou: 1 },
    },
  },
};

export const modes = {
  gon: {
    name: 'Gói Gọn',
    short: 'Gọn',
    no: '01',
    desc: 'Danh sách ngắn gọn, đủ lễ vật cơ bản cho gia đình bận rộn',
  },
  du: {
    name: 'Gói Đủ',
    short: 'Đủ',
    no: '02',
    desc: 'Đầy đặn hơn với xôi chè / lễ mặn tham khảo, dễ hoàn thiện mâm lễ',
  },
  tu: {
    name: 'Tự chọn từ đầu',
    short: 'Tự chọn',
    no: '03',
    desc: 'Bắt đầu với giỏ trống và tự nhặt từng lễ vật theo ý muốn',
  },
};

export const slots = [
  '07:00 - 08:30 (Sáng sớm)',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '18:00 - 20:00',
];

export const productById = (id) => products.find((p) => p.id === id);

/** Calculate total value of a template and how much the user saves by already owning items */
export function templateComparison(occasion, mode, inventory = []) {
  const tpl = occasions[occasion]?.tpl?.[mode] || {};
  let templateTotal = 0;
  let ownedSavings = 0;
  const ownedInTemplate = [];
  const missingInTemplate = [];

  for (const [id, qty] of Object.entries(tpl)) {
    const p = productById(id);
    if (!p) continue;
    const line = p.price * qty;
    templateTotal += line;
    if (inventory.includes(id)) {
      ownedSavings += line;
      ownedInTemplate.push({ id, qty, product: p, lineTotal: line });
    } else {
      missingInTemplate.push({ id, qty, product: p, lineTotal: line });
    }
  }
  return {
    templateTotal,
    ownedSavings,
    missingTotal: templateTotal - ownedSavings,
    ownedInTemplate,
    missingInTemplate,
    totalTemplateItems: Object.keys(tpl).length,
  };
}
