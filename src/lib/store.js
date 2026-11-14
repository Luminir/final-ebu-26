import { productById, occasions, modes } from './catalogue.js';
import { recommend } from './engine.js';
import { KinhTamDB, TABLES, defaultDraft, defaultProfile, initDB } from './db.js';

const LEGACY_KEY = 'kt_state_v1';
const listeners = new Set();
let state;

function loadFromDB() {
  initDB();
  const draft = KinhTamDB.getTable('draft') || defaultDraft();
  const profile = KinhTamDB.getTable('profile') || defaultProfile();
  const events = KinhTamDB.getTable('family_events') || [];
  const history = KinhTamDB.getTable('orders') || [];
  const feedback = KinhTamDB.getTable('feedback') || [];
  const logList = KinhTamDB.getTable('analytics') || [];

  let currentUser = null;
  try {
    if (typeof localStorage !== 'undefined') {
      const savedUser = localStorage.getItem('kt_auth_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    }
  } catch {
    currentUser = null;
  }

  state = {
    occasion: draft.occasion || 'ram',
    mode: draft.mode || 'gon',
    inventory: Array.isArray(draft.inventory) ? draft.inventory : ['hoa', 'nhang'],
    budget: typeof draft.budget === 'number' ? draft.budget : 400000,
    cart: Array.isArray(draft.cart) ? draft.cart : [],
    recSig: draft.recSig || '',
    delivery: draft.delivery || defaultDraft().delivery,
    startedAt: draft.startedAt || Date.now(),
    backtrackCount: draft.backtrackCount || 0,
    aiUsed: !!draft.aiUsed,
    profile,
    events,
    history,
    feedback,
    log: logList,
    currentUser,
  };
}

loadFromDB();

function persistToDB() {
  KinhTamDB.setTable('draft', {
    occasion: state.occasion,
    mode: state.mode,
    inventory: state.inventory,
    budget: state.budget,
    cart: state.cart,
    recSig: state.recSig,
    delivery: state.delivery,
    startedAt: state.startedAt,
    backtrackCount: state.backtrackCount,
    aiUsed: state.aiUsed,
  });
  KinhTamDB.setTable('profile', state.profile);
  KinhTamDB.setTable('family_events', state.events);
  KinhTamDB.setTable('orders', state.history);
  KinhTamDB.setTable('feedback', state.feedback);
  KinhTamDB.setTable('analytics', state.log);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LEGACY_KEY, JSON.stringify(state));
    }
  } catch {
    /* ignore */
  }
}

export const getState = () => state;

export function update(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  persistToDB();
  listeners.forEach((fn) => fn(state));
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function log(event, data = {}) {
  const entry = { event, data, ts: new Date().toISOString() };
  state = { ...state, log: [...state.log.slice(-299), entry] };
  persistToDB();
}

/** Regenerate cart from rule engine only when occasion/mode/inventory changed. */
export function ensureRecommendation(force = false) {
  const sig = `${state.occasion}|${state.mode}|${[...state.inventory].sort().join(',')}`;
  if (!force && sig === state.recSig) return;
  update({ cart: recommend(state), recSig: sig });
  log('recommendation_generated', { sig, occasion: state.occasion, mode: state.mode });
}

export function modeLabel() {
  return `${occasions[state.occasion]?.shortName || occasions[state.occasion]?.name || ''} · ${modes[state.mode]?.name || ''}`;
}

export const cartCount = () => state.cart.reduce((a, b) => a + b.qty, 0);
export const ownedNames = () => state.inventory.map((id) => productById(id)?.name).filter(Boolean);

/** Preset scenarios from the requirement doc (Scenarios A, B, C) */
export function applyScenario(code) {
  const tomorrow = new Date(Date.now() + 86400000 - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  if (code === 'A') {
    const inventory = ['hoa', 'nhang'];
    const cart = recommend({ occasion: 'ram', mode: 'gon', inventory });
    update({
      occasion: 'ram',
      mode: 'gon',
      inventory,
      budget: 400000,
      cart,
      recSig: 'ram|gon|hoa,nhang',
      delivery: { ...state.delivery, date: tomorrow, slot: '08:00 - 10:00' },
      startedAt: Date.now(),
      backtrackCount: 0,
    });
    log('scenario_loaded', { scenario: 'A' });
  } else if (code === 'B') {
    update({
      occasion: 'gio',
      mode: 'du',
      inventory: ['nhang', 'nen'],
      budget: 600000,
      cart: recommend({ occasion: 'gio', mode: 'du', inventory: ['nhang', 'nen'] }),
      recSig: 'gio|du|nen,nhang',
      startedAt: Date.now(),
    });
    log('scenario_loaded', { scenario: 'B' });
  } else if (code === 'C') {
    log('scenario_loaded', { scenario: 'C' });
  }
}

export const ORDER_STATUS_FLOW = ['received', 'preparing', 'shipping', 'completed'];

export const ORDER_STATUS_LABELS = {
  received: { label: 'Đã tiếp nhận', icon: '📝', color: '#1565c0', bg: '#e3f2fd', desc: 'Đơn hàng đã được hệ thống Kính Tâm ghi nhận' },
  preparing: { label: 'Đang chuẩn bị lễ vật', icon: '🧺', color: '#b78103', bg: '#fff8e1', desc: 'Đội ngũ Kính Tâm đang tuyển chọn hoa tươi và đóng gói lễ vật' },
  shipping: { label: 'Đang giao hàng', icon: '🚚', color: '#6a1b9a', bg: '#f3e5f5', desc: 'Shipper đang trên đường giao tới gia đình bạn' },
  completed: { label: 'Đã hoàn tất', icon: '✅', color: '#2e7d32', bg: '#e8f5e9', desc: 'Lễ vật đã được bàn giao trọn vẹn và trang nghiêm' },
};

export function loginUser(user) {
  const u = {
    id: user.id || 'usr_' + Date.now(),
    name: user.name || 'Nguyễn Văn A',
    email: user.email || 'nguyenvana@gmail.com',
    phone: user.phone || '0912345678',
    address: user.address || 'Số 15 ngõ 68 Triều Khúc, Thanh Xuân, Hà Nội',
    loggedInAt: new Date().toISOString(),
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kt_auth_user', JSON.stringify(u));
    }
  } catch { /* ignore */ }
  update((s) => ({
    currentUser: u,
    profile: {
      ...s.profile,
      displayName: u.name,
      defaultDistrict: u.address,
    },
  }));
  log('user_logged_in', { email: u.email });
  return u;
}

export function logoutUser() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('kt_auth_user');
    }
  } catch { /* ignore */ }
  update({ currentUser: null });
  log('user_logged_out');
}

export function updateOrderStatus(orderId, status) {
  update((s) => ({
    history: (s.history || []).map((o) => (o.id === orderId ? { ...o, status } : o)),
  }));
  log('order_status_updated', { orderId, status });
}

export function nextOrderStatus(orderId) {
  const order = (state.history || []).find((o) => o.id === orderId);
  if (!order) return;
  const current = order.status || 'received';
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  const next = ORDER_STATUS_FLOW[(idx + 1) % ORDER_STATUS_FLOW.length];
  updateOrderStatus(orderId, next);
  return next;
}

export function resetAll() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('kt_auth_user');
    }
  } catch { /* ignore */ }
  KinhTamDB.wipePersonalData();
  loadFromDB();
  listeners.forEach((fn) => fn(state));
}

export function reloadStateFromDB() {
  loadFromDB();
  listeners.forEach((fn) => fn(state));
}
