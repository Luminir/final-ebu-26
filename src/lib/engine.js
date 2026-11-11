import { occasions, productById } from './catalogue.js';

/** Rule engine: template(occasion, mode) - inventory, filtered to catalogue SKUs. No AI involved. */
export function recommend({ occasion, mode, inventory = [] }) {
  if (mode === 'tu') return [];
  const tpl = occasions[occasion]?.tpl?.[mode] || {};
  return Object.entries(tpl)
    .filter(([id]) => productById(id) && !inventory.includes(id))
    .map(([id, qty]) => ({ id, qty }));
}

export function subtotal(cart) {
  return cart.reduce((sum, it) => sum + (productById(it.id)?.price || 0) * it.qty, 0);
}

/** Only reports a status/warning - NEVER removes items automatically. */
export function budgetStatus(cart, budget) {
  const total = subtotal(cart);
  const over = budget > 0 && total > budget;
  return {
    total,
    over,
    diff: over ? total - budget : budget - total,
    percent: budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0,
  };
}

export function setQty(cart, id, qty) {
  const q = Math.max(0, Math.floor(qty) || 0);
  const rest = cart.filter((x) => x.id !== id);
  if (q === 0) return rest;
  const existing = cart.find((x) => x.id === id);
  return existing ? cart.map((x) => (x.id === id ? { ...x, qty: q } : x)) : [...cart, { id, qty: q }];
}
