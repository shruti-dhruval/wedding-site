const fs = require('fs');
const path = require('path');

const calDir = path.join(__dirname, '..', 'assets', 'cal');
if (!fs.existsSync(calDir)) {
  fs.mkdirSync(calDir, { recursive: true });
}

const dataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
const { WEDDING, EVENTS_BRIDE, EVENTS_GROOM } = new Function(dataCode + '; return { WEDDING, EVENTS_BRIDE, EVENTS_GROOM };')();

function pad2(n) { return String(n).padStart(2, '0'); }

function parseTimeComponents(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const clean = String(timeStr || '').replace(/onwards/i, '').trim();
  const m = clean.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  let hour = 0, minute = 0;
  if (m) {
    let rawHour = parseInt(m[1], 10);
    minute = m[2] ? parseInt(m[2], 10) : 0;
    const isPM = m[3] && /PM/i.test(m[3]);
    const isAM = m[3] && /AM/i.test(m[3]);
    if (isPM) hour = (rawHour % 12) + 12;
    else if (isAM) hour = rawHour % 12;
    else hour = rawHour;
  }
  return { year: y, month: mo, day: d, hour, minute, second: 0 };
}

function formatISTCalString(comp) {
  return '' + comp.year + pad2(comp.month) + pad2(comp.day) + 'T' + pad2(comp.hour) + pad2(comp.minute) + pad2(comp.second || 0);
}

function toTimestamp(c) {
  return new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second || 0)).getTime();
}

function fromTimestamp(ts) {
  const d = new Date(ts);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds()
  };
}

function getEventStartEnd(ev) {
  const schedule = ev.schedule || [];
  const startStr = ev.startTime || (schedule[0] ? schedule[0].time : '10:00 AM');
  let endStr = ev.endTime || (schedule.length > 1 ? schedule[schedule.length - 1].time : '');
  
  const startComp = parseTimeComponents(ev.date, startStr);
  let endComp;

  if (!endStr || endStr === startStr) {
    endComp = fromTimestamp(toTimestamp(startComp) + 2 * 60 * 60 * 1000);
  } else {
    endComp = parseTimeComponents(ev.date, endStr);
    if (toTimestamp(endComp) <= toTimestamp(startComp)) {
      endComp = fromTimestamp(toTimestamp(endComp) + 24 * 60 * 60 * 1000);
    }
  }
  return { start: startComp, end: endComp };
}

function escapeIcsText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function generateIcs(ev) {
  const { start, end } = getEventStartEnd(ev);
  const startStr = formatISTCalString(start);
  const endStr = formatISTCalString(end);
  const title = (ev.venue && ev.name && ev.venues)
    ? ev.name + ' (' + ev.venue + ') — ' + WEDDING.bride + ' & ' + WEDDING.groom + '\'s Wedding'
    : ev.name + ' — ' + WEDDING.bride + ' & ' + WEDDING.groom + '\'s Wedding';

  const scheduleLines = (ev.schedule || []).map(s => s.time + ': ' + s.label).join('\n');
  const descParts = [];
  if (ev.subtitle) descParts.push(ev.subtitle);
  if (scheduleLines) descParts.push('Schedule:\n' + scheduleLines);
  if (ev.venue || ev.address) {
    descParts.push('Venue:\n' + (ev.venue ? ev.venue + '\n' : '') + (ev.address || ''));
  }
  descParts.push('Note: All event times are in Indian Standard Time (IST, UTC+5:30).');

  const fullLocation = [ev.venue, ev.address].filter(Boolean).join(', ');
  const uid = startStr + '-' + (ev.calId || ev.id) + '@shrutidhruval.com';
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shruti and Dhruval Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + now,
    'DTSTART;TZID=Asia/Kolkata:' + startStr,
    'DTEND;TZID=Asia/Kolkata:' + endStr,
    'SUMMARY:' + escapeIcsText(title),
    'DESCRIPTION:' + escapeIcsText(descParts.join('\n\n')),
    'LOCATION:' + escapeIcsText(fullLocation),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

const allEvents = [];
EVENTS_BRIDE.forEach(ev => {
  if (ev.venues) {
    ev.venues.forEach((v, i) => {
      const suffix = i === 0 ? 'home' : 'vinayak';
      allEvents.push({
        ...ev,
        calId: ev.id + '-' + suffix,
        venue: v.venue,
        address: v.address,
        schedule: v.schedule,
        endTime: v.endTime
      });
    });
  } else {
    allEvents.push({ ...ev, calId: ev.id });
  }
});

EVENTS_GROOM.forEach(ev => {
  if (ev.venues) {
    ev.venues.forEach((v, i) => {
      const suffix = i === 0 ? 'home' : 'hall';
      allEvents.push({
        ...ev,
        calId: 'groom-' + ev.id + '-' + suffix,
        venue: v.venue,
        address: v.address,
        schedule: v.schedule,
        endTime: v.endTime
      });
    });
  } else {
    allEvents.push({ ...ev, calId: 'groom-' + ev.id });
  }
});

allEvents.forEach(ev => {
  const filePath = path.join(calDir, ev.calId + '.ics');
  fs.writeFileSync(filePath, generateIcs(ev), 'utf8');
  console.log('Generated:', ev.calId + '.ics');
});
