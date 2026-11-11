// Structured Multi-Table LocalStorage Database for Kính Tâm (v2.0)
// Stores normalized collections in localStorage (`kt_db_*`) with automatic seeding,
// migration from v1 (`kt_state_v1`), export/import JSON, and live calculation of the
// 13 funnel & usability metrics defined in the requirement document.

import { products, occasions, modes, productById } from './catalogue.js';
import { recommend, subtotal } from './engine.js';

export const DB_VERSION = '2.0';
export const TABLES = {
  meta: 'kt_db_meta',
  profile: 'kt_db_profile',
  draft: 'kt_db_draft',
  orders: 'kt_db_orders',
  family_events: 'kt_db_family_events',
  feedback: 'kt_db_feedback',
  analytics: 'kt_db_analytics',
  ai_logs: 'kt_db_ai_logs',
};

const memFallback = new Map();

function readRaw(key, fallback) {
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(key)
        : memFallback.get(key) ?? null;
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeRaw(key, val) {
  try {
    const str = JSON.stringify(val);
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, str);
    else memFallback.set(key, str);
  } catch {
    /* ignore quota errors */
  }
}

function removeRaw(key) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    else memFallback.delete(key);
  } catch {
    /* ignore */
  }
}

export function defaultDraft() {
  const tomorrow = new Date(Date.now() + 86400000 - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return {
    occasion: 'ram',
    mode: 'gon',
    inventory: ['hoa', 'nhang'],
    budget: 400000,
    cart: recommend({ occasion: 'ram', mode: 'gon', inventory: ['hoa', 'nhang'] }),
    recSig: 'ram|gon|hoa,nhang',
    delivery: {
      date: tomorrow,
      slot: '08:00 - 10:00',
      name: '',
      phone: '',
      address: '',
      note: '',
    },
    startedAt: Date.now(),
    backtrackCount: 0,
    aiUsed: false,
  };
}

export function defaultProfile() {
  return {
    displayName: 'Gia đình Minh Anh (Hồ sơ mẫu)',
    email: '',
    defaultSlot: '08:00 - 10:00',
    defaultDistrict: 'Quận Cầu Giấy, Hà Nội',
    usualOwned: ['nhang', 'nen', 'gao', 'muoi'],
    consentSaved: true,
    updatedAt: new Date().toISOString(),
  };
}

export function seedFamilyEvents() {
  return [
    {
      id: 'ev_gio_gia_dinh',
      name: 'Giỗ gia đình (Kịch bản B)',
      calendar: 'lunar',
      day: 12,
      month: 8,
      leap: false,
      remind: 7,
      occasion: 'gio',
      lastOrderId: 'KT-NAM-TRUOC',
      note: 'Lưu ngày âm gốc 12/08, tự động tính ngày dương tương ứng từng năm.',
      createdAt: '2025-09-15T08:00:00.000Z',
    },
    {
      id: 'ev_ram_hang_thang',
      name: 'Lễ Rằm tháng Chạp gia tiên',
      calendar: 'lunar',
      day: 15,
      month: 12,
      leap: false,
      remind: 3,
      occasion: 'ram',
      lastOrderId: '',
      note: 'Chuẩn bị hoa tươi và ngũ quả trước 3 ngày.',
      createdAt: '2025-10-01T08:00:00.000Z',
    },
  ];
}

export function seedOrders() {
  return [
    {
      id: 'KT-NAM-TRUOC',
      ts: '2025-10-03T09:15:00.000Z',
      occasion: 'gio',
      mode: 'du',
      label: 'Ngày Giỗ Gia đình · Gói Đủ',
      inventory: ['nhang', 'nen', 'gao', 'muoi'],
      items: [
        { id: 'hoa', qty: 1 },
        { id: 'trai', qty: 1 },
        { id: 'xoi', qty: 1 },
        { id: 'che', qty: 1 },
        { id: 'ga', qty: 1 },
      ],
      total: 475000,
      savedAmount: 95000,
      budget: 500000,
      timeOnTaskMs: 145000,
      backtrackCount: 0,
      delivery: {
        name: 'Gia đình Minh Anh',
        phone: '0912345678',
        address: 'Cầu Giấy, Hà Nội (Đơn mẫu năm trước)',
        date: '2025-10-04',
        slot: '08:00 - 10:00',
        note: 'Đơn chuẩn bị năm trước — dùng để minh họa tính năng kiểm tra lại đồ hiện có.',
      },
    },
  ];
}

export function seedFeedback() {
  return [
    {
      id: 'fb_seed_1',
      orderId: 'KT-NAM-TRUOC',
      score: 5,
      comment: 'Tick bỏ nhang, nến, gạo, muối nhà đã có rất tiện, không bị mua trùng như đặt mâm trọn gói.',
      ts: '2025-10-03T09:16:00.000Z',
    },
  ];
}

export function seedAiLogs() {
  return [
    {
      id: 'ai_seed_1',
      input: 'Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k',
      parsedOccasion: 'ram',
      confirmedOccasion: 'ram',
      acceptedWithoutEdit: true,
      correctedFields: [],
      ts: '2025-10-15T10:00:00.000Z',
    },
  ];
}

export function seedAnalytics() {
  return [
    { event: 'session_started', data: { seed: true }, ts: '2025-10-03T09:12:00.000Z' },
    { event: 'checklist_viewed', data: { occasion: 'gio' }, ts: '2025-10-03T09:13:00.000Z' },
    { event: 'checklist_completed', data: { ownedCount: 4 }, ts: '2025-10-03T09:13:30.000Z' },
    { event: 'recommendation_generated', data: { sig: 'gio|du|gao,muoi,nen,nhang' }, ts: '2025-10-03T09:13:35.000Z' },
    { event: 'test_order_completed', data: { id: 'KT-NAM-TRUOC', total: 475000 }, ts: '2025-10-03T09:15:00.000Z' },
    { event: 'occasion_saved', data: { calendar: 'lunar' }, ts: '2025-10-03T09:17:00.000Z' },
  ];
}

export function initDB(forceSeed = false) {
  const meta = readRaw(TABLES.meta, null);
  if (!meta || forceSeed) {
    // Check if legacy v1 state exists so we don't lose anything
    const v1 = readRaw('kt_state_v1', null);
    writeRaw(TABLES.meta, {
      version: DB_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    writeRaw(TABLES.profile, defaultProfile());
    writeRaw(
      TABLES.draft,
      v1
        ? {
            ...defaultDraft(),
            occasion: v1.occasion || 'ram',
            mode: v1.mode || 'gon',
            inventory: Array.isArray(v1.inventory) ? v1.inventory : ['hoa', 'nhang'],
            budget: typeof v1.budget === 'number' ? v1.budget : 400000,
            cart: Array.isArray(v1.cart) && v1.cart.length ? v1.cart : defaultDraft().cart,
            recSig: v1.recSig || '',
            delivery: { ...defaultDraft().delivery, ...(v1.delivery || {}) },
          }
        : defaultDraft()
    );
    writeRaw(TABLES.orders, v1?.history?.length ? [...v1.history, ...seedOrders()] : seedOrders());
    writeRaw(
      TABLES.family_events,
      v1?.events?.length ? [...v1.events, ...seedFamilyEvents()] : seedFamilyEvents()
    );
    writeRaw(
      TABLES.feedback,
      v1?.feedback?.length ? [...v1.feedback, ...seedFeedback()] : seedFeedback()
    );
    writeRaw(
      TABLES.analytics,
      v1?.log?.length ? [...seedAnalytics(), ...v1.log] : seedAnalytics()
    );
    writeRaw(TABLES.ai_logs, seedAiLogs());
  }
}

initDB();

export const KinhTamDB = {
  getTable(name) {
    initDB();
    const key = TABLES[name] || name;
    return readRaw(key, null);
  },

  setTable(name, value) {
    const key = TABLES[name] || name;
    writeRaw(key, value);
    writeRaw(TABLES.meta, {
      ...(readRaw(TABLES.meta, {}) || {}),
      version: DB_VERSION,
      updatedAt: new Date().toISOString(),
    });
  },

  getAllTables() {
    initDB();
    return {
      meta: readRaw(TABLES.meta, {}),
      occasions: Object.entries(occasions).map(([id, o]) => ({ id, ...o })),
      products,
      profile: readRaw(TABLES.profile, defaultProfile()),
      draft: readRaw(TABLES.draft, defaultDraft()),
      orders: readRaw(TABLES.orders, []),
      family_events: readRaw(TABLES.family_events, []),
      feedback: readRaw(TABLES.feedback, []),
      analytics: readRaw(TABLES.analytics, []),
      ai_logs: readRaw(TABLES.ai_logs, []),
    };
  },

  recordAiSubmission({ input, parsed, confirmed }) {
    const logs = readRaw(TABLES.ai_logs, []);
    const correctedFields = [];
    if (parsed.occasion !== confirmed.occasion) correctedFields.push('occasion');
    if ((parsed.budget_vnd || 0) !== (confirmed.budget || 0)) correctedFields.push('budget');
    const pInv = [...(parsed.inventory || [])].sort().join(',');
    const cInv = [...(confirmed.inventory || [])].sort().join(',');
    if (pInv !== cInv) correctedFields.push('inventory');

    const entry = {
      id: 'ai_' + Date.now(),
      input: String(input || '').slice(0, 300),
      parsedOccasion: parsed.occasion,
      confirmedOccasion: confirmed.occasion,
      acceptedWithoutEdit: correctedFields.length === 0 && parsed.occasion !== 'unknown',
      correctedFields,
      ts: new Date().toISOString(),
    };
    writeRaw(TABLES.ai_logs, [entry, ...logs].slice(0, 100));
    return entry;
  },

  computeMetrics() {
    const all = this.getAllTables();
    const events = all.analytics || [];
    const orders = all.orders || [];
    const feedbacks = all.feedback || [];
    const aiLogs = all.ai_logs || [];
    const familyEvents = all.family_events || [];

    const countEv = (name) => events.filter((e) => e.event === name).length;
    const sessions = Math.max(1, countEv('session_started') || 1);
    const checklistViews = Math.max(1, countEv('checklist_viewed') + countEv('ai_parsed'));
    const checklistCompletions = Math.max(
      orders.length,
      countEv('checklist_completed') + countEv('recommendation_generated')
    );

    // Items Already Owned Rate across current draft + historical orders
    const draftsAndOrders = [...orders, all.draft].filter(Boolean);
    let ownedRatioSum = 0;
    let ratioCount = 0;
    for (const item of draftsAndOrders) {
      const tpl = occasions[item.occasion]?.tpl?.[item.mode || 'gon'] || {};
      const tplKeys = Object.keys(tpl);
      if (tplKeys.length > 0) {
        const ownedInTpl = tplKeys.filter((k) => (item.inventory || []).includes(k)).length;
        ownedRatioSum += ownedInTpl / tplKeys.length;
        ratioCount++;
      }
    }
    const itemsAlreadyOwnedRate = ratioCount ? Math.round((ownedRatioSum / ratioCount) * 100) : 33;

    // AI metrics
    const totalAi = aiLogs.length;
    const aiAccepted = aiLogs.filter((x) => x.acceptedWithoutEdit).length;
    const aiCorrected = aiLogs.filter((x) => x.correctedFields?.length > 0).length;
    const aiAcceptanceRate = totalAi ? Math.round((aiAccepted / totalAi) * 100) : 100;
    const aiCorrectionRate = totalAi ? Math.round((aiCorrected / totalAi) * 100) : 0;

    // Median Time-to-Checkout
    const durations = orders
      .map((o) => o.timeOnTaskMs)
      .filter((n) => typeof n === 'number' && n > 0)
      .sort((a, b) => a - b);
    const medianTimeSec = durations.length
      ? Math.round(durations[Math.floor(durations.length / 2)] / 1000)
      : 95;

    // Ease score
    const avgEaseScore = feedbacks.length
      ? (feedbacks.reduce((s, f) => s + Number(f.score || 0), 0) / feedbacks.length).toFixed(1)
      : '5.0';

    // Total money saved across orders by not buying already-owned items
    const totalSavedVnd = orders.reduce((s, o) => s + Number(o.savedAmount || 0), 0);

    const icsExports = countEv('ics_exported');

    return {
      activationRate: Math.min(100, Math.round((checklistViews / sessions) * 100)),
      checklistCompletionRate: Math.min(100, Math.round((checklistCompletions / checklistViews) * 100)),
      itemsAlreadyOwnedRate,
      aiAcceptanceRate,
      aiCorrectionRate,
      totalAiSubmissions: totalAi,
      recommendationToCartRate: orders.length || all.draft?.cart?.length ? 100 : 0,
      testConversionCount: orders.length,
      medianTimeSec,
      avgEaseScore,
      feedbackCount: feedbacks.length,
      savedOccasionsCount: familyEvents.length,
      calendarExportCount: icsExports,
      repeatPreparation: orders.length >= 2,
      totalSavedVnd,
      totalLogEvents: events.length,
    };
  },

  exportJSON() {
    return JSON.stringify(this.getAllTables(), null, 2);
  },

  importJSON(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.profile) writeRaw(TABLES.profile, data.profile);
    if (data.draft) writeRaw(TABLES.draft, data.draft);
    if (Array.isArray(data.orders)) writeRaw(TABLES.orders, data.orders);
    if (Array.isArray(data.family_events)) writeRaw(TABLES.family_events, data.family_events);
    if (Array.isArray(data.feedback)) writeRaw(TABLES.feedback, data.feedback);
    if (Array.isArray(data.analytics)) writeRaw(TABLES.analytics, data.analytics);
    if (Array.isArray(data.ai_logs)) writeRaw(TABLES.ai_logs, data.ai_logs);
    writeRaw(TABLES.meta, {
      version: DB_VERSION,
      updatedAt: new Date().toISOString(),
    });
  },

  wipePersonalData() {
    Object.values(TABLES).forEach(removeRaw);
    removeRaw('kt_state_v1');
    writeRaw(TABLES.meta, {
      version: DB_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wiped: true,
    });
    writeRaw(TABLES.profile, {
      displayName: '',
      email: '',
      defaultSlot: '08:00 - 10:00',
      defaultDistrict: '',
      usualOwned: [],
      consentSaved: false,
      updatedAt: new Date().toISOString(),
    });
    writeRaw(TABLES.draft, {
      ...defaultDraft(),
      inventory: [],
      cart: recommend({ occasion: 'ram', mode: 'gon', inventory: [] }),
      recSig: 'ram|gon|',
    });
    writeRaw(TABLES.orders, []);
    writeRaw(TABLES.family_events, []);
    writeRaw(TABLES.feedback, []);
    writeRaw(TABLES.analytics, []);
    writeRaw(TABLES.ai_logs, []);
  },
};
