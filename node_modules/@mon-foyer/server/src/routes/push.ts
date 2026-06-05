import { Router } from 'express';
import { getDb } from '../db/index';
import { getVapidPublicKey } from '../utils/push';

const router = Router();

router.get('/vapid-public', (_req, res) => {
  res.json({ key: getVapidPublicKey() });
});

router.post('/subscribe', async (req, res) => {
  const db = await getDb();
  const { memberId, subscription } = req.body;
  const { endpoint, keys } = subscription;
  await db.run('DELETE FROM push_subscriptions WHERE member_id=? AND endpoint=?', memberId, endpoint);
  await db.run(
    'INSERT INTO push_subscriptions (member_id,endpoint,p256dh,auth,created_at) VALUES (?,?,?,?,?)',
    memberId, endpoint, keys.p256dh, keys.auth, new Date().toISOString()
  );
  res.json({ success: true });
});

router.delete('/unsubscribe', async (req, res) => {
  const db = await getDb();
  const { memberId } = req.body;
  await db.run('DELETE FROM push_subscriptions WHERE member_id=?', memberId);
  res.json({ success: true });
});

export default router;
