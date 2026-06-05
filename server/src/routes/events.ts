import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index';
import { JWT_SECRET } from '../middleware/auth';
import { sendPushToAll } from '../utils/push';

const router = Router();

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

// Exported so index.ts can register it BEFORE requireAuth — iOS Calendar sends
// ?token= in the URL, not an Authorization header, so it must bypass requireAuth.
export async function calendarIcsHandler(req: Request, res: Response): Promise<void> {
  const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).send('Token requis'); return; }
  try { jwt.verify(token, JWT_SECRET); } catch { res.status(401).send('Token invalide ou expiré'); return; }

  const db = await getDb();
  const { memberId } = req.query;
  let q = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];
  if (memberId) { q += ' AND member_ids LIKE ?'; params.push(`%"${memberId}"%`); }
  q += ' ORDER BY date ASC, time ASC';
  const rows = await db.all(q, ...params);

  const dtstamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  // Strip all colons from "HH:MM" or "HH:MM:SS", append "00" for "HH:MM" only
  const formatTime = (t: string) => t.replace(/:/g, '') + (t.length <= 5 ? '00' : '');

  // Returns a datetime string like "20260605T143000", or null for all-day events
  const toIcalDt = (date: string, time?: string | null): string | null =>
    time ? `${date.replace(/-/g, '')}T${formatTime(time)}` : null;

  // DTEND for all-day events must be exclusive (day after last day) per RFC 5545
  const nextDay = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  };

  // Fold lines > 75 chars per RFC 5545
  const fold = (line: string): string => {
    if (line.length <= 75) return line;
    let out = line.slice(0, 75);
    let pos = 75;
    while (pos < line.length) { out += '\r\n ' + line.slice(pos, pos + 74); pos += 74; }
    return out;
  };

  const escText = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const vevents = rows.map((e: any) => {
    const dtstart = toIcalDt(e.date, e.time);
    const dtend = toIcalDt(e.end_date || e.date, e.end_time || e.time);
    const allDayEnd = nextDay(e.end_date || e.date);
    const lines = [
      'BEGIN:VEVENT',
      fold(`UID:${e.id}@monfoyer`),
      `DTSTAMP:${dtstamp}`,
      dtstart ? fold(`DTSTART:${dtstart}`)         : `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      dtend   ? fold(`DTEND:${dtend}`)             : `DTEND;VALUE=DATE:${allDayEnd}`,
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
    'PRODID:-//Mon Foyer//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mon Foyer',
    'X-WR-TIMEZONE:Europe/Paris',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="mon-foyer.ics"');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.send(ics);
}

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

router.get('/:id/ics', async (req, res) => {
  const db = await getDb();
  const e = await db.get<any>('SELECT * FROM events WHERE id = ?', req.params.id);
  if (!e) return res.status(404).json({ error: 'Non trouvé' });

  const formatTime = (t: string) => t.replace(/:/g, '') + (t.length <= 5 ? '00' : '');
  const dtstamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  let dtstart: string, dtend: string;
  if (e.time) {
    dtstart = `DTSTART:${e.date.replace(/-/g, '')}T${formatTime(e.time)}`;
    const endDate = e.end_date || e.date;
    const endTime = e.end_time || e.time;
    dtend = `DTEND:${endDate.replace(/-/g, '')}T${formatTime(endTime)}`;
  } else {
    dtstart = `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`;
    const endDate = e.end_date || e.date;
    const d = new Date(endDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    dtend = `DTEND;VALUE=DATE:${d.toISOString().slice(0, 10).replace(/-/g, '')}`;
  }

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mon Foyer//FR',
    'BEGIN:VEVENT',
    `UID:${e.id}@monfoyer`,
    `DTSTAMP:${dtstamp}`,
    dtstart, dtend,
    `SUMMARY:${e.title.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')}`,
    e.description ? `DESCRIPTION:${e.description.replace(/\n/g, '\\n')}` : '',
    e.location ? `LOCATION:${e.location}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${e.title}.ics"`);
  res.send(ics);
});

export default router;
