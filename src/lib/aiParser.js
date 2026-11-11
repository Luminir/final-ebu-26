// Rule-based parser: free text -> structured JSON. It NEVER produces SKUs or prices.
// Replaceable by an LLM later as long as the same output shape + user confirmation gate is kept.

export function stripDiacritics(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

const ITEM_TERMS = {
  trai: ['trai cay', 'hoa qua', 'ngu qua'],
  hoa: ['hoa', 'hoa tuoi', 'hoa cung'],
  nhang: ['nhang', 'huong'],
  nen: ['nen do', 'den cay', 'nen'],
  gao: ['gao'],
  muoi: ['muoi'],
  xoi: ['xoi', 'xoi gac'],
  che: ['che', 'che dau'],
  ga: ['ga', 'ga luoc'],
  rung: ['banh keo'],
  ruou: ['ruou'],
  tra: ['tra', 'che kho'],
  vang: ['vang ma', 'tien vang'],
};

export function parseMoney(raw, suffix = '') {
  let s = String(raw).trim();
  let n;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) n = Number(s.replace(/\./g, ''));
  else n = parseFloat(s.replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  const suf = suffix.toLowerCase();
  if (/^(tr|trieu)$/.test(suf)) return Math.round(n * 1000000);
  if (/^(k|nghin|ngan)$/.test(suf)) return Math.round(n * 1000);
  return Math.round(n);
}

function detectOccasion(lower, plain) {
  if (/\bram\b/.test(plain)) return 'ram';
  if (/(mung|mong)\s*(1|mot)\b|dau thang/.test(plain)) return 'mung1';
  if (/giỗ/.test(lower) || (/\bgio\b/.test(plain) && !/giờ/.test(lower) && !/\d\s*gio\b/.test(plain) && !/khung gio/.test(plain))) return 'gio';
  if (/tan gia|nha moi|ve nha moi/.test(plain)) return 'tangia';
  return 'unknown';
}

function detectMode(plain) {
  if (/day du|mam du|goi du|chu dao/.test(plain)) return 'du';
  if (/tu chon|mua le/.test(plain)) return 'tu';
  if (/gon nhe|goi gon|don gian|\bgon\b/.test(plain)) return 'gon';
  return 'gon';
}

function detectInventory(plain) {
  if (/\b(chua co do|chua co gi|khong co gi)\b/.test(plain)) return [];
  const m = plain.match(/(?:\bda co\b|\bnha da co\b|\bnha co\b|\bco san\b|\bcon\b)(.*)/);
  if (!m) return [];
  let seg = m[1].split(/\b(?:ngan sach|budget|toi da|khoang|duoi|trong tam|giao|nhan hang)\b/)[0];
  const found = [];
  const orderedKeys = ['trai', 'hoa', 'nhang', 'nen', 'gao', 'muoi', 'xoi', 'che', 'ga', 'rung', 'ruou', 'tra', 'vang'];
  for (const id of orderedKeys) {
    const re = new RegExp(`\\b(${ITEM_TERMS[id].join('|')})\\b`);
    if (re.test(seg)) {
      found.push(id);
      if (id === 'trai') seg = seg.replace(/trai cay|hoa qua|ngu qua/g, ' '); // avoid "hoa qua" => hoa
    }
  }
  return found;
}

function detectBudget(plain) {
  const near = plain.match(/(?:ngan sach|budget|toi da|khoang|duoi|tam)\D{0,15}(\d+(?:[.,]\d+)*)\s*(k|nghin|ngan|tr|trieu|d|dong|vnd)?\b/);
  const any = plain.match(/(\d+(?:[.,]\d+)*)\s*(k|nghin|ngan|tr|trieu|dong|vnd)\b/);
  const m = near || any;
  if (!m) return 0;
  let v = parseMoney(m[1], m[2] || '');
  if (!m[2] && v > 0 && v < 10000) v *= 1000;
  return v;
}

function detectDate(plain) {
  if (/ngay mai|\bmai\b/.test(plain)) return 'tomorrow';
  if (/hom nay|\bnay\b/.test(plain)) return 'today';
  if (/tuan sau|tuan toi/.test(plain)) return 'next_week';
  return 'unknown';
}

function detectSlot(plain) {
  if (/sang som|7h|7 gio/.test(plain)) return '07:00 - 08:30 (Sáng sớm)';
  if (/buoi sang|giao sang|\bsang\b/.test(plain)) return '08:00 - 10:00';
  if (/buoi trua|\btrua\b|10h/.test(plain)) return '10:00 - 12:00';
  if (/buoi chieu|giao chieu|\bchieu\b/.test(plain)) return '14:00 - 16:00';
  if (/buoi toi|giao toi|\btoi\b/.test(plain)) return '18:00 - 20:00';
  return '08:00 - 10:00';
}

export function stripPII(text) {
  const clean = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email-đã-ẩn]')
    .replace(/(\+?84|0)[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4}/g, '[sđt-đã-ẩn]');
  return { clean, stripped: clean !== text };
}

export function parseNeed(input) {
  const { clean, stripped } = stripPII(String(input || ''));
  const lower = clean.toLowerCase();
  const plain = stripDiacritics(lower);
  const occasion = detectOccasion(lower, plain);
  const inventory = detectInventory(plain);
  const budget_vnd = detectBudget(plain);
  const date_intent = detectDate(plain);
  const mode_hint = detectMode(plain);
  const slot_hint = detectSlot(plain);

  return {
    occasion,
    inventory,
    budget_vnd,
    date_intent,
    mode_hint,
    slot_hint,
    piiStripped: stripped,
    cleanText: clean,
    confidence: occasion === 'unknown' ? 'needs_confirmation' : 'ready_for_confirmation',
  };
}

export const dateIntentLabel = {
  tomorrow: 'Ngày mai',
  today: 'Hôm nay',
  next_week: 'Tuần sau',
  unknown: 'Chưa xác định (bạn sẽ chọn ở bước giao hàng)',
};

// Curated Vietnamese test suite recommended by the requirement document (Section "Năm hành động tiếp theo")
export const AI_TEST_CASES = [
  {
    title: 'Kịch bản C chuẩn (Rằm + 400k + Hoa, Nhang)',
    text: 'Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k, giao buổi sáng',
    expect: { occasion: 'ram', inventory: ['hoa', 'nhang'], budget_vnd: 400000, date_intent: 'tomorrow' },
  },
  {
    title: 'Biến thể không dấu + triệu đồng',
    text: 'mung 1 nha co hoa qua, ngan sach 1.5tr',
    expect: { occasion: 'mung1', inventory: ['trai'], budget_vnd: 1500000, date_intent: 'unknown' },
  },
  {
    title: 'Biến thể "hương", "400 nghìn", đồ khô sẵn có',
    text: 'Mai Rằm, nhà còn hương với hoa, gạo, muối, tầm 400 nghìn',
    expect: { occasion: 'ram', inventory: ['hoa', 'nhang', 'gao', 'muoi'], budget_vnd: 400000, date_intent: 'tomorrow' },
  },
  {
    title: 'Dịp Giỗ đầy đủ + số tiền dấu chấm',
    text: 'Tuần tới nhà có giỗ, cần mâm đầy đủ, nhà đã có nhang, nến đỏ, rượu, ngân sách 600.000đ',
    expect: { occasion: 'gio', inventory: ['nhang', 'nen', 'ruou'], budget_vnd: 600000, date_intent: 'next_week' },
  },
  {
    title: 'Tân gia nhà mới chưa có đồ gì',
    text: 'Ngày mai về nhà mới tân gia, chưa có đồ gì, ngân sách 500k',
    expect: { occasion: 'tangia', inventory: [], budget_vnd: 500000, date_intent: 'tomorrow' },
  },
  {
    title: 'Câu mơ hồ thiếu dịp lễ (Guardrail: không tự đoán)',
    text: 'Mai nhà có lễ, nhà đã có hoa và nhang, ngân sách 350k',
    expect: { occasion: 'unknown', inventory: ['hoa', 'nhang'], budget_vnd: 350000, date_intent: 'tomorrow' },
  },
  {
    title: 'Câu chứa SĐT cá nhân (Guardrail: tự động ẩn PII)',
    text: 'Giỗ ông, gọi số 0912345678, nhà có nhang, ngân sách 500.000',
    expect: { occasion: 'gio', inventory: ['nhang'], budget_vnd: 500000, piiStripped: true },
  },
];
