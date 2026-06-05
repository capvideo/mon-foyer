import { Router } from 'express';
import { getDb } from '../db/index';
import { sendPushToAll } from '../utils/push';

const router = Router();

router.get('/channels', async (_req, res) => {
  const db = await getDb();
  const channels = await db.all('SELECT * FROM channels');
  res.json(channels.map((c: any) => ({ ...c, memberIds: JSON.parse(c.member_ids) })));
});

router.get('/channels/:id', async (req, res) => {
  const db = await getDb();
  const c = await db.get<any>('SELECT * FROM channels WHERE id = ?', req.params.id);
  if (!c) return res.status(404).json({ error: 'Canal non trouvé' });
  res.json({ ...c, memberIds: JSON.parse(c.member_ids) });
});

router.get('/channels/:id/messages', async (req, res) => {
  const db = await getDb();
  const { limit = 50, before } = req.query;
  let q = 'SELECT * FROM messages WHERE channel_id = ?';
  const params: any[] = [req.params.id];

  if (before) { q += ' AND id < ?'; params.push(before); }
  q += ` ORDER BY timestamp DESC LIMIT ${Number(limit)}`;

  const rows = await db.all(q, ...params);
  res.json(rows.reverse());
});

router.post('/channels/:id/messages', async (req, res) => {
  const db = await getDb();
  const { memberId, content, type, metadata } = req.body;
  const r = await db.run(
    'INSERT INTO messages (channel_id,member_id,content,type,timestamp,metadata) VALUES (?,?,?,?,?,?)',
    req.params.id, memberId, content, type || 'text',
    new Date().toISOString(), metadata ? JSON.stringify(metadata) : null
  );
  const msg = await db.get('SELECT * FROM messages WHERE id = ?', r.lastID);
  sendPushToAll({ title: '💬 Nouveau message', body: (content as string).slice(0, 120), url: '/' }, memberId as string).catch(() => {});
  res.status(201).json(msg);
});

export default router;
