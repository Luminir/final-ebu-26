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

export function resetAll() {
  KinhTamDB.wipePersonalData();
  loadFromDB();
  listeners.forEach((fn) => fn(state));
}

export function reloadStateFromDB() {
  loadFromDB();
  listeners.forEach((fn) => fn(state));
}
