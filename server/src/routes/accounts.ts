import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

const RESET_MONTH = '2026-06';

function getPrevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function getNextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

async function getOpeningBalance(db: any, accountId: number, month: string): Promise<number> {
  const stored = await db.get(
    'SELECT opening_balance FROM monthly_balances WHERE account_id = ? AND month = ?',
    accountId, month
  ) as any;
  if (stored) return stored.opening_balance;

  // June 2026 is the reset point — fresh start at 0
  if (month <= RESET_MONTH) return 0;

  const prevMonth = getPrevMonth(month);
  const prevOpening = await getOpeningBalance(db, accountId, prevMonth);
  const prevSums = await db.get(`
    SELECT
      COALESCE(SUM(CASE WHEN type='income' AND validated=1 THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type='expense' AND validated=1 THEN amount ELSE 0 END), 0) AS total_expense
    FROM transactions
    WHERE account_id = ? AND date >= ? AND date < ?
  `, accountId, `${prevMonth}-01`, `${month}-01`) as any;
  return prevOpening + prevSums.total_income - prevSums.total_expense;
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const month = req.query.month as string | undefined;
  const accounts = await db.all('SELECT * FROM accounts');

  const result = await Promise.all(accounts.map(async (acc: any) => {
    let balance: number;
    let opening: number;

    if (month && month >= RESET_MONTH) {
      opening = await getOpeningBalance(db, acc.id, month);
      const sums = await db.get<any>(`
        SELECT
          COALESCE(SUM(CASE WHEN type='income' AND validated=1 THEN amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type='expense' AND validated=1 THEN amount ELSE 0 END), 0) AS total_expense
        FROM transactions
        WHERE account_id = ? AND date >= ? AND date < ?
      `, acc.id, `${month}-01`, `${getNextMonth(month)}-01`);
      balance = opening + sums.total_income - sums.total_expense;
    } else {
      opening = acc.initial_balance;
      const sums = await db.get<any>(`
        SELECT
          COALESCE(SUM(CASE WHEN type='income' AND validated=1 THEN amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type='expense' AND validated=1 THEN amount ELSE 0 END), 0) AS total_expense
        FROM transactions WHERE account_id = ?
      `, acc.id);
      balance = acc.initial_balance + sums.total_income - sums.total_expense;
    }

    return {
      ...acc,
      balance: Math.round(balance * 100) / 100,
      opening_balance: Math.round(opening * 100) / 100,
    };
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

// Manually set the opening balance for an account/month
router.post('/:id/monthly-balance', async (req, res) => {
  const db = await getDb();
  const { month, opening_balance } = req.body;
  await db.run(
    `INSERT INTO monthly_balances (account_id, month, opening_balance) VALUES (?, ?, ?)
     ON CONFLICT (account_id, month) DO UPDATE SET opening_balance = EXCLUDED.opening_balance
     RETURNING account_id`,
    req.params.id, month, opening_balance
  );
  res.json({ success: true });
});

export default router;
