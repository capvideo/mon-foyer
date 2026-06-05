import { Router } from 'express';
import { getDb } from '../db/index';
import { sendPushToAll } from '../utils/push';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await getDb();
  res.json(await db.all('SELECT * FROM shopping_items ORDER BY category, name'));
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { name, category, quantity, unit, addedBy } = req.body;
  const r = await db.run(
    'INSERT INTO shopping_items (name,category,quantity,unit,checked,added_by,created_at) VALUES (?,?,?,?,0,?,?)',
    name, category, quantity || null, unit || null, addedBy || null, new Date().toISOString()
  );
  const item = await db.get('SELECT * FROM shopping_items WHERE id = ?', r.lastID);
  sendPushToAll({ title: '🛒 Liste de courses', body: `${name} ajouté`, url: '/?tab=courses' }, addedBy as string).catch(() => {});
  res.status(201).json(item);
});

// NOTE: /checked/all must come before /:id
router.delete('/checked/all', async (_req, res) => {
  const db = await getDb();
  const r = await db.run('DELETE FROM shopping_items WHERE checked=1');
  res.json({ deleted: r.changes });
});

router.patch('/:id/check', async (req, res) => {
  const db = await getDb();
  const { checked } = req.body;
  await db.run('UPDATE shopping_items SET checked=? WHERE id=?', checked ? 1 : 0, req.params.id);
  res.json(await db.get('SELECT * FROM shopping_items WHERE id = ?', req.params.id));
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { name, category, quantity, unit } = req.body;
  await db.run(
    'UPDATE shopping_items SET name=?,category=?,quantity=?,unit=? WHERE id=?',
    name, category, quantity || null, unit || null, req.params.id
  );
  res.json(await db.get('SELECT * FROM shopping_items WHERE id = ?', req.params.id));
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM shopping_items WHERE id=?', req.params.id);
  res.json({ success: true });
});

export default router;
