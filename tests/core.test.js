import { describe, it, expect } from 'vitest';
import { recommend, budgetStatus, setQty, subtotal } from '../src/lib/engine.js';
import { templateComparison } from '../src/lib/catalogue.js';
import { parseNeed, parseMoney, AI_TEST_CASES } from '../src/lib/aiParser.js';
import { lunarToSolar, solarToLunar, nextOccurrence, getCanChiYear, getCanChiDay, getUpcomingSpecialDay, getMonthCalendarGrid } from '../src/lib/lunar.js';
import { buildICS } from '../src/lib/ics.js';
import { KinhTamDB, initDB } from '../src/lib/db.js';
import { applyScenario, getState, resetAll } from '../src/lib/store.js';

describe('engine & templateComparison (Scenario A)', () => {
  const rec = recommend({ occasion: 'ram', mode: 'gon', inventory: ['hoa', 'nhang'] });
  it('does not recommend owned items', () => {
    const ids = rec.map((r) => r.id);
    expect(ids).not.toContain('hoa');
    expect(ids).not.toContain('nhang');
    expect(ids).toEqual(expect.arrayContaining(['trai', 'nen', 'gao', 'muoi']));
  });
  it('calculates savings from owned items accurately', () => {
    const cmp = templateComparison('ram', 'gon', ['hoa', 'nhang']);
    expect(cmp.ownedSavings).toBe(100000); // hoa (70k) + nhang (30k)
    expect(cmp.missingTotal).toBe(160000); // trai (95k) + nen (25k) + gao (28k) + muoi (12k)
    expect(cmp.templateTotal).toBe(260000);
  });
  it('tu mode is empty', () => {
    expect(recommend({ occasion: 'ram', mode: 'tu', inventory: [] })).toEqual([]);
  });
  it('over budget only warns; cart untouched', () => {
    const cart = [
      { id: 'ga', qty: 2 },
      { id: 'trai', qty: 1 },
    ];
    const st = budgetStatus(cart, 400000);
    expect(st.over).toBe(true);
    expect(cart).toHaveLength(2);
    expect(st.total).toBe(subtotal(cart));
  });
  it('setQty add/update/remove', () => {
    let c = setQty([], 'hoa', 2);
    expect(c).toEqual([{ id: 'hoa', qty: 2 }]);
    c = setQty(c, 'hoa', 3);
    expect(c[0].qty).toBe(3);
    expect(setQty(c, 'hoa', 0)).toEqual([]);
  });
});

describe('aiParser & Vietnamese Test Suite (Scenario C)', () => {
  it('parses the doc example with morning delivery hint', () => {
    const r = parseNeed('Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k, giao buổi sáng');
    expect(r.occasion).toBe('ram');
    expect(r.inventory.sort()).toEqual(['hoa', 'nhang']);
    expect(r.budget_vnd).toBe(400000);
    expect(r.date_intent).toBe('tomorrow');
    expect(r.slot_hint).toBe('08:00 - 10:00');
  });
  it('unknown occasion is not guessed', () => {
    expect(parseNeed('mai nhà có lễ').occasion).toBe('unknown');
  });
  it('works without diacritics and with trieu', () => {
    const r = parseNeed('mung 1 nha co hoa qua, ngan sach 1.5tr');
    expect(r.occasion).toBe('mung1');
    expect(r.inventory).toEqual(['trai']);
    expect(r.budget_vnd).toBe(1500000);
  });
  it('strips phone numbers (PII guardrail)', () => {
    const r = parseNeed('Giỗ ông, gọi 0912345678, ngân sách 500.000');
    expect(r.piiStripped).toBe(true);
    expect(r.occasion).toBe('gio');
    expect(r.budget_vnd).toBe(500000);
  });
  it('passes all curated Vietnamese AI_TEST_CASES', () => {
    for (const tc of AI_TEST_CASES) {
      const out = parseNeed(tc.text);
      expect(out.occasion).toBe(tc.expect.occasion);
      expect(out.budget_vnd).toBe(tc.expect.budget_vnd);
      expect([...out.inventory].sort()).toEqual([...(tc.expect.inventory || [])].sort());
    }
  });
  it('correctly handles 1 triệu rưỡi, 1.5 million and colloquial phrases like có hoa rồi (Feedback 5)', () => {
    const r1 = parseNeed('mai Rằm, có hoa rồi, ngân sách 1 triệu rưỡi');
    expect(r1.occasion).toBe('ram');
    expect(r1.inventory).toContain('hoa');
    expect(r1.budget_vnd).toBe(1500000);

    const r2 = parseNeed('mung 1 nha co hoa voi nhang roi, budget 1.5 million');
    expect(r2.occasion).toBe('mung1');
    expect(r2.inventory).toEqual(expect.arrayContaining(['hoa', 'nhang']));
    expect(r2.budget_vnd).toBe(1500000);

    const r3 = parseNeed('gio ong, nha co nen voi ruou roi, ngan sach 1tr5');
    expect(r3.occasion).toBe('gio');
    expect(r3.inventory).toEqual(expect.arrayContaining(['nen', 'ruou']));
    expect(r3.budget_vnd).toBe(1500000);
  });
  it('parseMoney', () => {
    expect(parseMoney('400.000')).toBe(400000);
    expect(parseMoney('2', 'tr')).toBe(2000000);
  });
});

describe('lunar & ics (Scenario B)', () => {
  it('Tet 2024 = 10/2/2024', () => {
    expect(lunarToSolar(1, 1, 2024)).toEqual({ day: 10, month: 2, year: 2024 });
  });
  it('Ram thang 8 AL 2024 = 17/9/2024', () => {
    expect(lunarToSolar(15, 8, 2024)).toEqual({ day: 17, month: 9, year: 2024 });
  });
  it('solar -> lunar round trip', () => {
    const l = solarToLunar(10, 2, 2024);
    expect(l).toMatchObject({ day: 1, month: 1, year: 2024, leap: false });
  });
  it('leap month 2023 (nhuan thang 2) exists, 2024 does not', () => {
    expect(lunarToSolar(1, 2, 2023, true)).not.toBeNull();
    expect(lunarToSolar(1, 2, 2024, true)).toBeNull();
  });
  it('nextOccurrence is >= today', () => {
    const from = new Date(2025, 0, 1);
    const r = nextOccurrence({ calendar: 'lunar', day: 12, month: 8, leap: false }, from);
    expect(r.date >= from).toBe(true);
    expect(r.date.getFullYear()).toBe(2025);
  });
  it('ics has valid structure + alarm and no RRULE', () => {
    const s = buildICS({ name: 'Giỗ ông nội', date: new Date(2025, 8, 3), remindDays: 7 });
    expect(s).toContain('BEGIN:VCALENDAR');
    expect(s).toContain('DTSTART;VALUE=DATE:20250903');
    expect(s).toContain('DTEND;VALUE=DATE:20250904');
    expect(s).toContain('TRIGGER:-P7D');
    expect(s).not.toContain('RRULE');
  });
  it('computes Can Chi for years accurately', () => {
    expect(getCanChiYear(2024)).toBe('Giáp Thìn');
    expect(getCanChiYear(2025)).toBe('Ất Tỵ');
    expect(getCanChiYear(2026)).toBe('Bính Ngọ');
  });
  it('generates a full monthly calendar grid with Mung 1 and Ram', () => {
    const grid = getMonthCalendarGrid(2024, 2);
    expect(grid.length % 7).toBe(0);
    const mung1 = grid.find((d) => d.solarYear === 2024 && d.solarMonth === 2 && d.solarDay === 10);
    expect(mung1).toBeDefined();
    expect(mung1.isMung1).toBe(true);
    expect(mung1.lunarDay).toBe(1);
    expect(mung1.lunarMonth).toBe(1);
  });
});

describe('KinhTamDB LocalStorage Database & Metrics', () => {
  it('initializes with seed tables and computes metrics', () => {
    initDB(true);
    const tables = KinhTamDB.getAllTables();
    expect(tables.products.length).toBeGreaterThanOrEqual(14);
    expect(tables.occasions.length).toBe(4);
    expect(tables.orders.length).toBeGreaterThanOrEqual(1);
    expect(tables.family_events.length).toBeGreaterThanOrEqual(2);

    const m = KinhTamDB.computeMetrics();
    expect(m.activationRate).toBeGreaterThan(0);
    expect(m.testConversionCount).toBeGreaterThanOrEqual(1);
    expect(m.savedOccasionsCount).toBeGreaterThanOrEqual(2);
  });

  it('tracks AI submission acceptance vs correction rate', () => {
    initDB(true);
    const parsed = parseNeed('Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k');
    KinhTamDB.recordAiSubmission({
      input: 'Ngày mai Rằm, nhà có nhang, hoa, ngân sách 400k',
      parsed,
      confirmed: { occasion: 'ram', budget: 500000, inventory: ['hoa', 'nhang'] }, // edited budget
    });
    const m = KinhTamDB.computeMetrics();
    expect(m.totalAiSubmissions).toBeGreaterThanOrEqual(2);
    expect(m.aiCorrectionRate).toBeGreaterThan(0);
  });

  it('applies Scenario A and supports wiping personal data', () => {
    applyScenario('A');
    expect(getState().occasion).toBe('ram');
    expect(getState().inventory).toEqual(['hoa', 'nhang']);
    resetAll();
    expect(getState().history).toEqual([]);
    expect(getState().events).toEqual([]);
  });
});
