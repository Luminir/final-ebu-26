// Vietnamese lunar calendar conversion (algorithm by Hồ Ngọc Đức), timezone UTC+7.
// Basic reminder helper only - not for feng-shui. Production source of truth: undetermined.

const PI = Math.PI;
const INT = Math.floor;

export function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

export function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
}

function newMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const dt = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - dt;
}

function sunLongitude(jdn) {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= PI * 2 * INT(L / (PI * 2));
  return L;
}

const getSunLongitude = (day, tz) => INT((sunLongitude(day - 0.5 - tz / 24) / PI) * 6);
const getNewMoonDay = (k, tz) => INT(newMoon(k) + 0.5 + tz / 24);

function getLunarMonth11(yy, tz) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11, tz) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** @returns {{day,month,year,leap}} */
export function solarToLunar(dd, mm, yy, tz = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy, tz);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, tz);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, tz);
  }
  const day = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let leap = 0;
  let month = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = getLeapMonthOffset(a11, tz);
    if (diff >= leapDiff) {
      month = diff + 10;
      if (diff === leapDiff) leap = 1;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) lunarYear -= 1;
  return { day, month, year: lunarYear, leap: !!leap };
}

/** @returns {{day,month,year}|null} null when that leap month does not exist in that lunar year */
export function lunarToSolar(ld, lm, ly, leap = false, tz = 7) {
  let a11, b11;
  if (lm < 11) {
    a11 = getLunarMonth11(ly - 1, tz);
    b11 = getLunarMonth11(ly, tz);
  } else {
    a11 = getLunarMonth11(ly, tz);
    b11 = getLunarMonth11(ly + 1, tz);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lm - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const lo = getLeapMonthOffset(a11, tz);
    let leapMonth = lo - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && lm !== leapMonth) return null;
    if (leap || off >= lo) off += 1;
  } else if (leap) {
    return null;
  }
  const [day, month, year] = jdToDate(getNewMoonDay(k + off, tz) + ld - 1);
  return { day, month, year };
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Next solar date (>= from) for a saved occasion. Lunar dates are recomputed per year;
 * a leap-month date falls back to the regular month when the leap month does not exist.
 */
export function nextOccurrence(ev, from = new Date()) {
  const today = startOfDay(from);
  const y0 = today.getFullYear();
  for (let y = y0 - 1; y <= y0 + 3; y++) {
    let s;
    let fallback = false;
    if (ev.calendar === 'lunar') {
      s = lunarToSolar(ev.day, ev.month, y, !!ev.leap);
      if (!s && ev.leap) {
        s = lunarToSolar(ev.day, ev.month, y, false);
        fallback = true;
      }
      if (!s && ev.day === 30) s = lunarToSolar(29, ev.month, y, false);
    } else {
      const d = new Date(y, ev.month - 1, ev.day);
      if (d.getMonth() !== ev.month - 1) continue; // e.g. 29/2 in non-leap years
      s = { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
    }
    if (!s) continue;
    const date = new Date(s.year, s.month - 1, s.day);
    if (date >= today) return { date, fallback };
  }
  return null;
}
