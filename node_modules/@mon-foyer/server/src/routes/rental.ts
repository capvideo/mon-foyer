import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

router.get('/properties', async (_req, res) => {
  const db = await getDb();
  res.json(await db.all('SELECT * FROM rental_properties ORDER BY id'));
});

router.put('/properties/:id', async (req, res) => {
  const db = await getDb();
  const { name, credit_label, credit_amount, rent_label, rent_amount } = req.body;
  await db.run(
    'UPDATE rental_properties SET name=?, credit_label=?, credit_amount=?, rent_label=?, rent_amount=? WHERE id=?',
    name, credit_label, credit_amount, rent_label, rent_amount, req.params.id
  );
  res.json(await db.get('SELECT * FROM rental_properties WHERE id = ?', req.params.id));
});

router.get('/month/:propertyId/:month', async (req, res) => {
  const db = await getDb();
  let row = await db.get(
    'SELECT * FROM rental_month_data WHERE property_id = ? AND month = ?',
    req.params.propertyId, req.params.month
  ) as any;
  if (!row) {
    await db.run(
      `INSERT INTO rental_month_data (property_id, month) VALUES (?, ?)
       ON CONFLICT (property_id, month) DO NOTHING`,
      req.params.propertyId, req.params.month
    );
    row = await db.get(
      'SELECT * FROM rental_month_data WHERE property_id = ? AND month = ?',
      req.params.propertyId, req.params.month
    ) as any;
  }
  res.json({
    ...row,
    rent_validated: !!row?.rent_validated,
    copro_charges: JSON.parse(row?.copro_charges ?? '[]'),
    agence_charges: JSON.parse(row?.agence_charges ?? '[]'),
  });
});

router.put('/month/:propertyId/:month', async (req, res) => {
  const db = await getDb();
  const { rent_validated, rent_date, copro_charges, agence_charges } = req.body;
  await db.run(
    `INSERT INTO rental_month_data (property_id, month, rent_validated, rent_date, copro_charges, agence_charges)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (property_id, month) DO UPDATE SET
       rent_validated = EXCLUDED.rent_validated,
       rent_date = EXCLUDED.rent_date,
       copro_charges = EXCLUDED.copro_charges,
       agence_charges = EXCLUDED.agence_charges`,
    req.params.propertyId, req.params.month,
    rent_validated ? 1 : 0,
    rent_date ?? null,
    JSON.stringify(copro_charges ?? []),
    JSON.stringify(agence_charges ?? [])
  );
  const row = await db.get(
    'SELECT * FROM rental_month_data WHERE property_id = ? AND month = ?',
    req.params.propertyId, req.params.month
  ) as any;
  res.json({
    ...row,
    rent_validated: !!row?.rent_validated,
    copro_charges: JSON.parse(row?.copro_charges ?? '[]'),
    agence_charges: JSON.parse(row?.agence_charges ?? '[]'),
  });
});

export default router;
