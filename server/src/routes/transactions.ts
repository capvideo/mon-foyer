import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

const CATEGORY_RULES: { pattern: RegExp; category: string; type: string }[] = [
  { pattern: /CAP\s?VIDEO/i, category: 'salaires', type: 'income' },
  { pattern: /CIP\s?GESTION/i, category: 'cip_gestion', type: 'income' },
  { pattern: /SPOTIFY/i, category: 'abonnements', type: 'expense' },
  { pattern: /BOUYGUES/i, category: 'telecom', type: 'expense' },
  { pattern: /\bFREE\b/i, category: 'telecom', type: 'expense' },
  { pattern: /ASSURANCE|PACIFICA|ACM|PREDICA/i, category: 'assurances', type: 'expense' },
  { pattern: /\bCAF\b/i, category: 'caf', type: 'income' },
  { pattern: /LOYER|BAIL/i, category: 'loyer_residence', type: 'expense' },
  { pattern: /CREDIT|PR[ÊE]T/i, category: 'credit_immo', type: 'expense' },
  { pattern: /LECLERC|CARREFOUR|AUCHAN|LIDL|INTERMARCHE|CASINO/i, category: 'courses', type: 'expense' },
  { pattern: /EPARGNE|LIVRET/i, category: 'epargne', type: 'expense' },
  { pattern: /\bDON\b|CROIX.?ROUGE/i, category: 'dons', type: 'expense' },
];

function autoCateg(label: string): { category: string; type: string } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(label)) return { category: rule.category, type: rule.type };
  }
  return { category: 'autre', type: 'expense' };
}

// NOTE: /import-csv must come before /:id to avoid routing conflict
router.post('/import-csv', async (req, res) => {
  const db = await getDb();
  const { rows, accountId } = req.body as { rows: any[]; accountId: number };
  let imported = 0;
  for (const row of rows) {
    const autoC = autoCateg(row.label);
    await db.run(
      'INSERT INTO transactions (account_id,label,amount,type,category,date,validated,member_id,notes,is_rental) VALUES (?,?,?,?,?,?,0,null,null,0)',
      accountId, row.label, row.amount, autoC.type, autoC.category, row.date
    );
    imported++;
  }
  res.json({ imported });
});

router.get('/', async (req, res) => {
  const db = await getDb();
  const { accountId, month, category, type, rental } = req.query;
  let q = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (accountId) { q += ' AND account_id = ?'; params.push(accountId); }
  if (month) { q += ' AND date LIKE ?'; params.push(`${month}%`); }
  if (category) { q += ' AND category = ?'; params.push(category); }
  if (type) { q += ' AND type = ?'; params.push(type); }
  if (rental === '1') { q += ' AND is_rental = 1'; }
  else if (rental === '0') { q += ' AND is_rental = 0'; }
  q += ' ORDER BY date DESC';

  res.json(await db.all(q, ...params));
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const { accountId, label, amount, type, category, date, validated, memberId, notes, isRental } = req.body;
  const autoC = autoCateg(label);
  const r = await db.run(
    'INSERT INTO transactions (account_id,label,amount,type,category,date,validated,member_id,notes,is_rental) VALUES (?,?,?,?,?,?,?,?,?,?)',
    accountId, label, amount,
    type || autoC.type, category || autoC.category,
    date, validated ? 1 : 0, memberId || null, notes || null, isRental ? 1 : 0
  );
  res.status(201).json(await db.get('SELECT * FROM transactions WHERE id = ?', r.lastID));
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { label, amount, type, category, date, validated, memberId, notes, isRental } = req.body;
  await db.run(
    'UPDATE transactions SET label=?,amount=?,type=?,category=?,date=?,validated=?,member_id=?,notes=?,is_rental=? WHERE id=?',
    label, amount, type, category, date, validated ? 1 : 0, memberId || null, notes || null, isRental ? 1 : 0, req.params.id
  );
  res.json(await db.get('SELECT * FROM transactions WHERE id = ?', req.params.id));
});

router.patch('/:id/validate', async (req, res) => {
  const db = await getDb();
  const { validated } = req.body;
  await db.run('UPDATE transactions SET validated=? WHERE id=?', validated ? 1 : 0, req.params.id);
  res.json(await db.get('SELECT * FROM transactions WHERE id = ?', req.params.id));
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM transactions WHERE id=?', req.params.id);
  res.json({ success: true });
});

export default router;
