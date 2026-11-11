const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Single all-day event for the NEXT occurrence only (lunar dates must not use a YEARLY rule). */
export function buildICS({ name, date, remindDays = 7, uid = `kt-${Date.now()}@kinhtam.local` }) {
  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kinh Tam//Family Occasion//VI',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${fmt(date)}`,
    `DTEND;VALUE=DATE:${fmt(end)}`,
    `SUMMARY:${esc(name)}`,
    'DESCRIPTION:Nhắc từ Kính Tâm. Hãy kiểm tra lại nhà mình đã có gì trước khi mua.',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(name)}`,
    `TRIGGER:-P${Number(remindDays)}D`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
