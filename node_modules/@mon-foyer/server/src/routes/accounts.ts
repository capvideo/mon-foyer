import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await getDb();
  const accounts = await db.all('SELECT * FROM accounts');
  const result = await Promise.all(accounts.map(async (acc: any) => {
    const sums = await db.get<any>(`
      SELECT
        COALESCE(SUM(CASE WHEN type='income' AND validated=1 THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type='expense' AND validated=1 THEN amount ELSE 0 END), 0) AS total_expense
      FROM transactions WHERE account_id = ?
    `, acc.id);
    const balance = acc.initial_balance + sums.total_income - sums.total_expense;
    return { ...acc, balance: Math.round(balance * 100) / 100 };
  }));
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const acc = await db.get('SELECT * FROM accounts WHERE id = ?', req.params.id);
  if (!acc) return res.status(404).json({ error: 'Compte non trouvé' });
  res.json(acc);
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { name, bank, initialBalance, color } = req.body;
  const r = await db.run(
    'INSERT INTO accounts (name, bank, initial_balance, color) VALUES (?, ?, ?, ?)',
    name, bank, initialBalance ?? 0, color ?? '#378ADD'
  );
  res.status(201).json(await db.get('SELECT * FROM accounts WHERE id = ?', r.lastID));
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { name, bank, initialBalance, color } = req.body;
  await db.run(
    'UPDATE accounts SET name=?, bank=?, initial_balance=?, color=? WHERE id=?',
    name, bank, initialBalance, color, req.params.id
  );
  res.json(await db.get('SELECT * FROM accounts WHERE id = ?', req.params.id));
});

export default router;
