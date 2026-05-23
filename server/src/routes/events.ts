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
