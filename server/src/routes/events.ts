import { Router } from 'express';
import { getDb } from '../db/index';
import { sendPushToAll } from '../utils/push';

const router = Router();

// ── Helpers shared by both iCal endpoints ──────────────────────────────────

const formatTime = (t: string) => t.replace(/:/g, '') + (t.length <= 5 ? '00' : '');

const toIcalDt = (date: string, time?: string | null): string | null =>
  time ? `${date.replace(/-/g, '')}T${formatTime(time)}` : null;

// DTEND for all-day events is exclusive (next day) per RFC 5545.
// Uses UTC arithmetic to avoid timezone-dependent results on the server.
const nextDay = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, '0')}${String(dt.getUTCDate()).padStart(2, '0')}`;
};

// Fold lines > 75 octets per RFC 5545
const fold = (line: string): string => {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let pos = 75;
  while (pos < line.length) { out += '\r\n ' + line.slice(pos, pos + 74); pos += 74; }
  return out;
};

const escText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const dtstampNow = () => new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

// ── Routes ─────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const db = await getDb();
  const { month, memberId } = req.query;
  let q = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];

  if (month) { q += ' AND date LIKE ?'; params.push(`${month}%`); }
  if (memberId) { q += ' AND member_ids LIKE ?'; params.push(`%"${memberId}"%`); }
  q += ' ORDER BY date ASC, time ASC';

  const rows = await db.all(q, ...params);
  res.json(rows.map((e: any) => ({ ...e, memberIds: JSON.parse(e.member_ids) })));
});

// iCal subscription feed.
// Auth is handled by requireAuth which accepts ?token= for this path —
// calendar apps cannot send Authorization headers, so the JWT is embedded in the URL.
// Must come before /:id so "calendar.ics" is not matched as an event ID.
router.get('/calendar.ics', async (req, res) => {
  const db = await getDb();
  const { memberId } = req.query;
  let q = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];
  if (memberId) { q += ' AND member_ids LIKE ?'; params.push(`%"${memberId}"%`); }
  q += ' ORDER BY date ASC, time ASC';
  const rows = await db.all(q, ...params);

  const dtstamp = dtstampNow();

  const vevents = rows.map((e: any) => {
    const dtstart = toIcalDt(e.date, e.time);
    const dtend = toIcalDt(e.end_date || e.date, e.end_time || e.time);
    const lines = [
      'BEGIN:VEVENT',
      fold(`UID:${e.id}@monfoyer`),
      `DTSTAMP:${dtstamp}`,
      dtstart ? fold(`DTSTART:${dtstart}`)   : `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      dtend   ? fold(`DTEND:${dtend}`)       : `DTEND;VALUE=DATE:${nextDay(e.end_date || e.date)}`,
      fold(`SUMMARY:${escText(e.title)}`),
      e.description ? fold(`DESCRIPTION:${escText(e.description)}`) : '',
      e.location    ? fold(`LOCATION:${escText(e.location)}`)       : '',
      'END:VEVENT',
    ].filter(Boolean);
    return lines.join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mon Foyer//Mon Foyer//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mon Foyer',
    'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="mon-foyer.ics"');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.send(ics);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const e = await db.get<any>('SELECT * FROM events WHERE id = ?', req.params.id);
  if (!e) return res.status(404).json({ error: 'Événement non trouvé' });
  res.json({ ...e, memberIds: JSON.parse(e.member_ids) });
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { title, date, time, endDate, endTime, description, memberIds, color, location, reminderMinutes } = req.body;
  const r = await db.run(
    'INSERT INTO events (title,date,time,end_date,end_time,description,member_ids,color,location,reminder_minutes) VALUES (?,?,?,?,?,?,?,?,?,?)',
    title, date, time || null, endDate || null, endTime || null,
    description || null, JSON.stringify(memberIds || []),
    color || '#378ADD', location || null, reminderMinutes || null
  );
  const e = await db.get<any>('SELECT * FROM events WHERE id = ?', r.lastID);
  sendPushToAll({ title: '📅 Nouvel événement', body: `${title} — ${date}`, url: '/?tab=agenda' }).catch(() => {});
  res.status(201).json({ ...e, memberIds: JSON.parse(e.member_ids) });
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { title, date, time, endDate, endTime, description, memberIds, color, location, reminderMinutes } = req.body;
  await db.run(
    'UPDATE events SET title=?,date=?,time=?,end_date=?,end_time=?,description=?,member_ids=?,color=?,location=?,reminder_minutes=? WHERE id=?',
    title, date, time || null, endDate || null, endTime || null,
    description || null, JSON.stringify(memberIds || []),
    color || '#378ADD', location || null, reminderMinutes || null, req.params.id
  );
  const e = await db.get<any>('SELECT * FROM events WHERE id = ?', req.params.id);
  sendPushToAll({ title: '📅 Événement modifié', body: `${title}`, url: '/?tab=agenda' }).catch(() => {});
  res.json({ ...e, memberIds: JSON.parse(e.member_ids) });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM events WHERE id=?', req.params.id);
  res.json({ success: true });
});

// Single-event .ics download (for adding one event to a calendar)
router.get('/:id/ics', async (req, res) => {
  const db = await getDb();
  const e = await db.get<any>('SELECT * FROM events WHERE id = ?', req.params.id);
  if (!e) return res.status(404).json({ error: 'Non trouvé' });

  const dtstamp = dtstampNow();

  let dtstart: string, dtend: string;
  if (e.time) {
    dtstart = `DTSTART:${e.date.replace(/-/g, '')}T${formatTime(e.time)}`;
    const endDate = e.end_date || e.date;
    const endTime = e.end_time || e.time;
    dtend = `DTEND:${endDate.replace(/-/g, '')}T${formatTime(endTime)}`;
  } else {
    dtstart = `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`;
    dtend = `DTEND;VALUE=DATE:${nextDay(e.end_date || e.date)}`;
  }

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mon Foyer//Mon Foyer//FR',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}@monfoyer`,
    `DTSTAMP:${dtstamp}`,
    dtstart, dtend,
    fold(`SUMMARY:${escText(e.title)}`),
    e.description ? fold(`DESCRIPTION:${escText(e.description)}`) : '',
    e.location    ? fold(`LOCATION:${escText(e.location)}`)       : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n') + '\r\n';

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${e.title}.ics"`);
  res.send(ics);
});

export default router;
