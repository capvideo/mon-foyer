import { randomBytes } from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index';
import { requireAuth, JWT_SECRET, AuthRequest } from '../middleware/auth';
import { sendInviteEmail } from '../utils/mailer';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: 'Email et mot de passe requis' }); return; }
  const db = await getDb();
  const member = await db.get<any>('SELECT * FROM members WHERE email = ?', email.toLowerCase().trim());
  if (!member?.password_hash || !await bcrypt.compare(password, member.password_hash)) {
    res.status(401).json({ error: 'Identifiants incorrects' }); return;
  }
  const token = jwt.sign(
    { memberId: member.id, name: member.name, email: member.email },
    JWT_SECRET, { expiresIn: '30d' }
  );
  const { password_hash: _, ...memberData } = member;
  res.json({ token, member: memberData });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDb();
  const member = await db.get('SELECT id, name, color, emoji, email, is_admin FROM members WHERE id = ?', req.user!.memberId);
  if (!member) { res.status(404).json({ error: 'Membre non trouvé' }); return; }
  res.json(member);
});

// Admin: create an invite for an unregistered member
router.post('/invite', requireAuth, async (req: AuthRequest, res) => {
  const db = await getDb();
  const admin = await db.get<any>('SELECT is_admin FROM members WHERE id = ?', req.user!.memberId);
  if (!admin?.is_admin) { res.status(403).json({ error: 'Accès réservé à l\'administrateur' }); return; }

  const { memberId, email } = req.body as { memberId?: string; email?: string };
  if (!memberId || !email) { res.status(400).json({ error: 'memberId et email requis' }); return; }

  const member = await db.get<any>('SELECT * FROM members WHERE id = ?', memberId);
  if (!member) { res.status(404).json({ error: 'Membre non trouvé' }); return; }
  if (member.password_hash) { res.status(400).json({ error: 'Ce membre a déjà un compte' }); return; }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Invalidate any previous invite for this member
  await db.run('DELETE FROM invites WHERE member_id = ? AND used_at IS NULL', memberId);
  await db.run(
    'INSERT INTO invites (token, member_id, email, created_by, expires_at) VALUES (?, ?, ?, ?, ?) RETURNING token',
    token, memberId, email.toLowerCase().trim(), req.user!.memberId, expiresAt
  );

  const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
  const inviteUrl = `${appUrl}/join?token=${token}`;

  const emailSent = await sendInviteEmail(email, member.name, inviteUrl).catch(() => false);

  res.json({ inviteUrl, expiresAt, emailSent });
});

// Public: validate an invite token and return member preview
router.get('/invite/:token', async (req, res) => {
  const db = await getDb();
  const invite = await db.get<any>(
    `SELECT i.token, i.email, i.expires_at, m.id AS member_id, m.name, m.color, m.emoji
     FROM invites i JOIN members m ON i.member_id = m.id
     WHERE i.token = ? AND i.used_at IS NULL AND i.expires_at > ?`,
    req.params.token, new Date().toISOString()
  );
  if (!invite) { res.status(404).json({ error: 'Invitation invalide ou expirée' }); return; }
  res.json({ memberId: invite.member_id, name: invite.name, color: invite.color, emoji: invite.emoji, email: invite.email });
});

// Public: register from invite
router.post('/register', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password || password.length < 6) {
    res.status(400).json({ error: 'Token et mot de passe (6 caractères min) requis' }); return;
  }
  const db = await getDb();
  const invite = await db.get<any>(
    `SELECT i.*, m.name, m.color, m.emoji FROM invites i JOIN members m ON i.member_id = m.id
     WHERE i.token = ? AND i.used_at IS NULL AND i.expires_at > ?`,
    token, new Date().toISOString()
  );
  if (!invite) { res.status(404).json({ error: 'Invitation invalide ou expirée' }); return; }

  const hash = await bcrypt.hash(password, 10);
  await db.run(
    'UPDATE members SET email = ?, password_hash = ? WHERE id = ?',
    invite.email, hash, invite.member_id
  );
  await db.run('UPDATE invites SET used_at = ? WHERE token = ?', new Date().toISOString(), token);

  const jwtToken = jwt.sign(
    { memberId: invite.member_id, name: invite.name, email: invite.email },
    JWT_SECRET, { expiresIn: '30d' }
  );
  const member = await db.get('SELECT id, name, color, emoji, email, is_admin FROM members WHERE id = ?', invite.member_id);
  res.json({ token: jwtToken, member });
});

export default router;
