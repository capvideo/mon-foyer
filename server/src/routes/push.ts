import { Router } from 'express';
import { getDb } from '../db/index';

const router = Router();

const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

router.get('/vapid-public', (_req, res) => {
  res.json({ key: VAPID_PUBLIC });
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
