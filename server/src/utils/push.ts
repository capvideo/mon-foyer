import webpush from 'web-push';
import { getDb } from '../db/index';

let _publicKey = '';

export async function initVapid(): Promise<void> {
  const db = await getDb();

  let pub = process.env.VAPID_PUBLIC || '';
  let priv = process.env.VAPID_PRIVATE || '';

  if (!pub || !priv) {
    const storedPub = await db.get('SELECT value FROM app_settings WHERE key = ?', 'vapid_public') as any;
    const storedPriv = await db.get('SELECT value FROM app_settings WHERE key = ?', 'vapid_private') as any;

    if (storedPub && storedPriv) {
      pub = storedPub.value;
      priv = storedPriv.value;
    } else {
      const keys = webpush.generateVAPIDKeys();
      pub = keys.publicKey;
      priv = keys.privateKey;
      await db.run(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
         RETURNING key`,
        'vapid_public', pub
      );
      await db.run(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
         RETURNING key`,
        'vapid_private', priv
      );
      console.log('🔑 VAPID keys generated and stored in DB');
    }
  }

  webpush.setVapidDetails('mailto:contact@cap-video.fr', pub, priv);
  _publicKey = pub;
  console.log('🔔 Push notifications ready');
}

export function getVapidPublicKey(): string {
  return _publicKey;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushToAll(payload: PushPayload, excludeMemberId?: string): Promise<void> {
  if (!_publicKey) return;
  const db = await getDb();
  let subs = await db.all('SELECT * FROM push_subscriptions') as any[];
  if (excludeMemberId) subs = subs.filter(s => s.member_id !== excludeMemberId);
  if (!subs.length) return;

  const message = JSON.stringify({ ...payload, icon: payload.icon || '/icons/icon-192.png' });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', sub.endpoint);
        }
      }
    })
  );
}

export async function sendPushToMember(memberId: string, payload: PushPayload): Promise<void> {
  if (!_publicKey) return;
  const db = await getDb();
  const subs = await db.all('SELECT * FROM push_subscriptions WHERE member_id = ?', memberId) as any[];
  if (!subs.length) return;

  const message = JSON.stringify({ ...payload, icon: payload.icon || '/icons/icon-192.png' });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', sub.endpoint);
        }
      }
    })
  );
}
