import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const { assignedTo, status, priority } = req.query;
  let q = 'SELECT * FROM todos WHERE 1=1';
  const params: any[] = [];

  if (assignedTo) { q += ' AND assigned_to = ?'; params.push(assignedTo); }
  if (status) { q += ' AND status = ?'; params.push(status); }
  if (priority) { q += ' AND priority = ?'; params.push(priority); }
  q += " ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, due_date ASC";

  res.json(await db.all(q, ...params));
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { title, description, priority, assignedTo, status, dueDate, eventId } = req.body;
  const r = await db.run(
    'INSERT INTO todos (title,description,priority,assigned_to,status,due_date,event_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    title, description || null, priority || 'normal', assignedTo || null,
    status || 'pending', dueDate || null, eventId || null, new Date().toISOString()
  );
  res.status(201).json(await db.get('SELECT * FROM todos WHERE id = ?', r.lastID));
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { title, description, priority, assignedTo, status, dueDate, eventId } = req.body;
  await db.run(
    'UPDATE todos SET title=?,description=?,priority=?,assigned_to=?,status=?,due_date=?,event_id=? WHERE id=?',
    title, description || null, priority, assignedTo || null, status, dueDate || null, eventId || null, req.params.id
  );
  res.status(200).json(await db.get('SELECT * FROM todos WHERE id = ?', req.params.id));
});

router.patch('/:id/status', async (req, res) => {
  const db = await getDb();
  const { status } = req.body;
  await db.run('UPDATE todos SET status=? WHERE id=?', status, req.params.id);
  res.json(await db.get('SELECT * FROM todos WHERE id = ?', req.params.id));
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM todos WHERE id=?', req.params.id);
  res.json({ success: true });
});

export default router;
