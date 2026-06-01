import { Router } from 'express';
import { getDb } from '../db/index';

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

// Must come before /:id to avoid "calendar.ics" being matched as an ID
router.get('/calendar.ics', async (req, res) => {
  const db = await getDb();
  const { memberId } = req.query;
  let q = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];
  if (memberId) { q += ' AND member_ids LIKE ?'; params.push(`%"${memberId}"%`); }
  q += ' ORDER BY date ASC, time ASC';
  const rows = await db.all(q, ...params);

  const toIcalDt = (date: string, time?: string | null) =>
    time ? `${date.replace(/-/g, '')}T${time.replace(':', '')}00` : null;

  const vevents = rows.map((e: any) => {
    const dtstart = toIcalDt(e.date, e.time);
    const dtend = toIcalDt(e.end_date || e.date, e.end_time || e.time);
    const lines = [
      'BEGIN:VEVENT',
      `UID:${e.id}@monfoyer`,
      dtstart ? `DTSTART:${dtstart}` : `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      dtend   ? `DTEND:${dtend}`     : `DTEND;VALUE=DATE:${(e.end_date || e.date).replace(/-/g, '')}`,
      `SUMMARY:${e.title.replace(/\n/g, '\\n')}`,
      e.description ? `DESCRIPTION:${e.description.replace(/\n/g, '\\n')}` : '',
      e.location    ? `LOCATION:${e.location}` : '',
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

  const dtstart = e.date.replace(/-/g, '') + (e.time ? 'T' + e.time.replace(':', '') + '00' : '');
  const dtend = e.end_date
    ? e.end_date.replace(/-/g, '') + (e.end_time ? 'T' + e.end_time.replace(':', '') + '00' : '')
    : dtstart;

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mon Foyer//FR',
    'BEGIN:VEVENT',
    `UID:${e.id}@monfoyer`,
    `DTSTART:${dtstart}`, `DTEND:${dtend}`,
    `SUMMARY:${e.title}`,
    e.description ? `DESCRIPTION:${e.description}` : '',
    e.location ? `LOCATION:${e.location}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="${e.title}.ics"`);
  res.send(ics);
});

export default router;
